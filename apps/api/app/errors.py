import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

log = logging.getLogger("app")

_HTTP_CODES = {401: "unauthorized", 403: "not_found", 404: "not_found", 405: "not_found", 429: "rate_limited"}


class ApiError(Exception):
    def __init__(self, status: int, code: str, message: str) -> None:
        self.status, self.code, self.message = status, code, message


def _body(code: str, message: str) -> dict:
    return {"error": {"code": code, "message": message}}


def install_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(ApiError)
    async def _api_error(_: Request, exc: ApiError) -> JSONResponse:
        return JSONResponse(_body(exc.code, exc.message), status_code=exc.status)

    @app.exception_handler(RequestValidationError)
    async def _validation(_: Request, exc: RequestValidationError) -> JSONResponse:
        # Do not echo user input back (may contain personal text).
        fields = sorted({".".join(str(p) for p in err.get("loc", ())) for err in exc.errors()})
        return JSONResponse(_body("validation_error", "invalid: " + ", ".join(fields)), status_code=422)

    @app.exception_handler(StarletteHTTPException)
    async def _http(_: Request, exc: StarletteHTTPException) -> JSONResponse:
        status = 404 if exc.status_code == 403 else exc.status_code
        return JSONResponse(_body(_HTTP_CODES.get(status, "error"), "request failed"), status_code=status)

    @app.exception_handler(Exception)
    async def _unhandled(_: Request, exc: Exception) -> JSONResponse:
        # EXC-01: fail closed, no internals in the response; log type only.
        log.error("unhandled_error type=%s", type(exc).__name__)
        return JSONResponse(_body("internal", "internal error"), status_code=500)

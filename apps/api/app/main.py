import logging

from fastapi import FastAPI

from app.config import Settings, get_settings
from app.db import make_engine, make_sessionmaker
from app.errors import install_error_handlers
from app.oidc import OIDCVerifier
from app.routes import admin, auth, realtime, translate
from app.translators import Translator, build_translator


def create_app(
    settings: Settings | None = None,
    verifier: OIDCVerifier | None = None,
    translator: Translator | None = None,
) -> FastAPI:
    settings = settings or get_settings()
    settings.assert_safe()
    logging.basicConfig(level=logging.INFO)

    app = FastAPI(
        title="translate-meet API",
        version="0.1.0",
        docs_url=None if settings.env == "prod" else "/docs",
        redoc_url=None,
        openapi_url=None if settings.env == "prod" else "/openapi.json",
    )
    engine = make_engine(settings.database_url)
    app.state.settings = settings
    app.state.engine = engine
    app.state.sessionmaker = make_sessionmaker(engine)
    app.state.verifier = verifier or OIDCVerifier(
        {"apple": settings.apple_client_ids, "google": settings.google_client_ids}
    )
    app.state.translator = translator or build_translator(settings)

    install_error_handlers(app)

    @app.get("/healthz")
    def healthz() -> dict:
        return {"status": "ok"}

    app.include_router(auth.router)
    app.include_router(translate.router)
    app.include_router(realtime.router)
    app.include_router(admin.router)
    return app

import asyncio
import contextlib
import json
import logging
import time
import uuid

import jwt
from fastapi import FastAPI, WebSocket, WebSocketDisconnect

from app.config import Settings, get_settings
from app.protocol import AudioMsg, AuthMsg, ProtocolError, StartMsg, StopMsg, TextMsg, parse_client_message
from app.providers import ProviderSpec, RealtimeTranslator, build_registry
from app.quota_client import HttpQuotaClient, QuotaClient, QuotaExhausted, QuotaMeter, QuotaUnavailable
from app.routing import NoProvider, choose_provider

REALTIME_AUDIENCE = "translate-meet-gateway"

CLOSE_AUTH, CLOSE_QUOTA, CLOSE_ORIGIN, CLOSE_TIMEOUT = 4401, 4402, 4403, 4408
CLOSE_BAD_MESSAGE, CLOSE_RATE, CLOSE_SERVER = 4422, 4429, 1011

log = logging.getLogger("gateway")


def _event(event: str, **fields: str | int | None) -> None:
    # LOG-02: ids and codes only; never audio, captions or tokens.
    log.info(json.dumps({"event": event, **fields}, separators=(",", ":")))


class _Close(Exception):
    def __init__(self, code: int, error: str | None = None) -> None:
        self.code, self.error = code, error


def verify_realtime_token(settings: Settings, token: str) -> dict:
    claims = jwt.decode(
        token,
        settings.rt_token_secret.get_secret_value(),
        algorithms=["HS256"],
        audience=REALTIME_AUDIENCE,
        issuer=settings.jwt_issuer,
        options={"require": ["exp", "iat", "sub", "aud", "iss", "jti"]},
    )
    if claims.get("typ") != "rt":
        raise jwt.InvalidTokenError("wrong token type")
    return claims


class _RateLimiter:
    def __init__(self, per_second: int) -> None:
        self._limit, self._window, self._count = per_second, time.monotonic(), 0

    def allow(self) -> bool:
        now = time.monotonic()
        if now - self._window >= 1.0:
            self._window, self._count = now, 0
        self._count += 1
        return self._count <= self._limit


def create_app(
    settings: Settings | None = None,
    quota_client: QuotaClient | None = None,
    registry: dict[str, ProviderSpec] | None = None,
) -> FastAPI:
    settings = settings or get_settings()
    settings.assert_safe()
    logging.basicConfig(level=logging.INFO)
    app = FastAPI(title="translate-meet gateway", docs_url=None, redoc_url=None, openapi_url=None)
    app.state.settings = settings
    app.state.quota = quota_client or HttpQuotaClient(
        settings.api_internal_url, settings.internal_service_token.get_secret_value()
    )
    app.state.registry = registry if registry is not None else build_registry(settings)

    @app.get("/healthz")
    def healthz() -> dict:
        return {"status": "ok"}

    @app.websocket("/v1/converse")
    async def converse(ws: WebSocket) -> None:
        await _converse(ws, settings, app.state.quota, app.state.registry)

    return app


async def _receive(ws: WebSocket, settings: Settings, timeout: float | None = None):
    try:
        raw = await asyncio.wait_for(ws.receive_text(), timeout) if timeout else await ws.receive_text()
    except TimeoutError as exc:
        raise _Close(CLOSE_TIMEOUT, "timeout") from exc
    try:
        return parse_client_message(raw, settings.max_message_bytes)
    except ProtocolError as exc:
        raise _Close(CLOSE_BAD_MESSAGE, "bad_message") from exc


async def _converse(
    ws: WebSocket, settings: Settings, quota_client: QuotaClient, registry: dict[str, ProviderSpec]
) -> None:
    await ws.accept()
    session_id = str(uuid.uuid4())
    meter: QuotaMeter | None = None
    translator: RealtimeTranslator | None = None
    try:
        # API-04: Origin allow-list when present (browsers); native clients send none.
        origin = ws.headers.get("origin")
        if origin is not None and origin not in settings.allowed_origins:
            raise _Close(CLOSE_ORIGIN, "origin_not_allowed")

        auth = await _receive(ws, settings, settings.auth_timeout_seconds)
        if not isinstance(auth, AuthMsg):
            raise _Close(CLOSE_AUTH, "auth_required")
        try:
            claims = verify_realtime_token(settings, auth.token)
        except jwt.PyJWTError as exc:
            raise _Close(CLOSE_AUTH, "invalid_token") from exc
        user_id = claims["sub"]

        start = await _receive(ws, settings, settings.auth_timeout_seconds)
        if not isinstance(start, StartMsg):
            raise _Close(CLOSE_BAD_MESSAGE, "start_required")
        # The token binds the language pair; the client cannot switch to another (cost) route.
        if {start.source_lang, start.target_lang} != {claims["src"], claims["tgt"]}:
            raise _Close(CLOSE_AUTH, "language_mismatch")
        try:
            spec = choose_provider(
                settings.routes, registry, start.source_lang, start.target_lang, start.mode
            )
        except NoProvider as exc:
            raise _Close(CLOSE_BAD_MESSAGE, "unsupported_language_pair") from exc

        meter = QuotaMeter(quota_client, user_id, session_id, settings.quota_tick_seconds)
        try:
            first = await meter.start()
        except QuotaExhausted as exc:
            raise _Close(CLOSE_QUOTA, "quota_exceeded") from exc
        except QuotaUnavailable as exc:  # ARC-05 / EXC-01: fail closed
            raise _Close(CLOSE_SERVER, "quota_unavailable") from exc

        translator = spec.factory()
        await translator.start(start.source_lang, start.target_lang, start.mode)
        await ws.send_json({"type": "ready", "session_id": session_id, "provider": spec.name})
        await ws.send_json({"type": "quota_update", "realtime_seconds_remaining": first.remaining_after})
        _event("session_start", session_id=session_id, user_id=user_id, provider=spec.name)

        await _run_session(ws, settings, meter, translator)
    except _Close as close:
        if close.error:
            with contextlib.suppress(Exception):
                await ws.send_json({"type": "error", "code": close.error, "message": close.error})
        _event("session_close", session_id=session_id, code=close.code, reason=close.error)
        with contextlib.suppress(Exception):
            await ws.close(code=close.code)
    except WebSocketDisconnect:
        _event("session_disconnect", session_id=session_id)
    except Exception as exc:
        log.error("session_error session=%s type=%s", session_id, type(exc).__name__)
        with contextlib.suppress(Exception):
            await ws.close(code=CLOSE_SERVER)
    finally:
        if translator is not None:
            with contextlib.suppress(Exception):
                await translator.close()
        if meter is not None:
            try:
                await meter.finish()
            except Exception as exc:
                log.error("quota_finish_failed session=%s type=%s", session_id, type(exc).__name__)


async def _run_session(ws: WebSocket, settings: Settings, meter: QuotaMeter, translator: RealtimeTranslator):
    limiter = _RateLimiter(settings.max_messages_per_second)

    async def reader() -> None:
        while True:
            msg = await _receive(ws, settings)
            if not limiter.allow():
                raise _Close(CLOSE_RATE, "rate_limited")
            if isinstance(msg, AudioMsg):
                try:
                    await translator.send_audio(msg.pcm())
                except ProtocolError as exc:
                    raise _Close(CLOSE_BAD_MESSAGE, "bad_audio") from exc
            elif isinstance(msg, TextMsg):
                await translator.send_text(msg.text)
            elif isinstance(msg, StopMsg):
                raise _Close(1000)
            else:  # auth/start again
                raise _Close(CLOSE_BAD_MESSAGE, "unexpected_message")

    async def pump() -> None:
        async for event in translator.events():
            await ws.send_json(event)

    async def ticker() -> None:
        while True:
            assert meter.current is not None
            interval = settings.tick_interval_override or meter.current.granted
            await asyncio.sleep(interval)
            try:
                nxt = await meter.tick()
            except QuotaExhausted as exc:
                await ws.send_json({"type": "quota_update", "realtime_seconds_remaining": 0})
                raise _Close(CLOSE_QUOTA, "quota_exceeded") from exc
            except QuotaUnavailable as exc:
                raise _Close(CLOSE_SERVER, "quota_unavailable") from exc
            await ws.send_json({"type": "quota_update", "realtime_seconds_remaining": nxt.remaining_after})

    tasks = [asyncio.create_task(t()) for t in (reader, pump, ticker)]
    try:
        done, _ = await asyncio.wait(tasks, return_when=asyncio.FIRST_EXCEPTION)
        for task in done:
            if task.exception() is not None:
                raise task.exception()
    finally:
        for task in tasks:
            task.cancel()
        await asyncio.gather(*tasks, return_exceptions=True)

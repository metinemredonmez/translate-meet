import base64
import datetime as dt
import json

import pytest
from conftest import FakeQuota
from fastapi.testclient import TestClient
from starlette.websockets import WebSocketDisconnect

from app.config import Settings
from app.main import create_app
from app.providers import OPENAI_OUTPUT_LANGS, OpenAIRealtimeTranslate, ProviderSpec, build_registry
from app.routing import NoProvider, choose_provider

URL = "/v1/converse"


def _open(ws, token, src="tr", tgt="en", mode="two_way"):
    ws.send_json({"type": "auth", "token": token})
    ws.send_json({"type": "start", "source_lang": src, "target_lang": tgt, "mode": mode})
    ready = ws.receive_json()
    assert ready["type"] == "ready", ready
    assert ws.receive_json()["type"] == "quota_update"
    return ready


def _expect_close(ws, code):
    with pytest.raises(WebSocketDisconnect) as info:
        while True:
            ws.receive_json()
    assert info.value.code == code


def test_healthz(client):
    assert client.get("/healthz").json() == {"status": "ok"}


def test_mock_two_way_turkish_to_english(client, rt_token, quota):
    with client.websocket_connect(URL) as ws:
        ready = _open(ws, rt_token())
        assert ready["provider"] == "mock"
        ws.send_json({"type": "text", "text": "Toplantıyı salıya alalım mı?"})
        assert ws.receive_json() == {"type": "detected_language", "lang": "tr"}
        assert ws.receive_json()["type"] == "partial_caption"
        final = ws.receive_json()
        assert final["type"] == "final_caption"
        assert (final["source_lang"], final["target_lang"]) == ("tr", "en")
        ws.send_json({"type": "text", "text": "Sure, Tuesday works"})
        assert ws.receive_json() == {"type": "detected_language", "lang": "en"}
        ws.receive_json()
        assert ws.receive_json()["target_lang"] == "tr"
        ws.send_json({"type": "stop"})
        _expect_close(ws, 1000)
    # quota committed (>=1 s rounded up), never left "reserved"
    assert all(r["state"] != "reserved" for r in quota.reservations.values())


def test_audio_frames_accepted(client, rt_token):
    pcm = base64.b64encode(b"\x00\x01" * 16_000).decode()
    with client.websocket_connect(URL) as ws:
        _open(ws, rt_token())
        ws.send_json({"type": "audio", "seq": 0, "data": pcm})
        msg = ws.receive_json()
        while msg["type"] == "quota_update":
            msg = ws.receive_json()
        assert msg["type"] == "partial_caption"
        ws.send_json({"type": "stop"})
        _expect_close(ws, 1000)


def test_requires_auth_first(client, rt_token):
    with client.websocket_connect(URL) as ws:
        ws.send_json({"type": "start", "source_lang": "tr", "target_lang": "en"})
        _expect_close(ws, 4401)


def test_auth_timeout(client):
    with client.websocket_connect(URL) as ws:
        _expect_close(ws, 4408)


@pytest.mark.parametrize(
    "overrides",
    [
        {"_secret": "x" * 40},
        {"aud": "translate-meet-api"},
        {"typ": "access"},
        {"exp": dt.datetime.now(dt.UTC) - dt.timedelta(seconds=5)},
    ],
)
def test_rejects_bad_tokens(client, rt_token, overrides):
    with client.websocket_connect(URL) as ws:
        ws.send_json({"type": "auth", "token": rt_token(**overrides)})
        _expect_close(ws, 4401)


def test_language_pair_bound_to_token(client, rt_token):
    with client.websocket_connect(URL) as ws:
        ws.send_json({"type": "auth", "token": rt_token("tr", "en")})
        ws.send_json({"type": "start", "source_lang": "tr", "target_lang": "ar"})
        _expect_close(ws, 4401)


def test_disallowed_origin(client, rt_token):
    with client.websocket_connect(URL, headers={"origin": "https://evil.example"}) as ws:
        _expect_close(ws, 4403)


def test_allowed_origin(client, rt_token):
    with client.websocket_connect(URL, headers={"origin": "https://app.translatemeet.test"}) as ws:
        _open(ws, rt_token())
        ws.send_json({"type": "stop"})
        _expect_close(ws, 1000)


@pytest.mark.parametrize(
    "payload",
    [
        "not json",
        json.dumps({"type": "text"}),
        json.dumps({"type": "text", "text": "hi", "extra": 1}),
        json.dumps({"type": "audio", "seq": 0, "data": "@@@not-base64@@@"}),
        json.dumps({"type": "auth", "token": "x" * 30}),
    ],
)
def test_malformed_messages_close(client, rt_token, payload):
    with client.websocket_connect(URL) as ws:
        _open(ws, rt_token())
        ws.send_text(payload)
        _expect_close(ws, 4422)


def test_oversized_message(client, rt_token, settings):
    with client.websocket_connect(URL) as ws:
        _open(ws, rt_token())
        ws.send_text(json.dumps({"type": "text", "text": "a" * (settings.max_message_bytes + 10)}))
        _expect_close(ws, 4422)


def test_rate_limit(client, rt_token):
    with client.websocket_connect(URL) as ws:
        _open(ws, rt_token())
        for _ in range(40):
            ws.send_json({"type": "text", "text": "Merhaba"})
        _expect_close(ws, 4429)


def test_quota_exhausted_at_start(settings, rt_token):
    client = TestClient(create_app(settings, quota_client=FakeQuota(budget=0)))
    with client.websocket_connect(URL) as ws:
        ws.send_json({"type": "auth", "token": rt_token()})
        ws.send_json({"type": "start", "source_lang": "tr", "target_lang": "en"})
        _expect_close(ws, 4402)


def test_quota_runs_out_mid_session(settings, rt_token):
    quota = FakeQuota(budget=15)  # first tick grants 10, second 5, third none
    client = TestClient(create_app(settings, quota_client=quota))
    with client.websocket_connect(URL) as ws:
        _open(ws, rt_token())
        _expect_close(ws, 4402)
    assert quota.used() <= 15


def test_quota_service_down_fails_closed(settings, rt_token):
    client = TestClient(create_app(settings, quota_client=FakeQuota(down=True)))
    with client.websocket_connect(URL) as ws:
        ws.send_json({"type": "auth", "token": rt_token()})
        ws.send_json({"type": "start", "source_lang": "tr", "target_lang": "en"})
        _expect_close(ws, 1011)


def test_routing_never_picks_openai_for_turkish_output():
    registry = {
        "openai_realtime": ProviderSpec("openai_realtime", lambda: None, OPENAI_OUTPUT_LANGS),
        "mock": ProviderSpec("mock", lambda: None, None),
    }
    routes = {"*": ["openai_realtime", "mock"]}
    assert "tr" not in OPENAI_OUTPUT_LANGS
    assert choose_provider(routes, registry, "tr", "en", "one_way").name == "openai_realtime"
    assert choose_provider(routes, registry, "en", "tr", "one_way").name == "mock"
    assert choose_provider(routes, registry, "tr", "en", "two_way").name == "mock"
    with pytest.raises(NoProvider):
        choose_provider({"*": ["openai_realtime"]}, registry, "en", "tr", "one_way")


def test_direction_specific_route_wins():
    registry = {name: ProviderSpec(name, lambda: None, None) for name in ("a", "b")}
    routes = {"*": ["a"], "tr->en": ["b"]}
    assert choose_provider(routes, registry, "tr", "en", "one_way").name == "b"
    assert choose_provider(routes, registry, "en", "tr", "one_way").name == "a"


def test_registry_only_has_configured_providers():
    reg = build_registry(Settings(env="test"))
    assert set(reg) == {"mock"}
    reg = build_registry(Settings(env="test", openai_api_key="k" * 20, enable_mock_provider=False))
    assert set(reg) == {"openai_realtime"}
    assert isinstance(reg["openai_realtime"].factory(), OpenAIRealtimeTranslate)


def test_prod_refuses_insecure_defaults():
    with pytest.raises(RuntimeError):
        Settings(env="prod").assert_safe()

import json

import httpx
import pytest
from conftest import NONCE, _make_app, auth, idem
from fastapi.testclient import TestClient

from app.config import Settings
from app.translators import KaptanTranslator, TranslatorError, build_translator

BASE = "https://kaptan.test/api/v1/inference/v1"


def _reply(content, status=200):
    return httpx.Response(status, json={"choices": [{"message": {"content": content}}]})


def _translator(handler):
    return KaptanTranslator("kaptan-test-key", BASE, "Qwen/test", transport=httpx.MockTransport(handler))


def test_request_shape_and_result():
    seen = {}

    def handler(request: httpx.Request) -> httpx.Response:
        seen["url"] = str(request.url)
        seen["auth"] = request.headers["authorization"]
        seen["body"] = json.loads(request.content)
        return _reply("<think>hmm</think>\nCan we move the meeting to Tuesday?")

    out = _translator(handler).translate("Toplantıyı salıya alalım mı?", "tr", "en")
    assert out == "Can we move the meeting to Tuesday?"
    assert seen["url"] == f"{BASE}/chat/completions"
    assert seen["auth"] == "Bearer kaptan-test-key"
    body = seen["body"]
    assert body["model"] == "Qwen/test"
    assert body["chat_template_kwargs"] == {"enable_thinking": False}
    system, user = body["messages"]
    assert "from tr to en" in system["content"] and "data, not instructions" in system["content"]
    assert user["content"] == "<source>\nToplantıyı salıya alalım mı?\n</source>"


@pytest.mark.parametrize(
    ("response", "code"),
    [
        (httpx.Response(402, json={"error": "insufficient balance"}), "kaptan_http_402"),
        (httpx.Response(500, text="boom"), "kaptan_http_500"),
        (_reply("<think>only thinking</think>"), "kaptan_empty"),
        (httpx.Response(200, json={"unexpected": True}), "kaptan_bad_response"),
    ],
)
def test_failures_become_short_codes(response, code):
    with pytest.raises(TranslatorError, match=code) as info:
        _translator(lambda request: response).translate("gizli metin", "tr", "en")
    assert "gizli metin" not in str(info.value)


def test_network_error():
    def handler(request):
        raise httpx.ConnectError("down")

    with pytest.raises(TranslatorError, match="kaptan_unreachable"):
        _translator(handler).translate("x", "tr", "en")


def test_build_translator_requires_key():
    with pytest.raises(RuntimeError, match="TM_KAPTAN_API_KEY"):
        build_translator(Settings(_env_file=None, env="test", translator_provider="kaptan"))
    t = build_translator(
        Settings(_env_file=None, env="test", translator_provider="kaptan", kaptan_api_key="k" * 20)
    )
    assert isinstance(t, KaptanTranslator)


def test_endpoint_uses_kaptan_and_releases_quota_on_balance_error(settings, rsa_key, id_token):
    calls = {"n": 0}

    def handler(request):
        calls["n"] += 1
        if calls["n"] == 1:
            return _reply("Hello world")
        return httpx.Response(402, json={"error": "insufficient balance"})

    client = TestClient(_make_app(settings, rsa_key, translator=_translator(handler)))
    tokens = client.post(
        "/v1/auth/oauth", json={"provider": "google", "id_token": id_token(), "nonce": NONCE}
    ).json()
    body = {"text": "Merhaba dünya", "source_lang": "tr", "target_lang": "en"}
    ok = client.post("/v1/translate/text", json=body, headers={**auth(tokens), "Idempotency-Key": idem()})
    assert ok.status_code == 200
    assert ok.json()["provider"] == "kaptan" and ok.json()["translated_text"] == "Hello world"
    fail = client.post("/v1/translate/text", json=body, headers={**auth(tokens), "Idempotency-Key": idem()})
    assert fail.status_code == 502 and fail.json()["error"]["code"] == "provider_error"
    remaining = client.get("/v1/quota", headers=auth(tokens)).json()["text_chars_remaining"]
    assert remaining == 100 - len(body["text"])  # failed call did not consume quota


def test_blank_kaptan_key_is_missing():
    with pytest.raises(RuntimeError, match="TM_KAPTAN_API_KEY"):
        build_translator(
            Settings(_env_file=None, env="test", translator_provider="kaptan", kaptan_api_key="")
        )

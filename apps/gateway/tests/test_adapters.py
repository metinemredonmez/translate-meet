import asyncio
import base64
import json

import pytest
from websockets.asyncio.server import serve

from app.adapters.common import ProviderError
from app.adapters.gemini import GeminiLiveTranslate
from app.adapters.soniox import SonioxTTS, SonioxTwoWay

PCM = b"\x00\x01" * 1600  # 100 ms @ 16 kHz
FAKE_KEY = "fake-key-for-tests-0001"


async def _collect(adapter, until, limit=50, timeout=3.0):
    events = []

    async def run():
        async for ev in adapter.events():
            events.append(ev)
            if until(ev) or len(events) >= limit:
                return

    await asyncio.wait_for(run(), timeout)
    return events


def _port(server) -> int:
    return next(iter(server.sockets)).getsockname()[1]


# ---------------------------------------------------------------- Gemini


def test_gemini_two_way_opens_one_session_per_target_and_maps_events():
    seen = {"targets": [], "audio": 0, "paths": []}

    async def handler(ws):
        seen["paths"].append(ws.request.path)
        setup = json.loads(await ws.recv())["setup"]
        cfg = setup["generationConfig"]["translationConfig"]
        assert setup["model"] == "models/test-model"
        assert cfg["echoTargetLanguage"] is False
        target = cfg["targetLanguageCode"]
        seen["targets"].append(target)
        await ws.send(json.dumps({"setupComplete": {}}))
        async for raw in ws:
            msg = json.loads(raw)
            assert msg["realtimeInput"]["audio"]["mimeType"] == "audio/pcm;rate=16000"
            seen["audio"] += 1
            sc = {"inputTranscription": {"text": "Merhaba", "languageCode": "tr"}}
            await ws.send(json.dumps({"serverContent": sc}))
            if target == "en":
                audio = base64.b64encode(b"\x01\x02" * 10).decode()
                await ws.send(json.dumps({"serverContent": {"outputTranscription": {"text": "Hello"}}}))
                part = {"inlineData": {"mimeType": "audio/pcm;rate=24000", "data": audio}}
                await ws.send(json.dumps({"serverContent": {"modelTurn": {"parts": [part]}}}))
            await ws.send(json.dumps({"serverContent": {"turnComplete": True}}))

    async def main():
        async with serve(handler, "127.0.0.1", 0) as server:
            adapter = GeminiLiveTranslate(FAKE_KEY, "test-model", url=f"ws://127.0.0.1:{_port(server)}/ws")
            await adapter.start("tr", "en", "two_way")
            await adapter.send_audio(PCM)
            events = await _collect(adapter, lambda e: e["type"] == "final_caption")
            await adapter.close()
            return events

    events = asyncio.run(main())
    assert sorted(seen["targets"]) == ["en", "tr"]
    assert seen["audio"] == 2  # same audio fed to both legs
    assert all(f"key={FAKE_KEY}" in p for p in seen["paths"])
    types = [e["type"] for e in events]
    assert types.count("partial_caption") == 1  # secondary leg's input transcript is not duplicated
    assert {"type": "detected_language", "lang": "tr"} in events
    audio = next(e for e in events if e["type"] == "audio_chunk")
    assert audio["lang"] == "en" and audio["sample_rate"] == 24_000
    final = events[-1]
    assert final == {
        "type": "final_caption",
        "source_text": "Merhaba",
        "translated_text": "Hello",
        "source_lang": "tr",
        "target_lang": "en",
    }


def test_gemini_setup_rejected():
    async def handler(ws):
        await ws.recv()
        await ws.send(json.dumps({"error": {"code": 400}}))

    async def main():
        async with serve(handler, "127.0.0.1", 0) as server:
            adapter = GeminiLiveTranslate(FAKE_KEY, "m", url=f"ws://127.0.0.1:{_port(server)}/ws")
            await adapter.start("tr", "en", "one_way")

    with pytest.raises(ProviderError, match="gemini_setup_rejected"):
        asyncio.run(main())


def test_gemini_connect_failure_does_not_leak_key():
    async def main():
        adapter = GeminiLiveTranslate(FAKE_KEY, "m", url="ws://127.0.0.1:9/ws", connect_timeout=1)
        await adapter.start("tr", "en", "one_way")

    with pytest.raises(ProviderError) as info:
        asyncio.run(main())
    assert FAKE_KEY not in str(info.value) and info.value.__cause__ is None


def test_gemini_text_input_is_reported_not_crashed():
    async def handler(ws):
        await ws.recv()
        await ws.send(json.dumps({"setupComplete": {}}))
        await ws.wait_closed()

    async def main():
        async with serve(handler, "127.0.0.1", 0) as server:
            adapter = GeminiLiveTranslate(FAKE_KEY, "m", url=f"ws://127.0.0.1:{_port(server)}/ws")
            await adapter.start("tr", "en", "one_way")
            await adapter.send_text("hi")
            events = await _collect(adapter, lambda e: True)
            await adapter.close()
            return events

    assert asyncio.run(main())[0]["code"] == "text_not_supported"


# ---------------------------------------------------------------- Soniox


def _soniox_stt_handler(seen):
    async def handler(ws):
        seen["auth"] = ws.request.headers.get("Authorization")
        config = json.loads(await ws.recv())
        seen["config"] = config
        async for msg in ws:
            if isinstance(msg, bytes):
                seen["audio"] = seen.get("audio", 0) + len(msg)
                await ws.send(
                    json.dumps(
                        {
                            "tokens": [
                                {
                                    "text": "Mer",
                                    "is_final": False,
                                    "language": "tr",
                                    "translation_status": "original",
                                },
                            ]
                        }
                    )
                )
                await ws.send(
                    json.dumps(
                        {
                            "tokens": [
                                {
                                    "text": "Merhaba.",
                                    "is_final": True,
                                    "language": "tr",
                                    "translation_status": "original",
                                },
                                {
                                    "text": "Hello.",
                                    "is_final": True,
                                    "language": "en",
                                    "source_language": "tr",
                                    "translation_status": "translation",
                                },
                                {"text": "<end>", "is_final": True},
                            ]
                        }
                    )
                )
            elif msg == "":
                await ws.send(json.dumps({"tokens": [], "finished": True}))
                return

    return handler


def _soniox_tts_handler(seen):
    async def handler(ws):
        seen["tts_auth"] = ws.request.headers.get("Authorization")
        async for raw in ws:
            msg = json.loads(raw)
            if "model" in msg:
                seen["tts_config"] = msg
                continue
            sid = msg["stream_id"]
            seen["tts_text"] = msg["text"]
            chunk = base64.b64encode(b"\x05\x06" * 8).decode()
            await ws.send(json.dumps({"audio": chunk, "audio_end": False, "stream_id": sid}))
            await ws.send(json.dumps({"audio": chunk, "audio_end": True, "stream_id": sid}))
            await ws.send(json.dumps({"terminated": True, "stream_id": sid}))

    return handler


def test_soniox_two_way_captions_and_speech():
    seen = {}

    async def main():
        async with (
            serve(_soniox_stt_handler(seen), "127.0.0.1", 0) as stt,
            serve(_soniox_tts_handler(seen), "127.0.0.1", 0) as tts_server,
        ):
            tts = SonioxTTS(FAKE_KEY, "tts-rt-v2", "Maya", url=f"ws://127.0.0.1:{_port(tts_server)}")
            adapter = SonioxTwoWay(FAKE_KEY, "stt-rt-v6", url=f"ws://127.0.0.1:{_port(stt)}", tts=tts)
            await adapter.start("tr", "en", "two_way")
            await adapter.send_audio(PCM)
            events = await _collect(adapter, lambda e: e["type"] == "audio_chunk", limit=20)
            await adapter.close()
            return events

    events = asyncio.run(main())
    assert seen["auth"] == f"Bearer {FAKE_KEY}" and seen["tts_auth"] == f"Bearer {FAKE_KEY}"
    assert "api_key" not in seen["config"]
    assert seen["config"]["translation"] == {"type": "two_way", "language_a": "tr", "language_b": "en"}
    assert seen["config"]["audio_format"] == "pcm_s16le" and seen["config"]["sample_rate"] == 16_000
    assert seen["audio"] == len(PCM)
    assert {"type": "detected_language", "lang": "tr"} in events
    assert any(e["type"] == "partial_caption" and e["text"] == "Mer" for e in events)
    final = next(e for e in events if e["type"] == "final_caption")
    assert final == {
        "type": "final_caption",
        "source_text": "Merhaba.",
        "translated_text": "Hello.",
        "source_lang": "tr",
        "target_lang": "en",
    }
    assert seen["tts_text"] == "Hello."
    assert seen["tts_config"]["language"] == "en" and seen["tts_config"]["audio_format"] == "pcm_s16le"
    audio = next(e for e in events if e["type"] == "audio_chunk")
    assert audio["lang"] == "en" and audio["sample_rate"] == 24_000


def test_soniox_one_way_config():
    adapter = SonioxTwoWay(FAKE_KEY, "stt-rt-v6")
    assert adapter._config("tr", "de", "one_way")["translation"] == {
        "type": "one_way",
        "target_language": "de",
    }


def test_soniox_error_frame_becomes_provider_error():
    async def handler(ws):
        await ws.recv()
        await ws.send(
            json.dumps(
                {"tokens": [], "error_code": 401, "error_type": "unauthenticated", "error_message": "bad key"}
            )
        )

    async def main():
        async with serve(handler, "127.0.0.1", 0) as server:
            adapter = SonioxTwoWay(FAKE_KEY, "stt-rt-v6", url=f"ws://127.0.0.1:{_port(server)}")
            await adapter.start("tr", "en", "two_way")
            await _collect(adapter, lambda e: False)

    with pytest.raises(ProviderError, match="soniox_unauthenticated"):
        asyncio.run(main())

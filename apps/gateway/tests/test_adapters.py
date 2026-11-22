import asyncio
import base64
import json

import httpx
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
                audio = base64.b64encode(b"\x00\x10" * 10).decode()  # audible (peak 4096)
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


def test_gemini_continuous_stream_flushes_on_pause_and_drops_silence():
    """Live Translate never sends turnComplete; captions close on a pause, silence is not forwarded."""

    async def handler(ws):
        await ws.recv()
        await ws.send(json.dumps({"setupComplete": {}}))
        await ws.recv()
        sc = {"inputTranscription": {"text": "Merhaba toplantı", "languageCode": "tr"}}
        await ws.send(json.dumps({"serverContent": sc}))
        await ws.send(json.dumps({"serverContent": {"outputTranscription": {"text": "Hello, the meeting"}}}))
        silent = base64.b64encode(b"\x00\x00" * 200).decode()
        for _ in range(3):
            part = {"inlineData": {"mimeType": "audio/pcm;rate=24000", "data": silent}}
            await ws.send(json.dumps({"serverContent": {"modelTurn": {"parts": [part]}}}))
        await ws.wait_closed()

    async def main():
        async with serve(handler, "127.0.0.1", 0) as server:
            adapter = GeminiLiveTranslate(
                FAKE_KEY, "m", url=f"ws://127.0.0.1:{_port(server)}/ws", idle_flush_seconds=0.3
            )
            await adapter.start("tr", "en", "one_way")
            await adapter.send_audio(PCM)
            events = await _collect(adapter, lambda e: e["type"] == "final_caption")
            await adapter.close()
            return events

    events = asyncio.run(main())
    assert not any(e["type"] == "audio_chunk" for e in events)
    assert events[-1]["translated_text"] == "Hello, the meeting"
    assert events[-1]["source_text"] == "Merhaba toplantı"


# ---------------------------------------------------------------- ElevenLabs cascade

from app.adapters.elevenlabs import ElevenLabsCascade, normalize_lang  # noqa: E402

LOUD = b"\x00\x20" * 1600  # 100 ms, rms ~8192
QUIET = b"\x00\x00" * 1600  # 100 ms silence


def _scribe_handler(seen):
    async def handler(ws):
        seen["auth"] = ws.request.headers.get("xi-api-key")
        seen["path"] = ws.request.path
        await ws.send(json.dumps({"message_type": "session_started", "session_id": "s1", "config": {}}))
        seen["commits"] = 0
        async for raw in ws:
            msg = json.loads(raw)
            assert msg["message_type"] == "input_audio_chunk" and msg["sample_rate"] == 16000
            if msg["commit"]:
                seen["commits"] += 1
                text = "Fiyat dört değil, üç buçuk dolar."
                await ws.send(
                    json.dumps(
                        {
                            "message_type": "committed_transcript_with_timestamps",
                            "text": text,
                            "language_code": "tur",
                        }
                    )
                )
                await ws.send(json.dumps({"message_type": "committed_transcript", "text": text}))
            elif "partial_sent" not in seen:
                seen["partial_sent"] = True
                await ws.send(
                    json.dumps(
                        {"message_type": "partial_transcript", "text": "Fiyat dört", "language_code": "tr"}
                    )
                )

    return handler


def test_normalize_lang():
    assert (normalize_lang("tur"), normalize_lang("en-US"), normalize_lang(None)) == ("tr", "en", "")


def test_elevenlabs_cascade_commit_translate_speak():
    seen, calls = {}, []

    async def translate(text, src, tgt):
        calls.append((text, src, tgt))
        return "The price is not four but three and a half dollars."

    def tts(request: httpx.Request) -> httpx.Response:
        seen["tts_url"] = str(request.url)
        seen["tts_key"] = request.headers["xi-api-key"]
        seen["tts_body"] = json.loads(request.content)
        return httpx.Response(200, content=b"\x01\x02" * 1000 + b"\x03")  # odd byte must be carried

    async def main():
        async with serve(_scribe_handler(seen), "127.0.0.1", 0) as server:
            adapter = ElevenLabsCascade(
                FAKE_KEY,
                translate,
                "voice123",
                stt_url=f"ws://127.0.0.1:{_port(server)}/rt",
                tts_base_url="https://tts.test",
                tts_transport=httpx.MockTransport(tts),
            )
            await adapter.start("tr", "en", "two_way")
            for chunk in [LOUD] * 3 + [QUIET] * 8:  # speech, then 800 ms silence -> one commit
                await adapter.send_audio(chunk)
            events = await _collect(adapter, lambda e: e["type"] == "audio_chunk")
            await adapter.close()
            return events

    events = asyncio.run(main())
    assert seen["auth"] == FAKE_KEY and "model_id=scribe_v2_realtime" in seen["path"]
    assert "include_language_detection=true" in seen["path"] and seen["commits"] == 1
    assert {"type": "detected_language", "lang": "tr"} in events
    assert calls == [("Fiyat dört değil, üç buçuk dolar.", "tr", "en")]
    final = next(e for e in events if e["type"] == "final_caption")
    assert (final["source_lang"], final["target_lang"]) == ("tr", "en")
    assert seen["tts_url"] == "https://tts.test/v1/text-to-speech/voice123/stream?output_format=pcm_24000"
    assert seen["tts_key"] == FAKE_KEY
    assert seen["tts_body"] == {
        "text": final["translated_text"],
        "model_id": "eleven_flash_v2_5",
        "language_code": "en",
    }
    audio = next(e for e in events if e["type"] == "audio_chunk")
    assert len(base64.b64decode(audio["data"])) % 2 == 0 and audio["sample_rate"] == 24_000


def test_elevenlabs_direction_and_failures():
    adapter = ElevenLabsCascade(FAKE_KEY, None, "v")
    adapter._pair, adapter._mode = ("tr", "en"), "two_way"
    assert adapter._direction("en") == ("en", "tr") and adapter._direction("tr") == ("tr", "en")
    adapter._mode = "one_way"
    assert adapter._direction("en") is None  # already in target language: nothing to translate

    async def failing(text, src, tgt):
        raise ProviderError("translate_http_502")

    seen = {}

    async def main():
        async with serve(_scribe_handler(seen), "127.0.0.1", 0) as server:
            a = ElevenLabsCascade(
                FAKE_KEY,
                failing,
                "v",
                stt_url=f"ws://127.0.0.1:{_port(server)}/rt",
                tts_transport=httpx.MockTransport(lambda r: httpx.Response(500)),
            )
            await a.start("tr", "en", "two_way")
            for chunk in [LOUD] * 2 + [QUIET] * 8:
                await a.send_audio(chunk)
            events = await _collect(a, lambda e: e["type"] == "error")
            await a.close()
            return events

    err = asyncio.run(main())[-1]
    assert err["code"] == "translate_http_502"  # session keeps running; error is reported, not fatal


def test_elevenlabs_rejected_session():
    async def handler(ws):
        await ws.send(json.dumps({"message_type": "auth_error", "error": "invalid key"}))

    async def main():
        async with serve(handler, "127.0.0.1", 0) as server:
            a = ElevenLabsCascade(FAKE_KEY, None, "v", stt_url=f"ws://127.0.0.1:{_port(server)}/rt")
            await a.start("tr", "en", "two_way")

    with pytest.raises(ProviderError, match="elevenlabs_session_rejected"):
        asyncio.run(main())

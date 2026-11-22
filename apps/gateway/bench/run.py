"""Latency / cost benchmark for realtime providers (roadmap Faz 0).

Streams 16 kHz mono PCM16 WAV files at real-time speed straight into a provider adapter and records:
  first_partial_ms  audio start -> first source caption
  first_final_ms    audio start -> first translated (final) caption
  first_audio_ms    audio start -> first synthesized audio chunk
  end_to_final_ms   end of speech -> last translated caption   (what the listener waits for)

Keys come from the gateway environment (TM_GEMINI_API_KEY, TM_SONIOX_API_KEY, ...; apps/gateway/.env is
git-ignored). Use only consented or synthetic audio (see make_samples.sh). Results contain timings and
caption text only; never commit recordings.

    uv run python -m bench.run --provider soniox_two_way --src tr --tgt en bench/samples/*.wav
"""

import argparse
import asyncio
import json
import statistics
import sys
import time
import wave
from pathlib import Path

from app.config import Settings
from app.providers import build_registry

CHUNK_MS = 100
# USD per audio minute. Planning assumptions from docs/codex/CODEX-ANALIZ.md §2; confirm on invoices.
PRICE_PER_MIN = {
    "gemini_live": {"input_per_leg": 0.0053, "output": 0.0315},
    "soniox_two_way": {"input_per_leg": 0.002, "output": 0.0117},
    "mock": {"input_per_leg": 0.0, "output": 0.0},
}


def load_pcm(path: Path) -> bytes:
    with wave.open(str(path), "rb") as wav:
        if (wav.getframerate(), wav.getnchannels(), wav.getsampwidth()) != (16_000, 1, 2):
            sys.exit(
                f"{path}: need 16 kHz mono 16-bit WAV. Convert with:\n"
                f"  afconvert -f WAVE -d LEI16@16000 -c 1 '{path}' out.wav   (macOS)\n"
                f"  ffmpeg -i '{path}' -ar 16000 -ac 1 -sample_fmt s16 out.wav"
            )
        return wav.readframes(wav.getnframes())


async def run_one(spec, pcm: bytes, src: str, tgt: str, mode: str, tail_s: float, wait_s: float) -> dict:
    adapter = spec.factory()
    await adapter.start(src, tgt, mode)
    marks: dict[str, float] = {}
    finals: list[dict] = []
    out_audio_bytes = 0
    t0 = time.monotonic()

    async def consume() -> None:
        nonlocal out_audio_bytes
        async for ev in adapter.events():
            now = (time.monotonic() - t0) * 1000
            kind = ev["type"]
            if kind == "partial_caption":
                marks.setdefault("first_partial_ms", now)
            elif kind == "final_caption":
                marks.setdefault("first_final_ms", now)
                marks["last_final_ms"] = now
                finals.append(
                    {k: ev[k] for k in ("source_text", "translated_text", "source_lang", "target_lang")}
                )
            elif kind == "audio_chunk":
                marks.setdefault("first_audio_ms", now)
                out_audio_bytes += len(ev["data"]) * 3 // 4
            elif kind == "error":
                marks.setdefault("error", ev["code"])

    consumer = asyncio.create_task(consume())
    step = 16_000 * 2 * CHUNK_MS // 1000
    stream = pcm + b"\x00\x00" * int(16_000 * tail_s)  # trailing silence lets endpointing finish
    speech_end_ms = len(pcm) / 32_000 * 1000
    for i in range(0, len(stream), step):
        await adapter.send_audio(stream[i : i + step])
        await asyncio.sleep(max(0.0, t0 + (i + step) / 32_000 - time.monotonic()))
    await asyncio.sleep(wait_s)
    await adapter.close()
    await asyncio.wait_for(consumer, 5.0)

    audio_min = len(pcm) / 32_000 / 60
    legs = 2 if (spec.name == "gemini_live" and mode == "two_way") else 1
    price = PRICE_PER_MIN.get(spec.name, {"input_per_leg": 0.0, "output": 0.0})
    out_min = out_audio_bytes / 48_000 / 60  # PCM16 @ 24 kHz
    return {
        "speech_s": round(len(pcm) / 32_000, 2),
        "first_partial_ms": _r(marks.get("first_partial_ms")),
        "first_final_ms": _r(marks.get("first_final_ms")),
        "first_audio_ms": _r(marks.get("first_audio_ms")),
        "end_to_final_ms": _r(marks["last_final_ms"] - speech_end_ms) if "last_final_ms" in marks else None,
        "est_cost_usd": round(audio_min * legs * price["input_per_leg"] + out_min * price["output"], 5),
        "error": marks.get("error"),
        "finals": finals,
    }


def _r(v: float | None) -> int | None:
    return None if v is None else int(round(v))


def _p(values: list[int], q: float) -> int | None:
    values = sorted(v for v in values if v is not None)
    if not values:
        return None
    return values[min(len(values) - 1, int(round(q * (len(values) - 1))))]


async def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--provider", required=True)
    ap.add_argument("--src", required=True)
    ap.add_argument("--tgt", required=True)
    ap.add_argument("--mode", default="two_way", choices=["two_way", "one_way"])
    ap.add_argument("--tail-silence", type=float, default=1.5)
    ap.add_argument("--wait", type=float, default=4.0, help="seconds to wait for late results")
    ap.add_argument("--out", type=Path, default=None)
    ap.add_argument("wavs", nargs="+", type=Path)
    args = ap.parse_args()

    registry = build_registry(Settings())
    if args.provider not in registry:
        sys.exit(
            f"provider '{args.provider}' not configured; set its TM_* key. Available: {sorted(registry)}"
        )
    spec = registry[args.provider]

    rows = []
    for wav in args.wavs:
        res = await run_one(spec, load_pcm(wav), args.src, args.tgt, args.mode, args.tail_silence, args.wait)
        rows.append({"file": wav.name, **res})
        print(json.dumps({k: v for k, v in rows[-1].items() if k != "finals"}, ensure_ascii=False))

    keys = ("first_partial_ms", "first_final_ms", "first_audio_ms", "end_to_final_ms")
    print(f"\n| {args.provider} {args.src}->{args.tgt} ({args.mode}) | p50 | p95 |\n|---|---|---|")
    for k in keys:
        vals = [r[k] for r in rows]
        print(f"| {k} | {_p(vals, 0.5)} | {_p(vals, 0.95)} |")
    total = sum(r["est_cost_usd"] for r in rows)
    minutes = sum(r["speech_s"] for r in rows) / 60
    per_min = round(total / minutes, 4) if minutes else 0
    print(f"| est. cost | ${total:.4f} total | ${per_min}/speech-min |")
    errors = [r["error"] for r in rows if r["error"]]
    if errors:
        print(f"\nerrors: {statistics.multimode(errors)}")
    if args.out:
        args.out.write_text(json.dumps(rows, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    asyncio.run(main())

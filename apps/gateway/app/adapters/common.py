import asyncio
from collections.abc import AsyncIterator

OUTPUT_SAMPLE_RATE = 24_000  # both Gemini Live and our Soniox TTS config emit PCM16 @ 24 kHz


class ProviderError(Exception):
    """Upstream failure. Messages are short codes; never include URLs, keys or user content."""


class EventQueue:
    """Single-consumer event stream shared by adapters. `None` terminates; an exception is re-raised."""

    def __init__(self) -> None:
        self._q: asyncio.Queue[dict | BaseException | None] = asyncio.Queue()

    def put(self, event: dict) -> None:
        self._q.put_nowait(event)

    def fail(self, exc: BaseException) -> None:
        self._q.put_nowait(exc)

    def end(self) -> None:
        self._q.put_nowait(None)

    async def stream(self) -> AsyncIterator[dict]:
        while True:
            item = await self._q.get()
            if item is None:
                return
            if isinstance(item, BaseException):
                raise item
            yield item


def text_not_supported(queue: EventQueue) -> None:
    queue.put({"type": "error", "code": "text_not_supported", "message": "provider accepts audio only"})

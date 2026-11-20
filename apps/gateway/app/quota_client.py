"""Gateway -> API quota calls. Fail closed: if the quota service is unreachable, sessions do not open."""

import math
import time
from dataclasses import dataclass
from typing import Protocol

import httpx


class QuotaExhausted(Exception):
    pass


class QuotaUnavailable(Exception):
    pass


@dataclass
class Reservation:
    reservation_id: str
    granted: int
    remaining_after: int


class QuotaClient(Protocol):
    async def reserve(self, user_id: str, amount: int, idempotency_key: str) -> Reservation: ...
    async def commit(self, user_id: str, reservation_id: str, amount: int) -> None: ...
    async def release(self, user_id: str, reservation_id: str) -> None: ...


class HttpQuotaClient:
    def __init__(self, base_url: str, service_token: str, timeout: float = 3.0) -> None:
        self._client = httpx.AsyncClient(
            base_url=base_url, timeout=timeout, headers={"X-Internal-Token": service_token}
        )

    async def _post(self, path: str, body: dict) -> httpx.Response:
        try:
            res = await self._client.post(path, json=body)
        except httpx.HTTPError as exc:
            raise QuotaUnavailable(path) from exc
        if res.status_code == 402:
            raise QuotaExhausted()
        if res.status_code >= 300:
            raise QuotaUnavailable(f"{path} -> {res.status_code}")
        return res

    async def reserve(self, user_id: str, amount: int, idempotency_key: str) -> Reservation:
        res = await self._post(
            "/internal/quota/reserve",
            {"user_id": user_id, "amount": amount, "idempotency_key": idempotency_key},
        )
        data = res.json()
        return Reservation(data["reservation_id"], data["granted"], data["remaining_after"])

    async def commit(self, user_id: str, reservation_id: str, amount: int) -> None:
        await self._post(
            "/internal/quota/commit", {"user_id": user_id, "reservation_id": reservation_id, "amount": amount}
        )

    async def release(self, user_id: str, reservation_id: str) -> None:
        await self._post("/internal/quota/release", {"user_id": user_id, "reservation_id": reservation_id})

    async def aclose(self) -> None:
        await self._client.aclose()


class QuotaMeter:
    """Reserve one tick ahead; on each tick commit the elapsed tick and reserve the next (RES-01)."""

    def __init__(self, client: QuotaClient, user_id: str, session_id: str, tick_seconds: int) -> None:
        self._client, self._user, self._session, self._tick = client, user_id, session_id, tick_seconds
        self._seq = 0
        self.current: Reservation | None = None
        self._started = 0.0

    async def _reserve(self) -> Reservation:
        reservation = await self._client.reserve(self._user, self._tick, f"{self._session}:{self._seq}")
        self._seq += 1
        self.current, self._started = reservation, time.monotonic()
        return reservation

    async def start(self) -> Reservation:
        return await self._reserve()

    async def tick(self) -> Reservation:
        assert self.current is not None
        await self._client.commit(self._user, self.current.reservation_id, self.current.granted)
        self.current = None
        return await self._reserve()

    async def finish(self) -> None:
        if self.current is None:
            return
        used = min(self.current.granted, math.ceil(time.monotonic() - self._started))
        current, self.current = self.current, None
        if used <= 0:
            await self._client.release(self._user, current.reservation_id)
        else:
            await self._client.commit(self._user, current.reservation_id, used)

"""WebSocket message schema (see packages/shared/CONTRACT.md). INP-01: every message is validated."""

import base64
import binascii
import json
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, TypeAdapter, ValidationError

LANG = r"^[a-z]{2,3}(-[A-Za-z0-9]{2,8})?$"
MAX_AUDIO_BYTES = 32 * 1024


class ProtocolError(Exception):
    pass


class _Msg(BaseModel):
    model_config = ConfigDict(extra="forbid")


class AuthMsg(_Msg):
    type: Literal["auth"]
    token: str = Field(min_length=20, max_length=4096)


class StartMsg(_Msg):
    type: Literal["start"]
    source_lang: str = Field(pattern=LANG)
    target_lang: str = Field(pattern=LANG)
    mode: Literal["two_way", "one_way"] = "two_way"


class AudioMsg(_Msg):
    type: Literal["audio"]
    seq: int = Field(ge=0)
    data: str = Field(min_length=1, max_length=4 * MAX_AUDIO_BYTES // 3 + 4)

    def pcm(self) -> bytes:
        try:
            raw = base64.b64decode(self.data, validate=True)
        except (binascii.Error, ValueError) as exc:
            raise ProtocolError("invalid base64") from exc
        if len(raw) > MAX_AUDIO_BYTES or len(raw) % 2:
            raise ProtocolError("invalid pcm frame")
        return raw


class TextMsg(_Msg):
    type: Literal["text"]
    text: str = Field(min_length=1, max_length=2000)


class StopMsg(_Msg):
    type: Literal["stop"]


ClientMessage = Annotated[AuthMsg | StartMsg | AudioMsg | TextMsg | StopMsg, Field(discriminator="type")]
_adapter: TypeAdapter[ClientMessage] = TypeAdapter(ClientMessage)


def parse_client_message(raw: str, max_bytes: int) -> AuthMsg | StartMsg | AudioMsg | TextMsg | StopMsg:
    if len(raw.encode()) > max_bytes:
        raise ProtocolError("message too large")
    try:
        return _adapter.validate_python(json.loads(raw))
    except (json.JSONDecodeError, ValidationError) as exc:
        raise ProtocolError("malformed message") from exc

/**
 * Typed WebSocket protocol for apps/gateway (/v1/converse), per packages/shared/CONTRACT.md.
 * Incoming messages are validated strictly; anything malformed is dropped (parseServerMessage → null).
 */

// ── Client → server ─────────────────────────────────────────────────────
export type ConverseMode = 'two_way' | 'one_way';

export type ClientMessage =
  | { type: 'auth'; token: string }
  | { type: 'start'; source_lang: string; target_lang: string; mode: ConverseMode }
  | { type: 'audio'; seq: number; data: string }
  | { type: 'text'; text: string }
  | { type: 'stop' };

// ── Server → client ─────────────────────────────────────────────────────
export type ServerMessage =
  | { type: 'ready'; session_id: string; provider: string }
  | { type: 'detected_language'; lang: string }
  | { type: 'partial_caption'; text: string; lang: string }
  | {
      type: 'final_caption';
      source_text: string;
      translated_text: string;
      source_lang: string;
      target_lang: string;
    }
  | { type: 'audio_chunk'; data: string; lang: string }
  | { type: 'quota_update'; realtime_seconds_remaining: number }
  | { type: 'error'; code: string; message: string };

export type ServerMessageType = ServerMessage['type'];

export const CloseCode = {
  Normal: 1000,
  ServerError: 1011,
  Auth: 4401,
  QuotaExhausted: 4402,
  OriginRejected: 4403,
  Timeout: 4408,
  BadMessage: 4422,
  RateLimited: 4429,
} as const;

/** Max audio payload accepted by the gateway (base64 of ≤32 KB PCM). */
export const MAX_AUDIO_BYTES = 32 * 1024;

type Shape = Record<string, 'string' | 'int'>;

const SHAPES: Record<ServerMessageType, Shape> = {
  ready: { session_id: 'string', provider: 'string' },
  detected_language: { lang: 'string' },
  partial_caption: { text: 'string', lang: 'string' },
  final_caption: {
    source_text: 'string',
    translated_text: 'string',
    source_lang: 'string',
    target_lang: 'string',
  },
  audio_chunk: { data: 'string', lang: 'string' },
  quota_update: { realtime_seconds_remaining: 'int' },
  error: { code: 'string', message: 'string' },
};

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Validate an already-decoded value. Unknown types, missing/mistyped fields → null. */
export function validateServerMessage(value: unknown): ServerMessage | null {
  if (!isPlainObject(value)) return null;
  const type = value.type;
  if (typeof type !== 'string' || !Object.prototype.hasOwnProperty.call(SHAPES, type)) return null;
  const shape = SHAPES[type as ServerMessageType];
  const out: Record<string, unknown> = { type };
  for (const [key, kind] of Object.entries(shape)) {
    const v = value[key];
    if (kind === 'string' && typeof v !== 'string') return null;
    if (kind === 'int' && !(typeof v === 'number' && Number.isInteger(v) && v >= 0)) return null;
    out[key] = v;
  }
  // Extra fields are ignored (forward-compatible), only known keys are copied.
  return out as ServerMessage;
}

/** Parse a raw WebSocket frame. Binary or non-JSON frames → null. */
export function parseServerMessage(raw: unknown): ServerMessage | null {
  if (typeof raw !== 'string') return null;
  try {
    return validateServerMessage(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function encodeClientMessage(msg: ClientMessage): string {
  return JSON.stringify(msg);
}

/** Build the converse URL from the gateway URL returned by the API (or config fallback). */
export function resolveConverseUrl(gatewayUrl: string, fallback: string): string {
  const base = /^wss?:\/\//i.test(gatewayUrl) ? gatewayUrl : fallback;
  const trimmed = base.replace(/\/+$/, '');
  return trimmed.endsWith('/v1/converse') ? trimmed : `${trimmed}/v1/converse`;
}

// ── Session state machine ───────────────────────────────────────────────
export type ConnectionState =
  | 'idle'
  | 'connecting'
  | 'ready'
  | 'quota_exhausted'
  | 'network_lost'
  | 'auth_error'
  | 'error';

export function stateForClose(code: number, closedByUs: boolean): ConnectionState {
  if (closedByUs) return 'idle';
  switch (code) {
    case CloseCode.Auth:
      return 'auth_error';
    case CloseCode.QuotaExhausted:
      return 'quota_exhausted';
    case CloseCode.Normal:
      return 'idle';
    case 1001:
    case 1006:
      return 'network_lost';
    default:
      return 'error';
  }
}

export interface RealtimeHandlers {
  onState?: (state: ConnectionState, detail?: { code?: number | string }) => void;
  onMessage?: (msg: ServerMessage) => void;
}

export interface StartParams {
  url: string;
  token: string;
  source_lang: string;
  target_lang: string;
  mode?: ConverseMode;
}

type WebSocketCtor = new (url: string) => WebSocket;

/** Thin wrapper around a WebSocket that speaks the converse protocol. */
export class RealtimeSession {
  private ws: WebSocket | null = null;
  private closedByUs = false;
  private state: ConnectionState = 'idle';

  constructor(
    private readonly handlers: RealtimeHandlers,
    private readonly WS: WebSocketCtor = WebSocket,
  ) {}

  get currentState(): ConnectionState {
    return this.state;
  }

  private setState(s: ConnectionState, detail?: { code?: number | string }) {
    this.state = s;
    this.handlers.onState?.(s, detail);
  }

  start(p: StartParams) {
    this.close();
    this.closedByUs = false;
    this.setState('connecting');
    const ws = new this.WS(p.url);
    this.ws = ws;
    ws.onopen = () => {
      // The gateway requires `auth` as the first message within 5 s.
      this.send({ type: 'auth', token: p.token });
      this.send({
        type: 'start',
        source_lang: p.source_lang,
        target_lang: p.target_lang,
        mode: p.mode ?? 'two_way',
      });
    };
    ws.onmessage = (ev: { data: unknown }) => {
      const msg = parseServerMessage(ev.data);
      if (!msg) return;
      if (msg.type === 'ready') this.setState('ready');
      if (msg.type === 'error') this.handlers.onState?.(this.state, { code: msg.code });
      this.handlers.onMessage?.(msg);
    };
    ws.onclose = (ev: { code: number }) => {
      if (this.ws !== ws) return;
      this.ws = null;
      const next = stateForClose(ev.code, this.closedByUs);
      this.setState(next, { code: ev.code });
    };
    ws.onerror = () => {
      /* onclose follows with the real code */
    };
  }

  send(msg: ClientMessage): boolean {
    if (!this.ws || this.ws.readyState !== 1 /* OPEN */) return false;
    this.ws.send(encodeClientMessage(msg));
    return true;
  }

  sendText(text: string): boolean {
    const trimmed = text.trim();
    if (!trimmed) return false;
    return this.send({ type: 'text', text: trimmed });
  }

  close() {
    if (!this.ws) return;
    this.closedByUs = true;
    this.send({ type: 'stop' });
    const ws = this.ws;
    this.ws = null;
    ws.close(CloseCode.Normal);
    this.setState('idle');
  }
}

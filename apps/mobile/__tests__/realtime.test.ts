import {
  CloseCode,
  encodeClientMessage,
  parseServerMessage,
  resolveConverseUrl,
  stateForClose,
} from '@/lib/realtime';
import { emptyCaptions, reduceCaptions } from '@/lib/captions';

describe('parseServerMessage', () => {
  it('accepts every valid server message type', () => {
    const valid = [
      { type: 'ready', session_id: 's1', provider: 'mock' },
      { type: 'detected_language', lang: 'tr' },
      { type: 'partial_caption', text: 'mer', lang: 'tr' },
      { type: 'final_caption', source_text: 'merhaba', translated_text: 'hello', source_lang: 'tr', target_lang: 'en' },
      { type: 'audio_chunk', data: 'AAAA', lang: 'en' },
      { type: 'quota_update', realtime_seconds_remaining: 120 },
      { type: 'error', code: 'bad', message: 'nope' },
    ];
    for (const m of valid) expect(parseServerMessage(JSON.stringify(m))).toEqual(m);
  });

  it.each([
    ['non-JSON', 'not json{'],
    ['JSON array', '[1,2]'],
    ['null', 'null'],
    ['missing type', JSON.stringify({ text: 'x' })],
    ['unknown type', JSON.stringify({ type: 'hack', text: 'x' })],
    ['client-only type', JSON.stringify({ type: 'auth', token: 't' })],
    ['missing field', JSON.stringify({ type: 'final_caption', source_text: 'a', source_lang: 'tr', target_lang: 'en' })],
    ['wrong field type', JSON.stringify({ type: 'partial_caption', text: 42, lang: 'tr' })],
    ['non-integer quota', JSON.stringify({ type: 'quota_update', realtime_seconds_remaining: 1.5 })],
    ['negative quota', JSON.stringify({ type: 'quota_update', realtime_seconds_remaining: -1 })],
    ['string quota', JSON.stringify({ type: 'quota_update', realtime_seconds_remaining: '10' })],
  ])('rejects %s', (_label, raw) => {
    expect(parseServerMessage(raw)).toBeNull();
  });

  it('rejects binary frames', () => {
    expect(parseServerMessage(new ArrayBuffer(4))).toBeNull();
  });

  it('drops unknown extra fields', () => {
    const msg = parseServerMessage(JSON.stringify({ type: 'detected_language', lang: 'en', extra: { a: 1 } }));
    expect(msg).toEqual({ type: 'detected_language', lang: 'en' });
  });
});

describe('protocol helpers', () => {
  it('encodes client messages', () => {
    expect(JSON.parse(encodeClientMessage({ type: 'auth', token: 'abc' }))).toEqual({ type: 'auth', token: 'abc' });
  });

  it('maps close codes to states', () => {
    expect(stateForClose(CloseCode.Auth, false)).toBe('auth_error');
    expect(stateForClose(CloseCode.QuotaExhausted, false)).toBe('quota_exhausted');
    expect(stateForClose(1006, false)).toBe('network_lost');
    expect(stateForClose(CloseCode.BadMessage, false)).toBe('error');
    expect(stateForClose(1006, true)).toBe('idle');
  });

  it('resolves the converse URL', () => {
    expect(resolveConverseUrl('ws://gw:8001', 'ws://localhost:8001')).toBe('ws://gw:8001/v1/converse');
    expect(resolveConverseUrl('wss://gw/v1/converse', 'ws://x')).toBe('wss://gw/v1/converse');
    expect(resolveConverseUrl('http://evil', 'ws://localhost:8001')).toBe('ws://localhost:8001/v1/converse');
  });
});

describe('reduceCaptions', () => {
  const langs = { langA: 'tr', langB: 'en' };
  it('routes translation to the listener half', () => {
    const s = reduceCaptions(
      emptyCaptions,
      { type: 'final_caption', source_text: 'merhaba', translated_text: 'hello', source_lang: 'tr', target_lang: 'en' },
      langs,
    );
    expect(s.bottom).toEqual([expect.objectContaining({ kind: 'heard', text: 'merhaba' })]);
    expect(s.top).toEqual([expect.objectContaining({ kind: 'forYou', text: 'hello' })]);

    const s2 = reduceCaptions(
      s,
      { type: 'final_caption', source_text: 'thanks', translated_text: 'teşekkürler', source_lang: 'en', target_lang: 'tr' },
      langs,
    );
    expect(s2.bottom.at(-1)).toEqual(expect.objectContaining({ kind: 'forYou', text: 'teşekkürler' }));
    expect(s2.top.at(-1)).toEqual(expect.objectContaining({ kind: 'heard', text: 'thanks' }));
  });
});

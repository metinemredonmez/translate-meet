import { ApiError, createApiClient } from '@/lib/apiClient';
import type { TokenStorage } from '@/lib/tokenStorage';

function memoryStorage(access: string | null, refresh: string | null): TokenStorage & { access: string | null; refresh: string | null } {
  const s = {
    access,
    refresh,
    getAccessToken: async () => s.access,
    getRefreshToken: async () => s.refresh,
    setTokens: async (p: { access_token: string; refresh_token: string }) => {
      s.access = p.access_token;
      s.refresh = p.refresh_token;
    },
    clear: async () => {
      s.access = null;
      s.refresh = null;
    },
  };
  return s;
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

const tick = () => new Promise((r) => setTimeout(r, 5));

describe('apiClient', () => {
  it('refreshes exactly once for concurrent 401s and retries every request', async () => {
    const storage = memoryStorage('old-access', 'refresh-1');
    let refreshCalls = 0;
    const fetchMock = jest.fn(async (url: string, init?: RequestInit) => {
      const auth = (init?.headers as Record<string, string> | undefined)?.Authorization;
      if (url.endsWith('/v1/auth/refresh')) {
        refreshCalls += 1;
        expect(JSON.parse(String(init?.body))).toEqual({ refresh_token: 'refresh-1' });
        await tick();
        return json(200, { access_token: 'new-access', refresh_token: 'refresh-2', token_type: 'bearer', expires_in: 900 });
      }
      if (auth !== 'Bearer new-access') {
        return json(401, { error: { code: 'unauthorized', message: 'expired' } });
      }
      return json(200, { path: url.replace('http://api', '') });
    });

    const client = createApiClient({ baseUrl: 'http://api', storage, fetchImpl: fetchMock as unknown as typeof fetch });
    const results = await Promise.all([
      client.get<{ path: string }>('/v1/me'),
      client.get<{ path: string }>('/v1/quota'),
      client.get<{ path: string }>('/v1/translations/a'),
      client.post<{ path: string }>('/v1/realtime/token', { source_lang: 'tr', target_lang: 'en' }),
    ]);

    expect(refreshCalls).toBe(1);
    expect(results.map((r) => r.path)).toEqual(['/v1/me', '/v1/quota', '/v1/translations/a', '/v1/realtime/token']);
    expect(storage.access).toBe('new-access');
    expect(storage.refresh).toBe('refresh-2');
  });

  it('clears tokens and reports auth loss when refresh is rejected', async () => {
    const storage = memoryStorage('old', 'revoked');
    const onAuthLost = jest.fn();
    const fetchMock = jest.fn(async (url: string) =>
      url.endsWith('/v1/auth/refresh')
        ? json(401, { error: { code: 'unauthorized', message: 'replay' } })
        : json(401, { error: { code: 'unauthorized', message: 'expired' } }),
    );
    const client = createApiClient({
      baseUrl: 'http://api',
      storage,
      fetchImpl: fetchMock as unknown as typeof fetch,
      onAuthLost,
    });

    await expect(client.get('/v1/me')).rejects.toMatchObject({ status: 401, code: 'unauthorized' });
    expect(onAuthLost).toHaveBeenCalledTimes(1);
    expect(storage.access).toBeNull();
    expect(storage.refresh).toBeNull();
  });

  it('maps the contract error shape to ApiError', async () => {
    const storage = memoryStorage('a', 'r');
    const fetchMock = jest.fn(async () => json(402, { error: { code: 'quota_exceeded', message: 'no chars left' } }));
    const client = createApiClient({ baseUrl: 'http://api', storage, fetchImpl: fetchMock as unknown as typeof fetch });

    const err = await client.post('/v1/translate/text', { text: 'x' }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 402, code: 'quota_exceeded', message: 'no chars left' });
  });

  it('sends Idempotency-Key and Bearer headers as given', async () => {
    const storage = memoryStorage('tok', 'r');
    const fetchMock = jest.fn(async (_url: string, _init?: RequestInit) => json(200, { ok: true }));
    const client = createApiClient({ baseUrl: 'http://api', storage, fetchImpl: fetchMock as unknown as typeof fetch });
    await client.post('/v1/translate/text', { text: 'hi' }, { headers: { 'Idempotency-Key': 'k-1' } });
    const headers = fetchMock.mock.calls[0]?.[1]?.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer tok');
    expect(headers['Idempotency-Key']).toBe('k-1');
  });
});

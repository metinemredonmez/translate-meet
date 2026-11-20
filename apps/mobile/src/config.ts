/**
 * Public client config. Only non-secret URLs may live in EXPO_PUBLIC_* (they are bundled into the app).
 * KEY-02: no API keys or secrets here.
 */
function clean(url: string | undefined, fallback: string): string {
  const v = (url ?? '').trim();
  return (v.length > 0 ? v : fallback).replace(/\/+$/, '');
}

export const config = {
  apiUrl: clean(process.env.EXPO_PUBLIC_API_URL, 'http://localhost:8000'),
  gatewayUrl: clean(process.env.EXPO_PUBLIC_GATEWAY_URL, 'ws://localhost:8001'),
} as const;

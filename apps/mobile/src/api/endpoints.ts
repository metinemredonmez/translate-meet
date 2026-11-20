import * as Crypto from 'expo-crypto';
import { api } from '@/lib/api';
import type { TokenPair } from '@/lib/tokenStorage';
import type { Me, Quota, RealtimeTokenResponse, Translation } from './types';

export function translateText(input: { text: string; source_lang: string; target_lang: string }) {
  // A fresh Idempotency-Key per submit (required by the API; RES-01).
  return api.post<Translation>('/v1/translate/text', input, {
    headers: { 'Idempotency-Key': Crypto.randomUUID() },
  });
}

export const getMe = () => api.get<Me>('/v1/me');
export const getQuota = () => api.get<Quota>('/v1/quota');

export function createRealtimeToken(input: { source_lang: string; target_lang: string }) {
  return api.post<RealtimeTokenResponse>('/v1/realtime/token', input);
}

export function oauthSignIn(input: { provider: 'apple' | 'google'; id_token: string; nonce: string }) {
  return api.post<TokenPair>('/v1/auth/oauth', input, { auth: false });
}

export function logout(refresh_token: string) {
  return api.post<void>('/v1/auth/logout', { refresh_token }, { auth: false });
}

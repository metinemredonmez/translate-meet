import { create } from 'zustand';
import { secureTokenStorage, type TokenPair } from '@/lib/tokenStorage';
import { setAuthLostHandler } from '@/lib/api';
import { logout, oauthSignIn } from '@/api/endpoints';

export type AuthStatus = 'unknown' | 'signedOut' | 'signedIn';

interface AuthState {
  status: AuthStatus;
  /** Load token presence from secure storage at startup. Tokens themselves are never kept in JS state. */
  hydrate: () => Promise<void>;
  /** Exchange a provider ID token for our TokenPair. Server always validates; there is no local bypass. */
  signInWithIdToken: (provider: 'apple' | 'google', idToken: string, nonce: string) => Promise<void>;
  setTokens: (pair: Pick<TokenPair, 'access_token' | 'refresh_token'>) => Promise<void>;
  signOut: () => Promise<void>;
  markSignedOut: () => void;
}

export const useAuth = create<AuthState>()((set, get) => ({
  status: 'unknown',
  async hydrate() {
    const refresh = await secureTokenStorage.getRefreshToken();
    set({ status: refresh ? 'signedIn' : 'signedOut' });
  },
  async signInWithIdToken(provider, idToken, nonce) {
    const pair = await oauthSignIn({ provider, id_token: idToken, nonce });
    await get().setTokens(pair);
  },
  async setTokens(pair) {
    await secureTokenStorage.setTokens(pair);
    set({ status: 'signedIn' });
  },
  async signOut() {
    const refresh = await secureTokenStorage.getRefreshToken();
    if (refresh) await logout(refresh).catch(() => undefined);
    await secureTokenStorage.clear();
    set({ status: 'signedOut' });
  },
  markSignedOut() {
    set({ status: 'signedOut' });
  },
}));

setAuthLostHandler(() => useAuth.getState().markSignedOut());

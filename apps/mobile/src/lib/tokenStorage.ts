import * as SecureStore from 'expo-secure-store';

/** Tokens live only in the OS keychain/keystore (expo-secure-store), never in AsyncStorage. */
const ACCESS_KEY = 'tm.access_token';
const REFRESH_KEY = 'tm.refresh_token';

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: 'bearer';
  expires_in: number;
}

export interface TokenStorage {
  getAccessToken(): Promise<string | null>;
  getRefreshToken(): Promise<string | null>;
  setTokens(pair: Pick<TokenPair, 'access_token' | 'refresh_token'>): Promise<void>;
  clear(): Promise<void>;
}

export const secureTokenStorage: TokenStorage = {
  getAccessToken: () => SecureStore.getItemAsync(ACCESS_KEY),
  getRefreshToken: () => SecureStore.getItemAsync(REFRESH_KEY),
  async setTokens(pair) {
    await SecureStore.setItemAsync(ACCESS_KEY, pair.access_token);
    await SecureStore.setItemAsync(REFRESH_KEY, pair.refresh_token);
  },
  async clear() {
    await SecureStore.deleteItemAsync(ACCESS_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
  },
};

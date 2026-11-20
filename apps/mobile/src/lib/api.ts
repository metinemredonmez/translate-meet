import { config } from '@/config';
import { useSettings } from '@/store/settings';
import { createApiClient } from './apiClient';
import { secureTokenStorage } from './tokenStorage';

let onAuthLost: () => void = () => undefined;
/** The auth store registers itself here to avoid an import cycle. */
export function setAuthLostHandler(fn: () => void) {
  onAuthLost = fn;
}

export const api = createApiClient({
  baseUrl: config.apiUrl,
  storage: secureTokenStorage,
  onAuthLost: () => onAuthLost(),
  getLanguage: () => useSettings.getState().appLanguage,
});

import type { DictKey } from '@/i18n';
import { ApiError } from './apiClient';

export function errorKey(err: unknown): DictKey {
  if (err instanceof ApiError) {
    return err.code === 'unknown' ? 'error.unknown' : (`error.${err.code}` as DictKey);
  }
  return 'error.unknown';
}

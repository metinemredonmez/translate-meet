// Mirrors packages/shared/CONTRACT.md (Sprint 1). Replace with generated types once packages/shared ships them.
export interface Translation {
  id: string;
  source_lang: string;
  target_lang: string;
  source_text: string;
  translated_text: string;
  provider: string;
  created_at: string;
}

export interface Me {
  id: string;
  email: string | null;
  locale: string;
}

export interface Quota {
  text_chars_remaining: number;
  realtime_seconds_remaining: number;
  resets_at: string;
}

export interface RealtimeTokenResponse {
  token: string;
  expires_in: number;
  gateway_url: string;
}

export const MAX_TEXT_CHARS = 5000;

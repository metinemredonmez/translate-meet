# API ve WebSocket sözleşmesi (Sprint 1)

Tüm gövde JSON. Hata biçimi: `{"error": {"code": "<kod>", "message": "<kısa>"}}`.

## API (`apps/api`, varsayılan http://localhost:8000)

| Yöntem | Yol | Gövde | Yanıt |
|---|---|---|---|
| GET | `/healthz` | – | `{"status":"ok"}` |
| POST | `/v1/auth/oauth` | `{"provider":"apple"\|"google","id_token":str,"nonce":str}` | `TokenPair` |
| POST | `/v1/auth/refresh` | `{"refresh_token":str}` | `TokenPair` (eski refresh geçersiz; tekrar kullanımda tüm oturum ailesi iptal → 401) |
| POST | `/v1/auth/logout` | `{"refresh_token":str}` | 204 |
| GET | `/v1/me` | – (Bearer) | `{"id":str,"email":str\|null,"locale":str}` |
| GET | `/v1/quota` | – (Bearer) | `{"text_chars_remaining":int,"realtime_seconds_remaining":int,"resets_at":iso8601}` |
| POST | `/v1/translate/text` | `{"text":str(1..5000),"source_lang":str,"target_lang":str}` + başlık `Idempotency-Key` (zorunlu) | `Translation` |
| GET | `/v1/translations/{id}` | – (Bearer) | `Translation` (başkasınınsa 404) |
| POST | `/v1/realtime/token` | `{"source_lang":str,"target_lang":str}` (Bearer) | `{"token":str,"expires_in":60,"gateway_url":str}` |

`TokenPair = {"access_token":str,"refresh_token":str,"token_type":"bearer","expires_in":int}`
`Translation = {"id":str,"source_lang":str,"target_lang":str,"source_text":str,"translated_text":str,"provider":str,"created_at":iso8601}`

Hata kodları: `unauthorized`(401), `not_found`(404), `quota_exceeded`(402), `validation_error`(422), `idempotency_conflict`(409), `rate_limited`(429), `internal`(500).
Dil kodları: BCP-47 kısa (`tr`, `en`, `ar`, `de`, `ru`, …).

## WebSocket (`apps/gateway`, varsayılan ws://localhost:8001/v1/converse)

Bağlandıktan sonra **ilk mesaj 5 sn içinde** `auth` olmalı; yoksa kapanış kodu 4401.

İstemci → sunucu:
- `{"type":"auth","token":"<realtime token>"}`
- `{"type":"start","source_lang":"tr","target_lang":"en","mode":"two_way"|"one_way"}`
- `{"type":"audio","seq":int,"data":"<base64 PCM16 mono 16 kHz, en çok 32 KB>"}`
- `{"type":"text","text":"..."}` (geliştirme/mock: ses yerine metin)
- `{"type":"stop"}`

Sunucu → istemci:
- `{"type":"ready","session_id":str,"provider":str}`
- `{"type":"detected_language","lang":str}`
- `{"type":"partial_caption","text":str,"lang":str}`
- `{"type":"final_caption","source_text":str,"translated_text":str,"source_lang":str,"target_lang":str}`
- `{"type":"audio_chunk","data":"<base64 PCM16 mono>","lang":str,"sample_rate":24000}` (`sample_rate` Sprint 2'de eklendi; eski istemciler yok sayar)
- `{"type":"quota_update","realtime_seconds_remaining":int}`
- `{"type":"error","code":str,"message":str}` — oturumu kapatmayan uyarılar: `text_not_supported` (gerçek sağlayıcılar yalnız ses kabul eder), `soniox_tts_*` (altyazı sürer, ses üretilemedi). Kapanışla gelen: `provider_error`, `provider_unavailable`, `quota_exceeded`, …

Kapanış kodları: 4401 kimlik, 4402 kota bitti, 4403 origin reddi, 4408 süre aşımı, 4422 bozuk mesaj, 4429 hız sınırı, 1011 sunucu hatası.

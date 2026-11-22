# ADR 0003 — Sağlayıcı yön tablosu

- Durum: Kabul edildi (2026-11-20)
- Karar: Yönlendirme **yön bazlı** (`tr->en` ≠ `en->tr`), `TM_ROUTES` ayarından okunur; satır yoksa `*` kullanılır. Model adları kodda değil ayarda.
- Kısıt: OpenAI `gpt-realtime-translate` yalnız 13 hedef dil destekler, **Türkçe çıkış yok**; Türkçe hedefli veya iki yönlü (TR dahil) oturumda seçilmez (testle kanıtlı).
- Varsayılan sıra: Gemini 3.5 Live Translate → Soniox two-way (+TTS) → (TR→EN için) OpenAI → mock (yalnız dev/test).
- Kayıt: Yalnız anahtarı tanımlı sağlayıcı kayda girer; prod'da mock kapalı olmak zorunda (başlangıçta reddedilir).

## Güncelleme — Sprint 2 (2026-11-22)

- **Gemini Live Translate**: oturum başına tek hedef dil. İki yönlü görüşmede aynı ses iki oturuma gider (hedef A, hedef B); `echoTargetLanguage=false` ile her oturum yalnız yabancı konuşmayı çevirir. Girdi maliyeti ×2. Anahtar dokümana göre URL'de (`?key=`) gider → URL hiçbir yerde loglanmaz, bağlantı hataları zincirsiz kısa kodla yükselir.
- **Soniox**: tek akışta `two_way` çeviri (`stt-rt-v6`), anahtar `Authorization: Bearer` başlığında (config'teki `api_key` alanı 2027-01-15'te kapanıyor, kullanılmaz). Seslendirme isteğe bağlı `tts-rt-v2` (PCM16 24 kHz); `TM_SONIOX_TTS_VOICE` boşsa yalnız altyazı.
- **Yedeğe geçiş**: birincil sağlayıcı açılamazsa sıradaki denenir; hiçbiri açılamazsa oturum 1011 ile kapanır, kota rezervasyonu bırakılır (ARC-05).
- **AB bölgesi**: Soniox `stt-rt.eu.soniox.com` / `tts-rt.eu.soniox.com` (AB projesi + anahtarı gerekir) ayarla seçilir.

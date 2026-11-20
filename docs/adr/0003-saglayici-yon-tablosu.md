# ADR 0003 — Sağlayıcı yön tablosu

- Durum: Kabul edildi (2026-11-20)
- Karar: Yönlendirme **yön bazlı** (`tr->en` ≠ `en->tr`), `TM_ROUTES` ayarından okunur; satır yoksa `*` kullanılır. Model adları kodda değil ayarda.
- Kısıt: OpenAI `gpt-realtime-translate` yalnız 13 hedef dil destekler, **Türkçe çıkış yok**; Türkçe hedefli veya iki yönlü (TR dahil) oturumda seçilmez (testle kanıtlı).
- Varsayılan sıra: Gemini 3.5 Live Translate → Soniox two-way (+TTS) → (TR→EN için) OpenAI → mock (yalnız dev/test).
- Kayıt: Yalnız anahtarı tanımlı sağlayıcı kayda girer; prod'da mock kapalı olmak zorunda (başlangıçta reddedilir).

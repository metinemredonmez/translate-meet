# ADR 0002 — Gerçek zamanlı taşıma

- Durum: Kabul edildi (2026-11-20)
- Karar:
  - Tek cihaz Converse / Translate: mobil → **bizim WebSocket gateway'imiz** → sağlayıcı (relay). Sağlayıcı anahtarı yalnız gateway'de (KEY-02).
  - Toplantı odası (Faz 2): **LiveKit SFU + çeviri işçisi**; aynı hedef dil kanalı tüm dinleyicilere paylaşılır.
  - Ephemeral token ile istemciden sağlayıcıya doğrudan bağlantı ileride, ölçüm gerekçesiyle değerlendirilir.
- Kimlik: API, 60 sn ömürlü, ayrı anahtar + `aud=translate-meet-gateway` + `typ=rt` taşıyan realtime token basar (TOK-02). Token dil çiftini bağlar; istemci oturumda çifti değiştiremez.
- WS kuralları: ilk mesaj 5 sn içinde `auth`; Origin varsa izin listesi; her mesaj şema + boyut + hız kontrolünden geçer (API-04, INP-01).
- Kota: oturum başında bir "tick" rezerve edilir, her tick'te tüketilir ve sonraki rezerve edilir; kota servisi yanıt vermezse oturum açılmaz (ARC-05, RES-01).

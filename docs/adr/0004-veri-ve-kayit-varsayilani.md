# ADR 0004 — Veri ve kayıt varsayılanı

- Durum: Kabul edildi (2026-11-20)
- Karar:
  - Ham ses **kaydedilmez**; gateway sesi yalnız sağlayıcıya akıtır. Kayıt/tutanak kullanıcı açarsa ve ekranda görünürse yapılır (Faz 2).
  - Loglarda yalnız kimlik ve kod; ses, altyazı, çeviri metni ve token loga yazılmaz (LOG-02).
  - Metin çeviri geçmişi kullanıcıya ait kayıttır; başka kullanıcı erişiminde 404 (AZ-01).
  - Sağlayıcı seçiminde AB bölgesi ve sıfır saklama (ZDR) seçeneği tercih edilir; KVKK yurt dışı aktarım bilgisi aydınlatma metnine girer.
  - Ses klonu ayrı rıza, ayrı saklama ve silme denetimiyle Faz 4'te.

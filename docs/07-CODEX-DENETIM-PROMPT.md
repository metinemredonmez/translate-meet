# Codex denetim promptu — backend (API + gateway)

Kullanım: repo kökünde (`translate-app`) Codex'i aç, aşağıdaki ```text bloğunu yapıştır.
Codex **kod değiştirmez, commit/push yapmaz**; yalnız rapor yazar. Düzeltmeleri rapordan sonra Claude uygular.

---

```text
Rolün: kıdemli uygulama güvenliği denetçisi + backend kod inceleyicisi. Türkçe yaz.
Kapsam: translate-meet backend'i — apps/api (FastAPI), apps/gateway (WebSocket gateway), scripts/anahtar_ekle.py.
Kapsam DIŞI: apps/mobile, docs/, tasarım kiti.

## Önce oku
- README.md, packages/shared/CONTRACT.md (API + WS sözleşmesi)
- docs/01-ANALIZ.md §6 (güvenlik temeli), docs/adr/*.md, docs/06-OLCUM.md
- Güvenlik kataloğu (yerel, SADECE OKU): /Users/emre/Code/red-team
  - Kontrol kartları:  uv run --project /Users/emre/Code/red-team redteam controls --priority P0
    (ilgili aileler: ARC, INP, BUS, API, AUT, SES, AZ, TOK, KEY, NET, OPS, DAT, LOG, EXT, RES, EXC, AI)
  - Tek kart:           uv run --project /Users/emre/Code/red-team redteam controls SES-05 TOK-02
  - Bulgu şablonu:      /Users/emre/Code/red-team/templates/bulgu.md
  - Bilinen geçmiş açıklar (aynı kök neden burada da var mı?): /Users/emre/Code/red-team/catalog/findings.yaml (A1–B4)
  - Test kuralları:     /Users/emre/Code/red-team/docs/03-test-kurallari.md

## Çalıştır (kanıt topla)
1. Testler:      (cd apps/api && uv run pytest) ; (cd apps/gateway && uv run pytest)
2. Lint:         (cd apps/api && uv run ruff check .) ; (cd apps/gateway && uv run ruff check .)
3. SAST:         uvx semgrep --metrics=off --config /Users/emre/Code/red-team/rules/semgrep apps/api apps/gateway scripts
                 uvx semgrep --metrics=off --config p/python --config p/secrets apps/api apps/gateway scripts
4. Bağımlılık:   (cd apps/api && uv run pip-audit) ; (cd apps/gateway && uv run pip-audit)
5. Gerekirse yerelde API/gateway'i ayağa kaldırıp (SQLite, mock sağlayıcı) olumsuz istekler dene.
   GERÇEK sağlayıcı anahtarlarıyla (apps/*/.env) çağrı YAPMA; .env içeriğini okuma, rapora yazma.

## Denetlenecek başlıklar (en az bunlar)
- Kimlik: Apple/Google ID token doğrulaması (aud/iss/exp/nonce, JWKS), hesap bağlama (e-posta ile otomatik bağlama yok mu?) — TOK-01..05, AUT-*
- Oturum: access JWT (alg sabit, aud/iss/typ), refresh rotasyonu ve tekrar kullanımda aile iptali, logout — SES-01..05
- Amaç ayrımı: access token ↔ realtime token ↔ internal service token karışabiliyor mu? — TOK-02, ARC-04
- Yetki: BOLA (başkasının çevirisi/rezervasyonu), internal uçlar (/internal/*) dışarıdan erişim, 404 politikası — AZ-01..04, NET-04
- Kota / iş mantığı: reserve→commit→release, Idempotency-Key, yarış koşulları (aynı anahtarla eşzamanlı istek), negatif/aşırı değerler, gateway tick muhasebesi — BUS-01..05, RES-01
- WebSocket: ilk mesaj auth + zaman aşımı, Origin, şema/boyut/hız sınırı, dil çiftinin token'a bağlanması, kapanış kodları, kaynak sızıntısı (açık kalan upstream bağlantı/task) — API-04, INP-01, EXC-01
- Sağlayıcı adaptörleri (Gemini, Soniox, ElevenLabs, çeviri zinciri): anahtarın URL/log/hata mesajına sızması, upstream'den gelen verinin doğrulanması, kesik çıktı, devre kesici — KEY-02, LOG-02, EXT-*
- LLM: kullanıcı metninin talimat olarak işlenmesi (dolaylı prompt injection), çıktı işleme — AI-01, AI-02
- Yapılandırma: prod'da güvensiz varsayılanla başlama engeli, boş anahtar satırları, sır yönetimi, scripts/anahtar_ekle.py dosya izinleri ve ekrana sızıntı — KEY-01..03, OPS-01
- Hata işleme ve loglama: fail-closed, iç detay sızıntısı, güvenlik olayları (LOG-01), kişisel veri/metin/ses loglanıyor mu (LOG-02)
- Veri: çeviri metinlerinin saklanması, silme, KVKK açısından minimizasyon — DAT-*
- Kod kalitesi: hatalı async kullanımı, iptal edilmeyen görevler, sessizce yutulan istisnalar, test edilmemiş dallar, ölü kod

## Kurallar
- Hiçbir dosyayı DEĞİŞTİRME, kod yazma, commit/push YAPMA. Yalnız rapor dosyası oluştur.
- Gerçek kullanıcı verisi, gerçek sağlayıcı çağrısı, üçüncü taraf hedef YOK (03-test-kurallari.md).
- Kanıtta token, anahtar, e-posta, oturum kimliği MASKELENİR.
- Kanıtsız "güvenli" deme. Durum dili: Doğrulanacak / Geçti / Kaldı / Uygulanmaz / Risk kabul edildi.
- CVSS'i yorumla şişirme; zincir etkisi ayrı vektörle.
- Emin olmadığın bulguyu "Doğrulanacak" olarak işaretle, uydurma.

## Çıktı: docs/codex/DENETIM-RAPORU.md
1. Özet: kapsam (commit hash), çalıştırılan komutlar ve gerçek sonuçları (geçen/kalan sayıları).
2. Bulgu tablosu: kimlik (TM-01…), başlık, önem, ilgili kontrol, durum — önem sırasına göre.
3. Her bulgu için /Users/emre/Code/red-team/templates/bulgu.md alanlarının TAMAMI:
   CWE, ASVS 5.0.0 madde kimliği, OWASP Top 10:2025, CVSS 3.1 ve CVSS 4.0 tam vektör, ön koşul,
   sömürü senaryosu, etki, önerilen düzeltme (dosya:satır), yeniden test (olumlu + olumsuz test önerisi), kalan risk.
4. P0 kontrol matrisi: ilgili her P0 kontrolü için Geçti / Kaldı / Doğrulanacak / Uygulanmaz + kanıt (dosya:satır ya da test adı).
5. findings.yaml (A1–B4) karşılaştırması: aynı kök neden burada var mı?
6. Önceliklendirilmiş düzeltme listesi (önce P0 kalanlar), her biri için tahmini iş büyüklüğü.
```

# Codex kodlama promptu — Sprint 1 (Faz 0 iskelet + Faz 1 temeli)

Kullanım: repo kökünde Codex'i aç, aşağıdaki ```text bloğunu yapıştır. Görsel gerekmez.
Codex `feat/sprint-1-iskelet` dalında çalışır, küçük commit'ler atar, **push etmez**; inceleme ve push Claude/kullanıcıda.

---

```text
Rolün: kıdemli full-stack + mobil mühendis. Türkçe kısa raporla, kodda İngilizce isimlendirme.

## Önce oku
- docs/01-ANALIZ.md (özellikle §3 mimari, §6 güvenlik temeli)
- docs/02-ROADMAP.md (v2 — Faz 0 ve Faz 1)
- docs/04-TASARIM-KAYNAKLARI.md (yığın, kit parçaları, kurallar, tuzaklar)
- docs/codex/CODEX-ANALIZ.md §2 ve §9 (senin önceki analizin)
Tasarım kiti yerelde: ~/Desktop/uygulama-tasarim-kaynaklari (SADECE OKU, değiştirme).
Kit parçalarını birebir kopyalama; uyarla. Renkler satır içi hex değil, token (palet: deep-teal,
~/Desktop/uygulama-tasarim-kaynaklari/2-renk-paletleri/palet-kutuphanesi/tokens/ts/palettes.ts).
`com.yedioda.*`, `yedioda://`, Yedi Oda API adresleri projeye GİRMEZ.

## Hedef (bu sprint)
Çalışan, test edilen bir monorepo iskeleti + ilk dikey dilim: "Translate (metin)" uçtan uca ve
"Converse" için gateway'in sahte (mock) sağlayıcıyla çalışan WS akışı. Gerçek sağlayıcı çağrısı
YOK (anahtar yok); adaptörler arayüz + iskelet + birim testleriyle gelir.

## Yığın (değiştirme)
- pnpm workspaces monorepo
- apps/mobile: Expo SDK 54 (dev client), React Native 0.81, expo-router 6, NativeWind 4, zustand, TanStack Query 5
- apps/api: FastAPI, SQLAlchemy 2, Alembic, Pydantic v2, Python 3.13 + uv, PostgreSQL, Redis
- apps/gateway: ayrı asyncio servis (FastAPI WebSocket, uvicorn), Redis
- packages/shared: OpenAPI'den üretilen TS istemci tipleri + ortak WS mesaj şemaları (JSON Schema / zod)
- Docker YOK (dağıtım pm2 + nginx); yerel geliştirme için Postgres/Redis'i README'de anlat
  (docker-compose sadece isteğe bağlı dev kolaylığı olarak eklenebilir, prod'a girmez)

## Yapılacaklar (sırayla, her madde ayrı commit)
1. Kök: pnpm-workspace.yaml, package.json script'leri (lint, typecheck, test), .editorconfig,
   .env.example dosyaları (yalnız DEĞİŞKEN ADLARI, değer yok), README "Yerel kurulum" bölümü.
2. apps/api:
   - Ayar katmanı (pydantic-settings); prod profilde güvensiz varsayılanla başlamayı reddet (KEY-01, OPS-01).
   - /healthz, /readyz.
   - Kimlik iskeleti: Apple/Google ID token doğrulama arayüzü (gerçek JWKS doğrulaması, aud/iss/exp/nonce;
     test için sahte JWKS), kısa ömürlü access JWT (alg sabit, aud/iss zorunlu) + dönen refresh token ailesi;
     refresh tekrar kullanımında tüm aile iptal (SES-05, TOK-01/02/03).
   - Kullanıcı, oturum, kota defteri modelleri + ilk Alembic göçü.
   - Kota defteri: reserve → commit → release, Idempotency-Key ile (RES-01, BUS-02).
   - POST /v1/translate/text: Pydantic şema (uzunluk sınırı), sağlayıcı arayüzü üzerinden çeviri
     (MockTranslator varsayılan), kota rezervasyonu, kullanıcıya ait olmayan kaynağa 404.
   - Hata işleyici: fail-closed, iç detay sızdırmaz (EXC-01). Yapılandırılmış güvenlik logu; metin/ses
     içeriği ve token loga yazılmaz (LOG-01, LOG-02).
   - pytest: her uç için ≥1 olumlu + ≥1 olumsuz test (geçersiz token, süresi dolmuş token, başkasının
     kaynağı, kota aşımı, aynı Idempotency-Key ile çift istek, refresh replay).
3. apps/gateway:
   - WS /v1/converse: bağlantı açılışında kısa ömürlü oturum token'ı doğrula + Origin kontrolü;
     her mesajda şema doğrula; mesaj boyutu ve hız sınırı (API-04, INP-01).
   - Oturum başında kota rezerve et, periyodik (10 sn) tüket, bitişte serbest bırak; kota servisi
     cevap vermezse oturum AÇILMAZ (ARC-05).
   - Sağlayıcı arayüzü `RealtimeTranslator` (start/send_audio/events/close) + yön bazlı yönlendirme
     tablosu (`TR->EN`, `EN->TR` ayrı satır, ayardan okunur, model adı koda gömülmez).
   - Adaptör iskeletleri: MockTranslator (deterministik, testler için), GeminiLiveTranslate,
     SonioxTwoWay, OpenAIRealtimeTranslate (yalnız hedef 13 dilden biriyse seçilebilir — Türkçe hedef
     için seçilmesin, testle kanıtla). Gerçek ağ çağrıları bayrak arkasında, anahtar yoksa devre dışı.
   - Olaylar: partial_caption, final_caption, audio_chunk, detected_language, error, quota_update.
   - pytest-asyncio testleri: kimliksiz bağlantı reddi, yanlış origin reddi, bozuk mesaj, kota bitince
     kapanış, mock ile uçtan uca altyazı akışı, yönlendirme tablosu seçimi.
4. packages/shared: WS mesaj şemaları + API OpenAPI'den TS tip üretimi script'i.
5. apps/mobile:
   - Expo 54 + expo-router; sekmeler: Converse, Translate, Ayarlar. Tema token'ları (deep-teal, koyu+açık).
   - i18n TR/EN (kit `mobil/13-iki-dil-tr-en` deseni, genişletilebilir).
   - API istemcisi + tek uçuşlu 401 yenileme, token'lar expo-secure-store'da (kit `mobil/11`).
     `EXPO_PUBLIC_` ile yalnız API/gateway adresi; sır YOK (KEY-02).
   - Translate ekranı: yaz/yapıştır → /v1/translate/text → sonuç, kopyala. Bas-konuş butonu UI (kit `mobil/22`
     uyarlaması) — ses gönderimi bu sprintte mock.
   - Converse ekranı: iki dil seçici + değiştir, bölünmüş ekran (karşı tarafa dönük üst yarı 180°),
     gateway'e WS bağlantısı, mock olaylarla canlı altyazı. Durumlar: bağlanıyor, kota bitti, ağ koptu, izin reddi.
   - Ayarlar: uygulama dili, konuşma hızı 0.5–2.0x, otomatik oynatma (yerel durum).
   - Jest + React Native Testing Library ile birkaç bileşen testi.
6. CI (.github/workflows/ci.yml): pnpm install, typecheck, lint, test (mobile), uv sync + pytest (api, gateway),
   semgrep (p/python, p/typescript), bağımlılık taraması (pip-audit, pnpm audit) — başarısızlık CI'ı DÜŞÜRÜR.
   Secret taraması (gitleaks).
7. docs/adr/: 0001-monorepo-ve-yigin.md, 0002-realtime-tasima.md (tek cihaz WS relay, oda için LiveKit SFU),
   0003-saglayici-yon-tablosu.md, 0004-veri-ve-kayit-varsayilani.md (kayıt kapalı, AB bölgesi tercihi).

## Kurallar
- Sır, API anahtarı isteme/yazma; .env dosyası commit etme. Değişken ADLARINI .env.example'a yaz.
- Ağdan sağlayıcıya gerçek istek atan test yazma; mock kullan.
- Ses/metin içeriğini log'a yazma. Yetki kararında istemciden gelen kullanıcı/rol/kota değerine güvenme.
- Kod yorumlarında yalnız gerekli yerde kontrol kimliği (ör. `# SES-05: refresh replay -> family revoke`).
- Mevcut docs/ dosyalarını değiştirme (yalnız docs/adr/ ekle). Tasarım kiti klasörünü değiştirme.
- Dal: `git switch -c feat/sprint-1-iskelet`. Küçük, anlamlı commit'ler. PUSH YAPMA.
- Bir adım çalışmıyorsa (ör. Expo kurulum hatası) uydurma; durumu rapora yaz, sonraki adıma geç.

## Bitince rapor (Türkçe, kısa)
- Yapılanlar (madde = commit), çalıştırma komutları, test sonuçları (geçen/kalan sayıları, gerçek çıktı).
- Yapılamayanlar ve neden. Sonraki sprint için öneri (gerçek sağlayıcı entegrasyonu: Gemini + Soniox ölçüm harness'i).
```

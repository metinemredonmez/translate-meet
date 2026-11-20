# translate-meet — Roadmap (v2)

> v2 (2026-11-20): Codex'in bağımsız analizi (`docs/codex/CODEX-ANALIZ.md` §9–10) ile birleştirildi.
> Değişenler: toplantı odası Faz 4'ten **Faz 2'ye** çekildi; ilk uçtan uca çift **TR↔EN**, saha pilotu **TR↔AR**;
> ilk müşteri hipotezi **ihracatçı KOBİ görüşmeleri**; OpenAI realtime-translate Türkçe çıkış vermediği için Türkçe S2S adayı **Gemini 3.5 Live Translate**;
> çevrimdışıda NLLB yok (ticari değil); klon ve Practice sona.
>
> Süreler kaba: 1–2 geliştirici + AI asistan. Her fazın "Bitti" tanımı sağlanmadan sonrakine geçilmez.
> Güvenlik P0'ları (bkz. `01-ANALIZ.md` §6) Faz 0–1'de kurulur, sonradan eklenmez.

## Faz 0 — Ölçüm, iskelet, P0 temeli (2 hafta)

- [ ] Pilot corpus (izinli/sentetik): TR↔EN, TR↔AR; isim, sayı, olumsuzluk, aksan, üst üste konuşma, kod değiştirme
- [ ] Gecikme + kalite + maliyet ölçümü, aynı set ile:
  - S2S: Gemini 3.5 Live Translate (TR çıkış), Azure Live Interpreter; OpenAI realtime-translate yalnız TR→EN
  - Kademeli: Soniox `two_way` STT+çeviri → Soniox / ElevenLabs / Cartesia TTS
  - Ölçüm noktaları: kaynak başı→karşıda ilk anlamlı ses, kaynak sonu→çevirinin tamamı, altyazı ilk görünüm/sabitlenme (p50/p95, yön ve ağ başına)
  - Alfa hedefi: kararlı altyazı p95 ≤ 1,5 sn, ilk anlamlı ses p95 ≤ 3,0 sn (Wi-Fi referans)
- [ ] Monorepo iskeleti (pnpm): `apps/mobile` (Expo 54 dev build), `apps/api` (FastAPI), `apps/gateway`, `packages/shared`
- [ ] CI: tip kontrolü, test, SAST, bağımlılık + secret taraması (`|| true` YOK)
- [ ] Expo dev build iOS + Android, LiveKit RN / WebRTC mikrofon yolu prototipi (özel PCM köprüsü sadece gerekirse)
- [ ] ADR'ler `docs/adr/`: taşıma (tek cihaz WS relay vs oda SFU), sağlayıcı yön tablosu, veri bölgesi (AB), kayıt varsayılanı kapalı
- [ ] P0 kabul listesi + yürütülebilir negatif testler (kimlik, kiracı, oda izni, kota, replay)

**Bitti:** ölçüm tablosu + birincil/yedek sağlayıcı seçimi + ADR'ler + iskelet CI'da yeşil.

## Faz 1 — Türkçe ilk çeviri: Translate + Converse (3–4 hafta)

- [ ] Kimlik: Apple / Google ile giriş (jeton sunucuda doğrulanır) + e-posta OTP; refresh rotasyonu, tekrar kullanımda aile düşer
- [ ] Gateway: WS kimlik + origin + mesaj yetkisi, kota rezervasyonu (rezerve → tüket → serbest bırak), idempotency, fail-closed
- [ ] **Translate**: yaz/yapıştır, bas-konuş, kopyala, yer imi
- [ ] **Converse**: TR↔EN, iki dili algıla, bölünmüş ekran, otomatik oynatma, hız 0.5–2.0x; düşük güvende ses yerine düzeltilebilir altyazı
- [ ] Sessizlik / ağ kopması / izin reddi durumları
- [ ] Ayarlar: uygulama dili TR/EN, hız, otomatik oynatma, hesap silme
- [ ] Kullanım ve maliyet ölçümü sağlayıcı faturasıyla mutabık

**Bitti:** Android + iOS iç dağıtım; replay / çift ücret / kiracılar arası erişim testleri geçer.

## Faz 2 — translate-meet oda alfası + dinleme modu (4 hafta)

- [ ] Kurucu oda açar; misafir **QR / bağlantı** ile katılır (tarayıcıdan dinleme dahil, kurulum yok)
- [ ] LiveKit SFU + çeviri işçisi; her katılımcı kendi hedef dilini seçer; aynı dil kanalı paylaşılır
- [ ] Tek aktif konuşma sırası, konuşmacı etiketi, kaynak + hedef altyazı yan yana
- [ ] Uzak oda ve aynı mekân profilleri (yankı: tek mikrofon / kulaklık kuralı)
- [ ] Kayıt varsayılan kapalı; kayıt durumu görünür; kaynaklı dışa aktarılabilir tutanak
- [ ] Kısa ömürlü davet, çıkarılan misafir geri giremez, sentetik ses bildirimi
- [ ] Dinleme modu (tek yönlü: sunum, tur, ders)
- [ ] Dil başına oda maliyeti ölçülür

**Bitti:** 3 dilli gerçek oda testi; iptal / yeniden bağlanma / kota / yankı senaryoları geçer.

## Faz 3 — Ücretli pilot, kamera, notlar (3–4 hafta)

- [ ] Abonelik: Ücretsiz / Pro; RevenueCat, Restore, iptal; sunucu hak mutabakatı; webhook HMAC imza + replay koruması
  - Paywall deneyi: aylık Pro + şeffaf standart/canlı kota; yıllıkta tahsil edilen dönem toplamı aylık eşdeğerden önce görünür
- [ ] Ekip: web panelde yönetici, koltuk, oda kotası, ortak sözlük; yönetici MFA
- [ ] **Camera**: fotoğraf çek / galeriden seç → cihaz üstü OCR (Latin önce) → okunabilir bindirme; canlı önizleme sonra
- [ ] **AI Notlar**: oda/görüşme tutanağından özet (konu, karar, yapılacak), iki dilde, PDF; transkript LLM'e veri olarak gider (AI-01)
- [ ] Alan seçimi: önce sözlük / MT bağlamı olarak test edilir; kalite farkı ölçülmeden pazarlanmaz
- [ ] Onboarding + kullanım amacı anketi, SSS, geri bildirim

**Bitti:** seçilen iş segmentinde tekrar kullanım + marj eşiği; mağazada yumuşak lansman (TR).

## Faz 4 — Koşullu eklentiler (go/no-go ile)

- [ ] **Ses klonu** kapalı beta: rıza akışı, canlı örnek, sentetik ses işareti, silme denetimi (sağlayıcı kalite + hukuk onayı sonrası)
- [ ] **Practice**: günün cümlesi, telaffuz, seri — günlük kullanım kanıtı varsa
- [ ] **Çevrimdışı**: TR↔EN metin/OCR paketi (ML Kit / Apple / ticari lisanslı model), uçak modunda tamamlanır
- [ ] Ek dil çiftleri: TR↔AR saha pilotu, TR↔DE (ihracat), TR↔RU (sağlık turizmi)
- [ ] Zoom RTMS / Meet / Teams entegrasyonu (her biri ayrı yaşam döngüsü)
- [ ] Sesli mesaj çeviri (Share Extension), Live Activity, kulaklık bölme, uygulama dili +7

## Kilometre taşları

| Hafta | Çıktı |
|---|---|
| 2 | Ölçüm raporu + sağlayıcı seçimi + iskelet |
| 6 | Translate + Converse iç dağıtım |
| 10 | Oda alfası (QR ile katılım, çok dilli altyazı) |
| 14 | Ücretli pilot + kamera + notlar, TR yumuşak lansman |
| 15+ | Klon / Practice / çevrimdışı — kanıta göre |

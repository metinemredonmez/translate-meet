# translate-meet — Roadmap

> Süreler tek tam zamanlı geliştirici + AI asistan varsayımıyla kabadır. Her fazın sonunda "Bitti tanımı" sağlanmadan sonrakine geçilmez.
> Güvenlik P0'ları (bkz. `01-ANALIZ.md` §6) Faz 0–1'de kurulur, sonradan eklenmez.

## Faz 0 — Teknik keşif ve karar (1 hafta)

- [ ] Gecikme + kalite ölçümü: TR↔EN, TR↔DE, TR↔AR, TR↔RU, EN↔ES
  - OpenAI `gpt-realtime-translate`, Gemini Live translate, Soniox iki yönlü + TTS, Azure Live Interpreter
  - Ölçülecek: ilk ses gecikmesi (TTFA), cümle sonu gecikmesi, dil algılama doğruluğu, gürültüde başarı, dakika maliyeti
- [ ] Ses klonu denemesi: ElevenLabs IVC (Türkçe kalite), alternatif 1–2 sağlayıcı
- [ ] Yığın onayı (öneri: Expo 54 + FastAPI, bkz. `04-TASARIM-KAYNAKLARI.md`) + native ses modülü prototipi (AEC, Bluetooth)
- [ ] Mimari karar kaydı (ADR): relay vs ephemeral token, sağlayıcı yönlendirme tablosu
- [ ] Marka adı, logo yönü, renk paleti (palet kütüphanesinden)

**Bitti:** Ölçüm tablosu + seçilen yığın + ADR'ler `docs/adr/` altında.

## Faz 1 — MVP: konuş ve çevir (5–6 hafta)

- [ ] Monorepo iskeleti: `apps/mobile`, `apps/gateway`, `apps/api`, `packages/shared`
- [ ] CI: lint, test, SAST, bağımlılık taraması, secret taraması (OPS-04)
- [ ] Kimlik: Apple / Google ile giriş + e-posta OTP; refresh rotasyonu (SES-*, TOK-*)
- [ ] Realtime gateway: WS kimlik doğrulama, kota kontrolü, sağlayıcı yönlendirme, fail-closed
- [ ] **Converse**: iki dil seçimi, otomatik algılama, bölünmüş ekran (karşı taraf için ters yarı), otomatik oynatma, hız 0.5–2.0x
- [ ] **Translate**: yaz/yapıştır, bas-konuş, kopyala, yer imi
- [ ] Geçmiş (yerel + bulut senkron, isteğe bağlı)
- [ ] Onboarding (3–4 slayt) + kullanım amacı anketi
- [ ] Ayarlar: uygulama dili (TR/EN), konuşma hızı, otomatik oynatma, hesap silme
- [ ] Abonelik: RevenueCat, paywall (1/6/12 ay), Restore, sunucu tarafı yetki, webhook imza doğrulama
- [ ] Ücretsiz katman: günlük dakika kotası (RES-01)
- [ ] Analitik (gizlilik dostu) + çökme raporu
- [ ] Gizlilik politikası, KVKK aydınlatma, kullanım şartları

**Bitti:** TestFlight / iç test kanalında 10 kişiyle gerçek konuşma testi; P0 yayın kapısı raporu.

## Faz 2 — Kamera, notlar, alanlar (3–4 hafta)

- [ ] **Camera**: cihaz üstü OCR, çeviri bindirme, galeriden seçme, flaş
- [ ] **AI Notlar**: oturum transkripti, LLM özeti (konu/karar/yapılacak), iki dilde, PDF/Markdown dışa aktarım
- [ ] **Alan seçimi**: 12 alan, her biri için prompt + sözlük; kullanıcı sözlüğü
- [ ] Kullanıcı rehberi / SSS, geri bildirim formu (log ekli)
- [ ] Uygulama dili: +7 dil

**Bitti:** App Store / Play'de yumuşak lansman (TR + 1 pazar).

## Faz 3 — Ses klonu ve pratik (3–4 hafta)

- [ ] **Ses klonu**: rıza ekranı, rıza cümlesi + konuşmacı doğrulama, kayıt, klon oluşturma, silme
- [ ] Klon sesle çeviri çıktısı (Yol B), sentetik ses işareti
- [ ] **Practice**: günün cümlesi, telaffuz puanı, klon sesle örnek, seri, yer imlerinden pratik
- [ ] Bildirimler (pratik hatırlatıcı)

**Bitti:** Klon özelliği hukuk kontrolünden geçti; premium dönüşüm ölçülüyor.

## Faz 4 — translate-meet: toplantı odaları ve ekipler (4–6 hafta)

- [ ] Oda oluştur / QR ile katıl; her katılımcı kendi dilini seçer
- [ ] LiveKit SFU + dil başına çeviri işçisi; canlı altyazı + isteğe bağlı ses
- [ ] Çok dilli toplantı tutanağı (AI Notlar ile birleşik)
- [ ] Dinleme modu (tek yönlü: ders, tur, konferans)
- [ ] Ekip planı: koltuk yönetimi, ortak sözlük, arşiv — web panel
- [ ] Tenant izolasyonu (AZ-01…05) + ekip yöneticisi MFA (AUT-01)

**Bitti:** 5 kişilik, 3 dilli gerçek toplantı testi; ekip planı satın alınabilir.

## Faz 5 — Büyüme ve fark yaratanlar (sürekli)

- [ ] Sesli mesaj çeviri (Share Extension) + klon sesle cevap
- [ ] Çevrimdışı paket (en sık 5 dil çifti)
- [ ] Apple Watch, Live Activity / kilit ekranı altyazı
- [ ] Kulaklık bölme modu
- [ ] Zoom/Meet/Teams entegrasyonu (bot veya masaüstü yakalama)
- [ ] B2B dikeyler: sağlık turizmi kliniği, şantiye paketi
- [ ] Referans / davet programı

## Kilometre taşları

| Hafta | Çıktı |
|---|---|
| 1 | Faz 0 ölçüm raporu + yığın kararı |
| 7 | MVP iç test |
| 11 | Yumuşak lansman (Converse + Translate + Camera + Notlar) |
| 15 | Ses klonu + Practice |
| 21 | Toplantı odaları + ekip planı |

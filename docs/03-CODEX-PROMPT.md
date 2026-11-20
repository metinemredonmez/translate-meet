# Codex araştırma promptu

Kullanım: repo kökünde Codex'i aç, aşağıdaki bloğu olduğu gibi yapıştır.
Ekran görüntülerini görmesi için görsellerle başlat, ör.:

```bash
codex -i IMG_4272.PNG -i IMG_4276.PNG -i IMG_4277.PNG -i IMG_4279.PNG -i IMG_4280.PNG -i IMG_4282.PNG -i IMG_4284.PNG -i IMG_4287.PNG -i IMG_4289.PNG
```

Amaç: Claude'un analizinden **bağımsız** ikinci bir görüş almak; sonra iki raporu karşılaştırıp roadmap'i netleştirmek. Bu yüzden Codex'ten önce kendi analizini yazmasını, Claude'un dokümanlarını **en son** okumasını istiyoruz.

---

```text
Rolün: kıdemli mobil + gerçek zamanlı ses sistemleri mimarı ve ürün araştırmacısı. Türkçe yaz.

## Bağlam
Yeni bir mobil çeviri uygulaması planlıyoruz; repo adı "translate-meet". Referans olarak piyasadaki
"Owll Translator" (VocalBeats.AI, iOS) uygulamasının 24 ekran görüntüsü bu klasörde (IMG_42xx.PNG;
git'e eklenmiyor). Özgün bir ürün yapacağız: rakibin adı, logosu, illüstrasyonları, metinleri kopyalanmayacak.

Referans uygulamanın özellikleri (ekranlardan):
- Onboarding: 4 slayt (100+ dil, ses klonu, AI not/özet, doğruluk & gecikme) + kullanım amacı anketi
  (iş, partner, yurt dışında yaşam, seyahat, sağlık, inşaat, diğer)
- Paywall: 1 / 6 / 12 ay (TR fiyat: ₺799,99 / ₺500 / ₺250 aylık), Restore, "Cancel anytime"
- Converse: iki dil, "her iki dili algıla", bölünmüş ekran (karşı tarafa dönük yarı), tek mikrofon
- Translate: yaz/yapıştır + bas-konuş
- Camera: metne doğrult, galeriden seç, flaş → foto çeviri
- Practice: alanına göre günün cümlesi, telaffuz pratiği, ses klonuyla dinle, yer imleri, seri
- Voice Clone: birkaç cümle okuyarak kendi sesini klonla, çeviriler kendi sesinle okunsun
- AI Notes: konuşma kaydı + akıllı özet
- Alan seçimi: Genel, Sağlık, Seyahat, Eğitim, Kültür, Din, Hukuk, Teknoloji, Finans, İş, Çift, Göç
- Ayarlar: "bugün kalan dakika" kotası, grup indirimi (5+ kişi, e-posta ile), konuşma hızı 0.5–2.0x,
  otomatik oynatma, uygulama dili (9 dil), kullanıcı rehberi/SSS, hakkında, paylaş, geri bildirim

Bizim farkımız olması planlanan: çok kişili TOPLANTI ODASI modu (herkes kendi dilinde konuşur/dinler,
QR ile katılım, çok dilli tutanak), dinleme modu, çevrimdışı paket, self-serve ekip planı, Türkçe-öncelikli UX.

Kullanıcının mevcut yığını (tasarım kiti): Expo ~54 + React Native 0.81 + expo-router + NativeWind,
FastAPI + SQLAlchemy 2 + Celery + Redis + PostgreSQL, Next.js 16 panel, pnpm monorepo, pm2 + nginx, RevenueCat.
Güvenlik: OWASP ASVS 5.0 tabanlı iç katalog; P0 kontroller (kimlik, oturum, yetki/BOLA, WebSocket kimliği,
dosya yükleme, sır yönetimi, webhook imza, kota, LLM prompt injection) ilk kurulumda uygulanacak.

## Görev
Web'de güncel (2026) kaynaklarla araştır ve aşağıdaki başlıklarda kendi analizini yaz.
Her sayısal iddia (gecikme, fiyat, dil sayısı) için kaynak URL ver; sağlayıcı iddiası ile bağımsız ölçümü ayır.
Bilmediğin yerde "doğrulanamadı" de, uydurma.

1. Rakip ve pazar
   - Owll Translator + en az 5 rakip (ör. Google Translate conversation, Apple Translate, Microsoft Translator,
     iTranslate, SayHi, Timekettle uygulaması, Palabra, Wordly, Interprefy vb.): özellik matrisi, fiyat, puan,
     zayıf yönler (App Store / Play yorumlarından tekrar eden şikayetler).
   - Türkiye pazarı: hangi dil çiftleri ve hangi segmentler (göçmen, sağlık turizmi, inşaat, ihracat) öncelikli?
2. Gerçek zamanlı çeviri mimarisi
   - Uçtan uca speech-to-speech (OpenAI gpt-realtime-translate, Gemini Live translate, Azure Live Interpreter,
     varsa diğerleri) vs. kademeli STT→MT→TTS (Soniox, Deepgram, Speechmatics, AssemblyAI + DeepL/LLM + ElevenLabs/
     Cartesia/diğer TTS). Tablo: gecikme, dil kapsamı (özellikle Türkçe çıkış), iki yönlü otomatik dil algılama,
     ses klonu desteği, dakika maliyeti, veri saklama/KVKK-GDPR şartları, bölge (EU) seçeneği.
   - Mobilden bağlantı: kendi WebSocket relay'imiz mi, sağlayıcıya ephemeral token ile doğrudan WebRTC mi?
     Gecikme, kota kontrolü, güvenlik açısından karşılaştır ve öner.
   - Expo/React Native'de düşük gecikmeli mikrofon akışı, eko iptali (AEC), Bluetooth kulaklık yönlendirme,
     arka planda ses için hangi kütüphaneler/native modüller? Bilinen tuzaklar.
3. Ses klonu
   - Sağlayıcılar (ElevenLabs IVC, Cartesia, Azure Personal Voice, açık kaynak seçenekler): Türkçe kalite, rıza
     doğrulama gereksinimleri, fiyat.
   - Hukuk: KVKK (ses = biyometrik/özel nitelikli veri), GDPR, AB AI Act şeffaflık yükümlülükleri (sentetik ses
     işaretleme, yürürlük tarihleri), App Store / Play politikaları. Somut uyum kontrol listesi çıkar.
4. Toplantı odası modu (translate-meet)
   - LiveKit / Daily / Agora vb. SFU + dil başına çeviri işçisi mimarisi; N katılımcı × M dil için maliyet ve
     gecikme modeli; konuşmacı ayrımı (diarization); aynı odada birden fazla telefonun yankı/feedback sorunu.
   - Zoom / Google Meet / Teams entegrasyon yolları (bot, SDK, masaüstü yakalama) ve kısıtları.
5. Kamera çeviri: cihaz üstü OCR (iOS Vision, ML Kit) + çeviri bindirme; Expo'da uygulanabilirlik.
6. Çevrimdışı mod: cihaz üstü STT/MT/TTS seçenekleri (Whisper varyantları, NLLB/Marian, Apple/Google on-device
   çeviri API'leri), model boyutu, Türkçe kalitesi.
7. Birim ekonomisi
   - Ücretsiz / Pro / Ekip katmanları için önerilen kota ve fiyat (TR ve global); mağaza payı sonrası marj;
     ağır kullanıcı senaryosu. Tablo halinde.
8. Riskler ve açık sorular: teknik, hukuki, ürün. Her biri için önlem.
9. Önerilen yol haritası: fazlar, her fazın "bitti tanımı", tahmini süre, ilk 2 hafta için gün gün plan.

## Son adım: karşılaştırma
Kendi analizini bitirdikten SONRA `docs/01-ANALIZ.md`, `docs/02-ROADMAP.md`, `docs/04-TASARIM-KAYNAKLARI.md`
dosyalarını oku. Ayrı bir bölümde: nerede katılıyorsun, nerede katılmıyorsun (gerekçe + kaynak),
gözden kaçan ne var.

## Çıktı
- Tek dosya: `docs/codex/CODEX-ANALIZ.md` (başlıklar yukarıdaki numaralarla, sonda "Kaynaklar" listesi).
- Mevcut dosyaları DEĞİŞTİRME. Kod yazma. git commit / push YAPMA.
- Sır, API anahtarı isteme veya yazma.
- Ekran görüntülerindeki kişisel verileri (kişi adları, rehber) rapora yazma.
```

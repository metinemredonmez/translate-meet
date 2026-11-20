# translate-meet — Detaylı Analiz

> Tarih: 2026-11-20 · Kaynak: klasördeki 24 ekran görüntüsü (Owll Translator v3.12.1, VocalBeats.AI) + 2026 sağlayıcı araştırması.
> Amaç: Benzer işlevi sunan **özgün** bir uygulama kurmak ve rakibin ötesine geçmek. Rakibin adı, logosu, illüstrasyonları ve metinleri kopyalanmaz.

---

## 1. Referans uygulama: ekran ekran envanter

| # | Ekran | Görüntü | Ne yapıyor | Bizde karşılığı |
|---|---|---|---|---|
| 1 | Onboarding slaytları (4 adet) | 4272–4275 | "100+ dil", "Ses klonu", "AI not + özet", "Doğruluk & gecikme" vaadi; ilerleme çubuğu, Skip | Aynı akış, özgün illüstrasyon |
| 2 | Kullanım amacı anketi | 4276 | İş, partner, yurt dışında yaşam, seyahat, sağlık, inşaat, diğer → kişiselleştirme | Anket → varsayılan "alan" (field) + paywall mesajı |
| 3 | Paywall | 4277 | 12 ay ₺250/ay, 6 ay ₺500/ay, 1 ay ₺799,99/ay; "4.8 App Store", Cancel anytime, Restore | StoreKit 2 / Play Billing + RevenueCat |
| 4 | Ses klonu girişi | 4278, 4290 | "Birkaç cümle oku" → klon | Açık rıza + doğrulama cümlesi + klon |
| 5 | **Converse** (ana ekran) | 4279 | Üst: dil A ⇄ dil B, "Detect both languages"; ekran ikiye bölünmüş (karşıdaki kişi için ters/koyu yarı), tek mikrofon | İki yönlü otomatik dil algılamalı canlı çeviri |
| 6 | **Translate** | 4280 | Yaz/yapıştır, Push-to-talk | Metin + bas-konuş |
| 7 | **Camera** | 4281, 4282 | İzin isteği, "Point camera at text", galeriden seç, flaş | Cihaz üstü OCR + çeviri bindirme |
| 8 | **Practice** | 4284, 4286 | Günün cümlesi (alanına göre), "Practice", ses klonuyla dinle, yer imleri, seri (🔥) | Telaffuz puanlama + seri + yer imi |
| 9 | AI Notes | 4285 | Konuşma kayıtları ve özetler listesi (boş durum) | Transkript + LLM özet + dışa aktarım |
| 10 | Ayarlar (çekmece) | 4287, 4291, 4292 | Go pro + "bugün kalan dakika", grup indirimi, sektör, ses klonu, otomatik oynatma, konuşma hızı 0.5–2.0x, uygulama dili (9 dil), rehber, hakkında, paylaş, geri bildirim | Aynı + günlük dakika kotası |
| 11 | Grup teklifi | 4288 | 5+ kullanıcı için indirim, e-posta ile iletişim | Ekip planı (self-serve, panelden) |
| 12 | Alan seçimi | 4289 | Genel, Sağlık, Seyahat, Eğitim, Kültür, Din, Hukuk, Teknoloji, Finans, İş, Çift, Göç… | Alan → sözlük (glossary) + MT sistem promptu |
| 13 | Kullanıcı rehberi | 4293 | SSS: canlı çeviri, kulaklık, ses klonu, foto çeviri | Uygulama içi SSS + destek |
| 14 | Hakkında | 4294 | Sürüm, gizlilik, şartlar, "Apple ile bilgi paylaş" | Aynı |
| 15 | Paylaş | 4295 | iOS paylaşım sayfası | Aynı (davet bağlantısı + referans kodu) |
| 16 | Geri bildirim | 4296 | E-posta + açıklama formu | Aynı + ekran görüntüsü/log ekleme |

**Rakip hakkında bilinenler:** Singapur merkezli VocalBeats.AI; eski adı "Deeptran"; kardeş uygulama "Owll: AI Note Taker". Ağustos 2025'te ses klonunu, Eylül 2026'da "sesli mesajı çevir ve kendi sesinle cevap ver" özelliğini duyurdu. ABD'de yıllık ~$60–70; puan ~4.7. Yani pazar kanıtlanmış, fiyat noktası belli.

**Gözlenen zayıflıklar / fırsatlar**
- Ücretsiz katman neredeyse yok ("Today remaining 0/0 min") → dönüşüm sert, ilk deneyim zayıf.
- Grup satışı e-postayla, 3 iş günü → self-serve ekip planı açık kapı.
- Toplantı / çok kişili oda modu yok → **translate-meet** adının vaadi tam burada.
- Türkçe yerelleştirme makine çevirisi kokuyor ("…öğesine dokunun") → Türkçe-öncelikli, doğal UX farkı yaratır.
- Çevrimdışı mod görünmüyor.

---

## 2. Ürün tanımı (önerilen)

**Tek cümle:** Telefonda iki kişilik canlı tercümandan başlayıp, birden fazla kişinin kendi dilinde konuştuğu **toplantı odalarına** kadar uzanan, kendi sesinle konuşabildiğin çeviri uygulaması.

**Hedef segmentler (anketten ve pazardan):**
1. Yurt dışında yaşayan / göçmen (resmi daire, hastane, kira) — Türkçe↔Almanca/Hollandaca/Arapça yüksek hacim
2. İş: tedarikçi görüşmesi, fuar, şantiye (inşaat ekipleri — rakip de anket sorusu koymuş)
3. Sağlık turizmi: Türkiye'ye gelen hasta ↔ klinik (B2B fırsatı)
4. Seyahat
5. Çiftler / aile

---

## 3. Teknik analiz: canlı çeviri nasıl yapılır?

### 3.1 İki mimari yol

| | **A. Uçtan uca speech-to-speech** | **B. Kademeli (cascade): STT → MT → TTS** |
|---|---|---|
| Örnek | OpenAI `gpt-realtime-translate`, Gemini Live (live-translate preview), Azure Live Interpreter (preview) | Soniox (STT + çeviri aynı akışta) → ElevenLabs Flash / sistem TTS |
| Gecikme | ~0,2–0,9 sn (sağlayıcı iddiası) | ~1,2–2,5 sn uçtan uca |
| Dil | OpenAI: ~70 giriş, **13 çıkış — Türkçe çıkış YOK** (yalnız TR→EN gibi yönlerde kullanılabilir); Gemini 3.5 Live Translate: 70+, **Türkçe çıkış var** (preview); Azure: Türkçe kaynak+hedef | Soniox 60+ dil, 3.600 çift, **iki yönlü mod**; MT katmanı eklenerek 100+ |
| Ses klonu | OpenAI'de yok; Gemini'de tutarsız; Azure "Personal Voice" onay gerektirir | ElevenLabs Instant Voice Clone ile tam kontrol |
| Maliyet | OpenAI: $0,034/dk (~$2/saat) | Soniox çeviri ~$0,18/saat + TTS (ElevenLabs Flash ~$0,04–0,05 / 1k karakter ≈ $2–3/saat konuşma yoğunluğuna göre; sistem TTS ücretsiz) |
| Kontrol | Düşük (kara kutu) | Yüksek: sözlük, alan promptu, transkript, özet hepsi elde |

> Fiyat ve gecikme rakamları çoğunlukla sağlayıcı iddiası veya üçüncü taraf karşılaştırmasıdır. **Faz 0'da kendi ölçümümüzü yapacağız** (bkz. roadmap).

### 3.2 Öneri: sağlayıcıdan bağımsız hibrit yönlendirici

```
Mobil uygulama ──WebSocket/WebRTC──► Realtime Gateway (bizim)
                                       │  • kimlik + kota kontrolü (oturum başında ve her 10 sn)
                                       │  • dil çifti → sağlayıcı seçimi (routing tablosu)
                                       ├─► Yol A: Gemini 3.5 Live Translate (Türkçe çıkış dahil) · OpenAI realtime-translate yalnız hedefi 13 dilden biri olan yönlerde
                                       ├─► Yol B: Soniox iki yönlü STT+MT ─► TTS (ElevenLabs klon / standart ses)
                                       └─► Transkript olayları ─► kuyruk ─► Notlar/özet servisi
```

- **Converse "her iki dili algıla"** → Soniox iki yönlü mod birebir bu iş; yön (A→B mi B→A mı) algılanan dile göre belirlenir.
- **Ses klonu açıksa** daima Yol B (çeviri metni → kullanıcının klon sesi).
- **Yönlendirme tablosu yön bazlıdır**, çift bazlı değil: `TR→EN` ve `EN→TR` ayrı satır. Uçtan uca modellerde oturum başına tek hedef dil var → iki yönlü görüşme = iki oturum (maliyet ×2).
- **Toplantı odasında** relay yerine LiveKit SFU + çeviri işçisi; aynı hedef dil için üretilen ses/altyazı tüm dinleyicilere paylaşılır.
- **Sağlayıcı anahtarları asla uygulamada durmaz** (KEY-02). İki seçenek:
  - *Relay (önerilen, MVP):* ses gateway'den geçer → kota/ölçüm/yönlendirme tam bizde, +50–100 ms.
  - *Ephemeral token (sonra, optimizasyon):* gateway kısa ömürlü, tek oturumluk token basar, istemci doğrudan sağlayıcıya WebRTC ile bağlanır; ölçüm sağlayıcı kullanım verisinden yapılır.
- Gateway'de fail-closed: sağlayıcı düşerse yedek sağlayıcıya geç, kota servisi cevap vermezse oturum **açılmaz** (EXC-01, ARC-05).

### 3.3 Diğer özellikler

| Özellik | Yaklaşım |
|---|---|
| Metin çeviri | LLM tabanlı MT (alan promptu + sözlük) veya DeepL/Google; kısa metinde önbellek |
| Push-to-talk | Aynı gateway, tek yönlü; bırakınca kesinleştir |
| Kamera | **Cihaz üstü OCR** (iOS Vision / Android ML Kit) → sadece metin sunucuya gider → çeviri → orijinal kutuların üstüne bindirme. "Sahneyi açıkla" için görsel LLM (isteğe bağlı, görsel yükleme FIL-01 kurallarıyla) |
| Alan (field) | Her alan = sistem promptu + terim sözlüğü + Practice cümle seti. Kullanıcı kendi sözlüğünü ekleyebilir (ürün farkı) |
| AI Notlar | Transkript parçaları kalıcı → oturum bitince LLM özet (konu, kararlar, yapılacaklar), iki dilde; PDF/Markdown dışa aktarım. Model: Claude Haiku 5.5 (ucuz, hızlı) / Sonnet 5.5 (uzun toplantı) |
| Practice | Günün cümlesi (alan+dil), kullanıcı okur → telaffuz puanı (Azure Pronunciation Assessment vb.), klon sesle örnek dinleme, seri, yer imleri |
| Ses klonu | 30–60 sn okuma; **ilk cümle rıza beyanı** ("Ben X, sesimin klonlanmasına izin veriyorum") → konuşmacı doğrulaması; ElevenLabs IVC; kullanıcı tek tıkla silebilir |
| Abonelik | StoreKit 2 + Google Play Billing, RevenueCat; **yetki (entitlement) sunucuda**, mağaza webhook'u imza doğrulamalı (EXT-04) |
| Kota | "Bugün kalan dakika" — sunucu tarafı, kullanıcı+cihaz+IP boyutlu (RES-01) |
| Uygulama dili | i18n: TR, EN başta; sonra ES, DE, AR, FR, ZH, JA, KO, PT |

### 3.4 Teknoloji yığını (tasarım kitiyle uyumlu — ayrıntı `04-TASARIM-KAYNAKLARI.md`)

- **Mobil:** Expo ~54 (dev client) + React Native 0.81 + expo-router + NativeWind (mevcut kit ve Palemi şablonu). Ses akışı için native modül şart (düşük gecikmeli mikrofon, AEC/eko iptali, Bluetooth kulaklık yönlendirme).
- **Gateway:** Ayrı asyncio servis (FastAPI WebSocket); yatay ölçek; Redis (oturum + kota rezervasyonu).
- **API:** FastAPI + SQLAlchemy 2 + Alembic, Python 3.13 + uv; Celery + Redis; PostgreSQL; S3 uyumlu depolama (ses klonu örnekleri ayrı, özel, şifreli kova).
- **Panel/web:** Next.js 16 + Tailwind 4; pnpm monorepo; pm2 + nginx.
- **Toplantı modu:** LiveKit (WebRTC SFU) + her hedef dil için bir çeviri "agent" işçisi.
- **Gözlem:** OpenTelemetry, yapılandırılmış güvenlik logu (LOG-01), içerik/ses loga yazılmaz (LOG-02).

### 3.5 Birim ekonomisi (kaba)

- Ücretli kullanıcı ~₺250/ay (yıllık plan) ≈ $6–7; mağaza payı (%15–30) sonrası ~$5.
- Ayda 60 dk iki yönlü görüşme: Yol A (Gemini, iki hat, ~$0,074/görüşme dk) ≈ $4,4; Yol B (Soniox STT+TTS, ~$0,014/dk/yön) ≈ $1,7; klon TTS'li (ElevenLabs/Cartesia ~$0,03/üretilen dk) ≈ $2–4. Rakamlar Codex raporu §2.2 ve §7'den; pilot faturasıyla doğrulanacak.
- Sonuç: **Kota şart**, ucuz yol varsayılan, klon ve uzun toplantı premium. Ağır kullanıcı için "fair use" üst sınırı.

---

## 4. "Bunun dışında" — rakipten ayrışacak özellikler

1. **Toplantı odası (translate-meet):** QR/kod ile odaya katıl; herkes kendi dilinde konuşur, herkes kendi dilinde altyazı + isteğe bağlı ses duyar. Telefonları masaya koy, bitti. Sonunda çok dilli tutanak.
2. **Dinleme modu:** Ders, tur, vaaz, konferans — tek yönlü sürekli çeviri, kulaklıktan.
3. **Kulaklık bölme:** Bir kulaklık karşı tarafta; uygulama yönleri ayırır.
4. **Sesli mesaj çeviri:** WhatsApp/Telegram'dan paylaşılan ses notunu çevir, kendi klon sesinle cevap üret (rakip yeni ekledi; biz Share Extension ile baştan).
5. **Kişisel sözlük + alan paketleri:** Şirket/ürün adları yanlış çevrilmesin.
6. **Çevrimdışı paket:** İlk paket TR↔EN metin/OCR, sonra bas-konuş; ML Kit / Apple on-device çeviri veya ticari lisanslı Marian (NLLB **CC-BY-NC, ticari kullanılamaz**); havaalanı/yurt dışı roaming senaryosu.
7. **Cömert ücretsiz katman:** Günlük birkaç dakika canlı + sınırsız metin → mağaza puanı ve organik büyüme.
8. **Self-serve ekip planı + web panel:** Koltuk yönetimi, ortak sözlük, toplantı arşivi; sağlık/inşaat B2B.
9. **Türkiye-öncelikli:** Doğal Türkçe UX, ₺ fiyat, KVKK uyumu ve Türkçe↔Arapça/Almanca/Rusça/Farsça odak.
10. **Apple Watch / kilit ekranı Live Activity:** Telefonu çıkarmadan çeviri altyazısı.

---

## 5. Hukuki ve uyum riskleri

| Risk | Not | Önlem |
|---|---|---|
| Ses verisi | Ham ses kişisel veri; kişiyi benzersiz tanımlamaya/doğrulamaya yönelik teknik işlemde (klon profili, konuşmacı doğrulama) biyometrik → özel nitelikli. Sınıflama amaca göre yapılır | Açık rıza ekranı, ayrı aydınlatma metni, amaç sınırlaması, silme hakkı, yurt dışı aktarım bilgisi |
| Sentetik ses / deepfake | AB AI Act şeffaflık yükümlülükleri; ABD'de NO FAKES tartışması | Klon sesle üretilen çıktıya işaret/filigran, başkasının sesini klonlamayı engelleyen rıza cümlesi doğrulaması |
| Karşı tarafın sesi | Converse'de karşıdaki kişi rıza vermedi | Kayıt varsayılan kapalı; notlar açıkken ekranda görünür "kaydediliyor" göstergesi |
| Mağaza kuralları | Abonelik metinleri, otomatik yenileme, Restore, hesap silme zorunluluğu | Paywall şablonunu Apple 3.1.2 kurallarına göre yaz |
| Marka | Rakip adı/illüstrasyonu kullanılmaz | Özgün marka, özgün illüstrasyon |
| Tıbbi/hukuki çeviri sorumluluğu | Hatalı çeviri zarar doğurabilir | "Profesyonel tercüman yerine geçmez" uyarısı sağlık/hukuk alanında |

---

## 6. Güvenlik temeli (red-team kataloğu, P0'lar baştan)

İlk kurulumda uygulanacak P0 kontroller (iç red-team kataloğu):

| Alan | Kontroller | Bu projede somut karşılığı |
|---|---|---|
| Mimari | ARC-01, ARC-02, ARC-04, ARC-05, EXC-01 | Servis envanteri; kimlik bağlamı yalnız doğrulanmış token'dan; gateway fail-closed |
| Kimlik / oturum | AUT-02, AUT-03, SES-01, SES-02, SES-04, SES-05, PWD-01/03/04, PKY | Apple/Google ile giriş + e-posta OTP; refresh token ailesi + rotasyon; çıkışta iptal |
| Token | TOK-01, TOK-02, TOK-03, TOK-05 | JWT alg sabit, aud/iss kontrolü; Apple/Google OIDC nonce/state bağlama |
| Yetki | AZ-01…AZ-05 | Not/transkript/klon nesnelerinde sahiplik kontrolü (BOLA); ekip planında tenant izolasyonu |
| API / WebSocket | API-01, API-02, API-04 | Gateway WS'de kimlik, origin, mesaj başına yetki; şema doğrulama (INP-01) |
| Dosya | FIL-01, FIL-02, FIL-04 | Kamera görseli ve klon ses örneği karantinaya, tür/boyut doğrulama, kısa ömürlü imzalı URL |
| Sırlar | KEY-01, KEY-02, KEY-03 | Sağlayıcı anahtarları sadece sunucuda, secret manager, rotasyon planı |
| İş mantığı | BUS-01, BUS-02, BUS-05 | Abonelik/kota durumları atomik; mağaza webhook'u idempotent |
| Dış entegrasyon | EXT-04 | App Store / Play / RevenueCat webhook imza + replay koruması |
| Kaynak | RES-01 | Dakika kotası, eşzamanlı oturum sınırı, maliyet alarmı |
| Veri / log | DAT-02, DAT-04, LOG-01, LOG-02 | Ses/transkript loga yazılmaz; saklama süresi; dışa aktarım güvenliği |
| AI | AI-01, AI-02 | Transkriptteki metin LLM'e talimat olarak geçmez (dolaylı prompt injection), özet çıktısı escape edilir |
| Ağ / Ops | NET-01…04, OPS-01…04 | TLS, origin gizli, CI'da SAST + bağımlılık taraması, imzalı build |

Yayın kapısı: P0'ların hepsi "Geçti" (kanıtlı) veya "Risk kabul edildi" olmadan mağazaya çıkılmaz.

---

## 7. Açık sorular (karar gerekiyor)

1. Yığın: tasarım kitine uyum için Expo + FastAPI öneriliyor — onay?
2. İlk hedef pazar: Türkiye mi, global mi? (fiyat ve dil sırası değişir)
3. İlk 5 dil çifti hangileri?
4. ~~Toplantı modu MVP'de mi, Faz 4'te mi?~~ → Codex karşılaştırması sonrası Faz 2'ye çekildi (bkz. roadmap).
5. Bütçe: aylık sağlayıcı gideri tavanı?

---

## Kaynaklar

- [OpenAI — gpt-realtime-translate model sayfası](https://developers.openai.com/api/docs/models/gpt-realtime-translate)
- [Google — Gemini Live API ile canlı çeviri](https://ai.google.dev/gemini-api/docs/live-api/live-translate)
- [Microsoft — Live Interpreter API duyurusu](https://techcommunity.microsoft.com/blog/azure-ai-foundry-blog/announcing-live-interpreter-api---now-in-public-preview/4453649)
- [Soniox — Speech translation](https://soniox.com/speech-translation) · [Soniox fiyat](https://soniox.com/pricing)
- [ElevenLabs — Text to Speech dokümanı](https://elevenlabs.io/docs/overview/capabilities/text-to-speech)
- [Fora Soft — 2026 gerçek zamanlı çeviri sağlayıcı karşılaştırması](https://www.forasoft.com/blog/article/real-time-speech-translation-vendor-benchmarks)
- [AssemblyAI — Best real-time speech translation APIs 2026](https://www.assemblyai.com/blog/best-real-time-speech-translation-apis)
- [App Store — Owll Translator](https://apps.apple.com/us/app/6742527823)
- [GlobeNewswire — Owll ses klonu duyurusu (2025)](https://www.globenewswire.com/news-release/2025/08/08/3129927/0/en/Owll-Translator-App-Introduces-AI-Voice-Cloning-to-Personalize-Voice-Translations-in-Over-100-Languages.html)
- [24-7 Press Release — sesli mesaj özelliği (2026)](https://www.24-7pressrelease.com/press-release/538961/owll-translator-turns-business-voice-notes-into-two-way-conversations)

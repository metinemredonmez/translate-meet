# Tasarım kaynaklarından alınacaklar

> Kaynak klasör (yerel, repoda değil): `~/Desktop/uygulama-tasarim-kaynaklari`
> Kural (Genel_Promptlar): birebir kopyalama yok, **uyarlayarak taşı**; kaynak depolar değiştirilmez; sır yazılmaz, yalnız ortam değişkeni adları.

## 1. Yığın kararı (kite uyum)

Kit ve en yakın şablon (**Palemi kurulum promptu** — mobil koç uygulaması) aynı yığını kullanıyor; translate-meet de bunu izler:

| Katman | Seçim | Not |
|---|---|---|
| Mobil | Expo ~54 (dev client), React Native 0.81, React 19.1, expo-router 6, NativeWind 4, Reanimated 4, zustand, TanStack Query 5 | 16–18, 26, 27 numaralı parçalar Expo Go'da çalışmaz → development build |
| Ses | expo-audio + **native ses modülü** (düşük gecikmeli PCM akışı, AEC) | Kitte canlı çok taraflı akış parçası yok; bu proje için yazılacak |
| Kamera | expo-camera 17 + cihaz üstü OCR | |
| Giriş | expo-apple-authentication, @react-native-google-signin | Kimlik jetonu **sunucuda** doğrulanır (TOK-03) |
| Ödeme | RevenueCat veya expo-iap + sunucuda StoreKit 2 / Play doğrulama | Resmi App Store Server Library kullan |
| Push | @react-native-firebase/messaging | |
| API | FastAPI + SQLAlchemy 2 + Alembic + Pydantic, Python 3.13 + uv | İstemci tipleri OpenAPI'den üretilir |
| Realtime gateway | Ayrı asyncio servis (FastAPI WebSocket / uvicorn) | Sağlayıcı yönlendirme + kota rezervasyonu |
| İş kuyruğu | Celery + Redis | Özet, klon oluşturma, dışa aktarım |
| Veri | PostgreSQL, S3 uyumlu depolama (R2) | Ses klonu örnekleri ayrı, özel, şifreli kova |
| Panel / web | Next.js 16 + React 19 + Tailwind 4 | Ekip planı, yönetim |
| Monorepo | pnpm workspaces | `apps/mobile`, `apps/api`, `apps/gateway`, `apps/panel`, `apps/web`, `packages/*` |
| Dağıtım | pm2 + nginx, sağlık ucu, CI kapısı | Staging ortamı baştan |

## 2. Mobil kitten taşınacak parçalar

Kit kökü: `…/3-yedi-oda-ozellik-kiti/YediOda_Frontend_Kit/mobil/`

| Parça | Bizde nerede |
|---|---|
| 01 tema ve tipografi | Palet değişimi (aşağıda) |
| 02 temel bileşenler, 03 form ve ayar satırları, 04 güvenli ekran, 06 temalı uyarı | Tüm ekranlar; ayarlar (hız, otomatik oynatma, dil) |
| 11 API istemcisi ve jeton yenileme | Oturum (tek uçuşlu 401 yenileme, secure-store) |
| 12 akışlı yanıt (SSE) | AI Notlar / özet akışı |
| 13 iki dil TR/EN | Uygulama dili → 9 dile genişlet |
| 14 Sentry (PII temizli) | Çökme raporu (LOG-02) |
| 15 zorunlu güncelleme | Sürüm kapısı |
| 16–18 push, bildirim merkezi, yönlendirme | Practice hatırlatıcısı, toplantı daveti |
| 19 destek talepleri | Geri bildirim formu |
| 20 veri hakları / hesap silme | KVKK + mağaza zorunluluğu (klon sesi de silinir) |
| 21 ses oynatıcı | Çeviri seslendirme, otomatik oynatma |
| 22 bas-konuş | Translate push-to-talk, Converse mikrofon dalgası |
| 23 vurgulu sesli okuma | Practice |
| 24 ses / karakter seçimi | Ses klonu + standart ses seçimi |
| 26 paywall ve mağaza satın alma | 1 / 6 / 12 ay paywall |
| 27 Apple / Google giriş | Giriş |
| 28 canlı kamera taraması | Camera OCR |
| 29 cihazda PDF | Not / tutanak dışa aktarım |

Panel (`…/panel/`): 07 giriş, 08 kullanıcı yönetimi, 09 tablo+CSV, 10 grafik, 11 denetim kaydı, 12 ayar yönetimi, 13 toplu bildirim, 14 uyarı merkezi, 15 yardım masası.
Web (`…/web/`): 01 telefon çerçeveli vitrin, 04 mağaza rozetleri, 06 SEO, 07 JSON-LD (SSS), 09 KVKK çerez bandı, 10 hukuki metin, 11 şifre sıfırlama.

**Onboarding:** kitte hazır parça yok → Palemi §5.2 deseni: sunucu yönetimli adımlar, kaldığı yerden devam, paywall en sonda bir kez.

## 3. Backend desenleri (Yedi Oda özellik kataloğu)

Kaynak: `…/1-kurulum-promptlari-ve-ozellik-katalogu/YediOda_Ozellik_Katalogu.md`

| # | Desen | translate-meet karşılığı |
|---|---|---|
| 82 | TTS zinciri (ElevenLabs → OpenAI → yedek) + içerik-adresli önbellek | Çeviri seslendirme; Practice cümleleri önbellekten |
| 84 | Ses klonlama: biyometrik rıza alanları + denetim kaydı | **Doğrudan örnek** — Voice Clone |
| 85 | STT (dil ipucu) | Push-to-talk |
| 86 | Sesli oturum + **dakika kotası rezervasyonu** | Converse / toplantı kotası |
| 27 | Sağlayıcı yedek zinciri | Gateway yönlendirme |
| 29 | AI maliyet defteri + bütçe freni | Sağlayıcı gideri tavanı |
| 56 | İstek kimliği ile çift ücreti önleme | Oturum başlatma idempotency |
| 58–61, 64 | IAP doğrulama, paket kataloğu, abonelik, ücretsiz katman (402), promosyon kodu | Abonelik |
| 63, 65, 80 | Seri (3/7/30), davet et-kazan, uygulama turu | Practice serisi, referans |
| 95 | "Her şey panelden" ayar kataloğu | Model adları, kotalar, alan promptları panelden |
| 103, 14 | Çok dillilik, rıza defteri | i18n, KVKK rızaları |

## 4. Mimari kurallar (kurulum promptlarından)

- Karar sunucuda, istemci yalnız gösterir; erişim yoksa **404** (403 değil).
- Kota/kredi defteri: **rezerve et → geçerli çıktıdan sonra tüket → hata olursa serbest bırak.**
- Uzun işlerde `Idempotency-Key`.
- AI çıktısı şemadan geçer; istemler sunucuda sabit; her AI özelliği kapatılabilir; her ücretli dış çağrının tavanı var.
- **Model adları koda gömülmez, ayardan okunur** (OpenAI `tts-1` 2027-01-06, `gpt-4o`/`whisper-1` 2027-02-26'da kapanıyor).
- DB değişikliği yalnız göç dosyasıyla; her özelliğe ≥1 olumlu + ≥1 olumsuz test.
- Paywall: fiyat yalnız mağazadan; görünür kapat; Restore hep görünür; en çok 3 plan, yıllık varsayılan; koşul + gizlilik bağlantıları görünür.
- Oturum: kısa ömürlü erişim + dönen yenileme jetonu, tekrar kullanımda aile düşer; parola 15–128, Argon2id; kayıt yanıtı e-posta varlığını sızdırmaz.
- `EXPO_PUBLIC_` önekine sır yazılmaz (KEY-02).

## 5. Önceki projeden öğrenilen tuzaklar (Eksikler ve Açık İşler)

- Apple JWS doğrulamasında OID/iptal denetimi eksikti → **resmi App Store Server Library**.
- Yedekler şifresiz ve medya kovasındaydı; geri yükleme hiç denenmemişti.
- Hesap başına giriş deneme sınırı yoktu; refresh tekrar kullanımı yakalanmıyordu; sosyal giriş doğrulanmamış hesaba bağlanıyordu; panel jetonu localStorage'da, CSP yoktu; yönetici MFA yoktu.
- Yüklemede boyut + magic-byte denetimi yoktu; AI'a giden dış içerik talimattan ayrılmıyordu.
- Sesli turda istek kimliği yoktu → çift ücret.
- Dağıtım CI'ı beklemiyordu, geri alma çalışmıyordu, süreçler root'tu, uptime izleme ve staging yoktu, bağımlılık taraması `|| true` ile susturulmuştu.
- Uygulama içi ölçüm açılmış ama gizlilik metni / mağaza veri beyanı güncellenmemişti.

## 6. Renk paleti

Kütüphane: `…/2-renk-paletleri/palet-kutuphanesi` (`palettes.json` tek kaynak, `tokens/ts/palettes.ts` → `theme('deepTeal','dark').surface`).

| Palet | 900 / 800 / 700 / 500 / 300 / 100 | Not |
|---|---|---|
| **`deep-teal` (önerilen)** | #071C27 / #123747 / #245568 / #477C8B / #91B3B9 / #DCE9E8 | Sakin, güven veren; metin kontrastı iki temada ~14:1 |
| `ocean-ink` | #0D1722 / #1A2D41 / #2B4A69 / #4D759B / #8CAFCF / #D9E7F2 | Daha "mavi", rakibe yakın — ayrışmak için ikinci tercih |
| `navy-steel` | #10171E / #1F2D3A / #344A5D / #58768D / #94AFC2 / #DCE6ED | Kurumsal / ekip planı için |

Kitte renkler 59 mobil dosyada satır içi hex (mor/altın) → taşırken token'a çevrilecek. `com.yedioda.*`, `yedioda://` ve canlı API adresi yedekleri değiştirilecek.

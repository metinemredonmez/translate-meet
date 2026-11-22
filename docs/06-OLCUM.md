# Sağlayıcı ölçümü (Faz 0)

Amaç: Türkçe dil çiftlerinde Gemini 3.5 Live Translate ve Soniox (two-way + TTS) için gecikme, kalite ve maliyeti **aynı ses setiyle** ölçmek.

## Hazırlık

1. Anahtarları yerel `apps/gateway/.env` dosyasına koy (git'e girmez):
   ```
   TM_GEMINI_API_KEY=...
   TM_SONIOX_API_KEY=...
   TM_SONIOX_TTS_VOICE=Maya   # boş bırakılırsa yalnız altyazı
   ```
2. Metin çevirisi yedek zinciri — `apps/api/.env` (boş bırakılan atlanır, sıra `TM_TRANSLATOR_CHAIN` ile değişir):
   ```
   TM_TRANSLATOR_PROVIDER=chain
   TM_KAPTAN_API_KEY=...      # Kaptan → LLM → Anahtarlar (Qwen, veri Türkiye'de)
   TM_GEMINI_API_KEY=...      # aistudio.google.com/apikey (canlı çeviri ile aynı anahtar)
   TM_OPENAI_API_KEY=...      # platform.openai.com/api-keys
   TM_ANTHROPIC_API_KEY=...   # platform.claude.com → API keys
   TM_KIMI_API_KEY=...        # platform.kimi.ai/console/api-keys
   ```
   Hata veren sağlayıcı 2 dk atlanır; hepsi düşerse 502 ve kota geri bırakılır. Kaptan'da ses (STT/TTS) ucu yok; canlı konuşma Gemini/Soniox'ta kalır.
3. Sentetik örnekler (macOS sesleri, kişisel veri yok): `apps/gateway/bench/make_samples.sh`
   Gerçek konuşma kaydı yalnız **rızalı** kişilerden; kayıtlar repoya girmez.

## Çalıştırma

```bash
cd apps/gateway
uv run python -m bench.run --provider gemini_live    --src tr --tgt en bench/samples/*.wav --out bench/results-gemini.json
uv run python -m bench.run --provider soniox_two_way --src tr --tgt en bench/samples/*.wav --out bench/results-soniox.json
```

## Ölçülenler

| Metrik | Anlamı |
|---|---|
| `first_partial_ms` | ses başı → ilk kaynak altyazı |
| `first_final_ms` | ses başı → ilk çeviri altyazısı |
| `first_audio_ms` | ses başı → ilk çevrilmiş ses |
| `end_to_final_ms` | konuşma sonu → son çeviri (dinleyicinin beklediği süre) |
| `est_cost_usd` | dakika fiyatı varsayımıyla tahmin (`bench/run.py` → `PRICE_PER_MIN`, faturayla doğrulanacak) |

Alfa hedefi (roadmap v2): kararlı altyazı p95 ≤ 1,5 sn, ilk anlamlı ses p95 ≤ 3,0 sn. Kalite (isim, sayı, olumsuzluk) çıktıdaki `finals` alanından elle puanlanır.

Ölçüm bu makineden yapılır; mobil ağ ve Bluetooth etkisi ayrıca cihazda ölçülecek.

## Sonuçlar — 2026-11-22 (ilk gerçek ölçüm)

Ortam: geliştirme Mac'i, ev Wi-Fi; macOS sentetik sesleri (3 TR + 3 EN, 2,6–7,3 sn). Mobil ağ ve cihaz ölçümü yapılmadı.

### Canlı konuşma — Gemini 3.5 Live Translate (iki yönlü, TR↔EN)

| Metrik | p50 | p95 | Alfa hedefi |
|---|---|---|---|
| İlk kaynak altyazı | 2,9 sn | 3,1 sn | — |
| İlk çevrilmiş ses | 3,1 sn | 3,3 sn | ≤ 3,0 sn (p95) — **sınırda, geçmedi** |
| Konuşma sonu → çeviri altyazısı | 1,4 sn | 2,2 sn | ≤ 1,5 sn (p95) — **geçmedi** |
| Tahmini maliyet | ~0,04 $ / konuşma-dk | | |

Davranış notları (gerçek API'de gözlendi, belgede yazmıyor):
- `turnComplete` **hiç gelmiyor**; akış süreklidir. Altyazı cümle sonu noktalamasında veya 1,2 sn duraklamada kapatılıyor.
- Konuşma bitince her 250 ms sessiz ses parçası gelmeye devam ediyor → sessiz parçalar istemciye iletilmiyor.
- `inputTranscription.languageCode` dolu geliyor (tr / en) → dil algılama kullanılabilir.

Kalite:
- "dört değil üç buçuk dolar" olumsuzluğu korundu.
- Hata: "Merhaba. Toplantıyı gelecek salı saat 3'e alabilir miyiz?" → "Hello. / The meeting is next Tuesday at 3 PM?" — **"alabilir miyiz" (rica) kayboldu.**
- Hata: İngilizce "three fifty" → "350" (tanıma belirsizliği; sentetik ses). Sayılarda iki dilli teyit ekranı gerekli.

### Metin çevirisi — 4 cümle (TR→EN, EN→TR, TR→AR, talimat enjeksiyonu)

| Sağlayıcı | Süre | Kalite | Enjeksiyon |
|---|---|---|---|
| **Kaptan** (Qwen3.6-35B) | **0,2–0,3 sn** | iyi; olumsuzluk ve sayı doğru | uygulamadı, çevirdi ✅ |
| Claude (opus-5-5, effort low) | 1,0–1,5 sn | çok iyi | ✅ |
| Gemini (3.8-flash, reasoning low) | 2,0–3,9 sn | iyi (varsayılan düşünmeyle 6–10 sn + **kesik çıktı**, düzeltildi) | ✅ |
| OpenAI (gpt-5-mini) | 3,7–8,3 sn | iyi | ✅ |
| Kimi (kimi-k3) | — | **hesap yetersiz bakiye nedeniyle askıda (429)** | — |

Karar: zincir sırası Kaptan → Gemini → OpenAI → Claude → Kimi korunuyor; Claude, OpenAI'den hızlı olduğu için yedekte öne alınabilir (`TM_TRANSLATOR_CHAIN`).

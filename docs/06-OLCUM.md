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

# Sağlayıcı ölçümü (Faz 0)

Amaç: Türkçe dil çiftlerinde Gemini 3.5 Live Translate ve Soniox (two-way + TTS) için gecikme, kalite ve maliyeti **aynı ses setiyle** ölçmek.

## Hazırlık

1. Anahtarları yerel `apps/gateway/.env` dosyasına koy (git'e girmez):
   ```
   TM_GEMINI_API_KEY=...
   TM_SONIOX_API_KEY=...
   TM_SONIOX_TTS_VOICE=Maya   # boş bırakılırsa yalnız altyazı
   ```
2. Sentetik örnekler (macOS sesleri, kişisel veri yok): `apps/gateway/bench/make_samples.sh`
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

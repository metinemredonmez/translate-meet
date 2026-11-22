# Risk kabul kayıtları

Durum dili red-team kataloğuna göre. Her kayıt Expo SDK yükseltmesinde ve en geç 2027-02-28'de yeniden değerlendirilir.

## RK-001 — Expo 54 derleme araçlarındaki bağımlılık açıkları

- **Durum:** Risk kabul edildi (2026-11-22)
- **Kapsam:** `pnpm audit --prod` bulguları; hepsi `expo@54.0.38` → `@expo/cli`, `@expo/metro-config`, `metro`, `@expo/config` üzerinden gelen **derleme/geliştirme zamanı** paketleri. Uygulama JS paketine (Hermes bytecode) girmezler.

| Paket | Sürüm | GHSA | Seviye | Karar |
|---|---|---|---|---|
| postcss | 8.4.49 | GHSA-6g55-p6wh-862q, GHSA-r28c-9q8g-f849, GHSA-qx2v-qp2m-jg93, GHSA-fxqj-rqcc-2cmp | high/moderate | **Giderildi:** `pnpm.overrides` ile ^8.5.23 (aynı ana sürüm); Metro iOS export ile doğrulandı |
| image-size | 1.2.1 | GHSA-5p2g-fcmc-qvqq, GHSA-w3rx-r6r6-pgpr | high | Risk kabul — düzeltme 2.x (API kırılımı), Metro'yu bozabilir |
| decode-uri-component | 0.2.2 | GHSA-qr28-fpjm-wq7f, GHSA-vcc3-ghjq-m6fr | high/moderate | Risk kabul — düzeltme 0.5.x (ESM'e geçiş), @expo/cli `require` eder |
| glob / minimatch | 13.0.7 / 9.x, 10.x | GHSA-3g3m-2fjr-6pw4, GHSA-g3hv-75wg-m249 | moderate | CI eşiğinin (high) altında; izleniyor |

- **Gerekçe:** Açıklar, kötü niyetli görsel/URL/glob girdisiyle derleme makinesinde DoS (kaynak tüketimi) üretir. Girdi bizim repomuzdaki dosyalar ve yalnız localhost'ta dinleyen geliştirme sunucusudur; üretim kullanıcısına ulaşan yüzey yoktur.
- **Kalan risk:** Derleme makinesinde güvenilmeyen görsel/asset işlenirse DoS. Dış katkıdaki asset'ler inceleme olmadan birleştirilmez.
- **Uygulama:** Kök `package.json` → `pnpm.auditConfig.ignoreGhsas` yalnız yukarıdaki 4 GHSA kimliğini muaf tutar; yeni açık CI'ı yine düşürür.
- **Kapanış koşulu:** Expo SDK'nın yamalı sürümleri getirmesi → muafiyet kaldırılır.

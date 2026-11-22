# translate-meet

Telefonda iki kişilik canlı tercümandan, herkesin kendi dilinde konuştuğu toplantı odalarına kadar uzanan,
kendi sesinle konuşabildiğin çeviri uygulaması. Şu an **Sprint 2**: Gemini Live Translate ve Soniox adaptörleri + ölçüm düzeneği (gerçek anahtarla ölçüm bekliyor).

## Dokümanlar

| Dosya | İçerik |
|---|---|
| [docs/01-ANALIZ.md](docs/01-ANALIZ.md) | Referans uygulamanın ekran envanteri, mimari seçenekler, maliyet, farklılaşma, hukuk, güvenlik temeli |
| [docs/02-ROADMAP.md](docs/02-ROADMAP.md) | Faz 0–5 yol haritası ve kilometre taşları |
| [docs/03-CODEX-PROMPT.md](docs/03-CODEX-PROMPT.md) | Bağımsız ikinci analiz için Codex promptu |
| [docs/04-TASARIM-KAYNAKLARI.md](docs/04-TASARIM-KAYNAKLARI.md) | Mevcut tasarım kiti / özellik kataloğundan taşınacak parçalar, yığın, palet |
| [docs/05-CODEX-KOD-PROMPT.md](docs/05-CODEX-KOD-PROMPT.md) | Sprint 1 kodlama promptu (monorepo iskeleti + ilk dikey dilim) |
| [docs/06-OLCUM.md](docs/06-OLCUM.md) | Sağlayıcı gecikme/maliyet ölçümü nasıl çalıştırılır |
| [docs/codex/CODEX-ANALIZ.md](docs/codex/CODEX-ANALIZ.md) | Codex'in bağımsız analizi ve mevcut belgelerle karşılaştırması |

## Yapı

| Klasör | İçerik |
|---|---|
| `apps/api` | FastAPI: Apple/Google giriş, dönen refresh token, kota defteri, metin çeviri, realtime token |
| `apps/gateway` | WebSocket gateway: `/v1/converse`, kota sayacı, yön bazlı sağlayıcı seçimi, Gemini Live Translate + Soniox adaptörleri, yedeğe geçiş, ölçüm düzeneği (`bench/`) |
| `apps/mobile` | Expo 54 uygulaması: Converse, Translate, Ayarlar (TR/EN, deep-teal tema) |
| `packages/shared` | API + WebSocket sözleşmesi ([CONTRACT.md](packages/shared/CONTRACT.md)) |
| `docs/adr` | Mimari karar kayıtları |

## Yerel kurulum

Gerekenler: Python 3.13 + [uv](https://docs.astral.sh/uv/), Node 20 + pnpm 9. Geliştirmede SQLite yeterli; prod PostgreSQL ister.

```bash
pnpm install
cd apps/api && uv sync && uv run alembic upgrade head && cd ../..
cd apps/gateway && uv sync && cd ../..
pnpm dev:api        # http://localhost:8000
pnpm dev:gateway    # ws://localhost:8001/v1/converse
pnpm dev:mobile     # Expo dev client
```

Testler: `pnpm test:api`, `pnpm test:gateway`, `pnpm --filter @translate-meet/mobile test`.
Ortam değişkenlerinin yalnız adları `apps/*/.env.example` içinde; değerler repoya girmez.

## Not

Referans ekran görüntüleri (`IMG_*.PNG`) yerel klasörde durur, repoya eklenmez (üçüncü taraf içerik ve kişisel veri içerir).

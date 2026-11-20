# ADR 0001 — Monorepo ve yığın

- Durum: Kabul edildi (2026-11-20)
- Karar: pnpm workspaces monorepo. `apps/mobile` (Expo 54, RN 0.81, expo-router, NativeWind), `apps/api` (FastAPI, SQLAlchemy 2, Alembic, Python 3.13 + uv), `apps/gateway` (ayrı asyncio WebSocket servisi), `packages/shared` (sözleşme).
- Gerekçe: Mevcut tasarım kiti ve Palemi şablonu aynı yığında; parça taşıma maliyeti en düşük. Canlı medya ile HTTP API ayrı süreçlerde ölçeklenir ve ayrı çökebilir.
- Sonuç: Python uygulamaları kendi `uv.lock` dosyasıyla, mobil pnpm kilidiyle kurulur. Docker prod'a girmez (pm2 + nginx).

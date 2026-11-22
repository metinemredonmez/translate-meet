# @translate-meet/web

Translate Meet tanıtım sitesi (Next.js 16 App Router, Tailwind 4). Tamamen statik; form, çerez, analiz ve üçüncü taraf betik yok.

```bash
pnpm --filter @translate-meet/web dev        # http://localhost:3002
pnpm --filter @translate-meet/web typecheck
pnpm --filter @translate-meet/web test
pnpm --filter @translate-meet/web build
```

## Yapı

| Yol | İçerik |
|---|---|
| `src/app/(tr)/…` | Türkçe sayfalar (`/`, `/sss`, `/gizlilik`, `/kullanim-sartlari`, `/kvkk-aydinlatma`, `/hesap-silme`), kendi `<html lang="tr">` kök düzeni |
| `src/app/(en)/en/…` | İngilizce sayfalar (`/en`, `/en/faq`, `/en/privacy`, `/en/terms`, `/en/kvkk-notice`, `/en/account-deletion`), `<html lang="en">` |
| `src/app/global-not-found.tsx` | İki dilli 404 (iki kök düzen olduğu için `experimental.globalNotFound`) |
| `src/i18n/tr.ts`, `en.ts` | Görünen bütün metinler; anahtar kümeleri testle eşit tutulur |
| `src/lib/routes.ts` | Sayfa kimliği → dil başına adres (hreflang, sitemap, menüler buradan) |
| `src/lib/seo.ts`, `jsonld.ts` | Sayfa üst verisi, FAQPage JSON-LD (güvenli kaçış) |
| `next.config.ts` | Güvenlik başlıkları (CSP vb.) |

Renkler yalnız `@translate-meet/shared/tokens.css` değişkenlerinden gelir (`globals.css` → `@theme`); Tailwind'in varsayılan paleti kapalı.

## Ortam

`NEXT_PUBLIC_SITE_URL` — canonical/hreflang/sitemap kökü. Boşsa `http://localhost:3002`; yayından önce gerçek alan adıyla ayarlanmalı (`.env.example`).

## Notlar

- Hukuki sayfalar **TASLAK**; köşeli parantezli alanlar (`[Şirket unvanı]`, `[Adres]`, `[MERSİS]`, `[İletişim e-postası]`, saklama süreleri, işleme ülkeleri) doldurulmadan yayına çıkmaz.
- Mağaza rozetleri "Yakında" durumunda ve bağlantısız; gerçek mağaza adresleri gelince resmî rozetlerle değiştirilir.
- Çerez bandı yok, çünkü çerez/analiz yok. Ölçüm eklenirse önce tasarım kitindeki onay bandı (web/09) eklenmeli ve gizlilik metni güncellenmeli.

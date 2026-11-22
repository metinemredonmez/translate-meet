# Translate Meet — admin panel

Next.js 16 (App Router) admin panel for the Translate Meet API. Turkish by default, English toggle.

## Run

```bash
# from the repo root
pnpm --filter @translate-meet/panel dev        # http://localhost:3001
pnpm --filter @translate-meet/panel test
pnpm --filter @translate-meet/panel typecheck
pnpm --filter @translate-meet/panel build
```

The API must be running (`pnpm dev:api`, port 8000). The browser only talks to the panel origin:
`/api/*` is rewritten to the API, so the session cookies stay first-party.

| Env | Default | Meaning |
|---|---|---|
| `API_URL` | `http://localhost:8000` | Backend base URL used by the `/api/*` rewrite (read at build/start). |

The backend only accepts admin requests from the origins in `TM_ADMIN_ALLOWED_ORIGINS`
(default `http://localhost:3001`).

## Creating an admin

There is no self-signup. Create an admin (asks for a 15+ character password and prints the TOTP setup
for an authenticator app):

```bash
cd apps/api && uv run python -m app.cli create-admin --email you@example.com
# read-only account:
cd apps/api && uv run python -m app.cli create-admin --email viewer@example.com --role viewer
```

## Security notes

- Session: httpOnly `tm_admin` cookie set by the API after password + mandatory TOTP. No token is ever
  stored in localStorage/sessionStorage (only the UI language is).
- CSRF: every POST/PUT/PATCH/DELETE sends `x-csrf-token` = the `tm_csrf` cookie (`src/lib/api.ts`).
- Any 401 sends the browser to `/login`; `src/proxy.ts` also redirects when no session cookie exists.
- CSP is set per request with a nonce in `src/proxy.ts` (`src/lib/csp.ts`), because the App Router's
  inline hydration scripts would be blocked by a static `script-src 'self'`. Other security headers and
  `X-Robots-Tag: noindex` are in `next.config.ts`.
- The viewer role only hides actions in the UI; the API enforces roles (403).
- Server data is always rendered as text (no `dangerouslySetInnerHTML`).

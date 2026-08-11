# Restaurant QR Menu (Next.js + Prisma)

Full-stack web app for restaurant QR menu and order management.

## Stack

- Frontend: Next.js (App Router), React, Tailwind CSS
- Backend: Next.js API routes
- Database: SQLite + Prisma
- Order updates: polling every 5 seconds in admin panel

## Features

- Public menu page (`/`)
- 3 languages: English / Russian / Azerbaijani
- Cart, table number input, order creation
- Admin panel (`/admin`) with login/password
- Orders list with auto refresh each 5 seconds
- Order status updates (`new`, `preparing`, `ready`, `paid`)
- Full menu management (add/edit/delete dishes)
- Category management
- Image upload for dishes
- QR code generation for menu link
- Paper QR-safe flow: static table QR links issue a signed session token on scan, and session closes after `paid`

## Quick Start

0. Use Node.js version from `.nvmrc` (recommended):

```bash
nvm use
```

1. Install dependencies:

```bash
npm install
```

2. Create environment file:

```bash
cp .env.example .env
```

3. Generate Prisma client and run migration:

```bash
npm run prisma:generate
npm run prisma:migrate
```

4. Seed demo menu data:

```bash
npm run prisma:seed
```

5. Start development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## macOS Notes

- The project is cross-platform; avoid adding OS-specific packages (for example `*-darwin-*`) to main dependencies.
- If `nvm use` says version is missing, install it first:

```bash
nvm install
nvm use
```

## Admin Accounts

There are no built-in default credentials.

- **Super admin** — set `SUPER_ADMIN_LOGIN` and `SUPER_ADMIN_PASSWORD` in `.env`.
  If `SUPER_ADMIN_PASSWORD` is unset, super-admin sign-in is disabled entirely.
- **Restaurant admin** — created per restaurant from the super-admin panel. The
  password is stored as a bcrypt hash inside that restaurant's `settings` JSON.

## Security Keys

Set these in `.env` (and as Worker secrets in production) to long random values:

- `ADMIN_SESSION_SECRET` — signs the admin session cookie. Falls back to
  `QR_TOKEN_SECRET` if unset. In production, if neither is set, sessions cannot
  be issued or verified and sign-in fails closed.
- `QR_TOKEN_SECRET` — signs table QR session tokens.
- `QR_TABLE_KEY_SECRET` — signs the per-table access keys embedded in QR links.

```bash
npx wrangler secret put ADMIN_SESSION_SECRET
```

Rotating `ADMIN_SESSION_SECRET` invalidates every active admin session.

## Image Uploads (R2)

Workers have no writable filesystem, so dish photos go to an R2 bucket bound as
`MEDIA_BUCKET` and are served back through `/api/media/<key>`. Keys are prefixed
per restaurant (`r<id>/<uuid>.<ext>`).

One-time setup — **`wrangler deploy` fails until this is done**, because
`wrangler.jsonc` references the bucket:

1. Enable R2 in the Cloudflare dashboard (one-time, requires accepting R2 terms).
2. Create the bucket:

```bash
npx wrangler r2 bucket create qr-menu-media
```

Notes:

- Images uploaded before R2 still live in `public/uploads` and keep their
  `/uploads/...` URLs. They ship as static assets and are not migrated.
- Under plain `next dev` there is no binding, so uploads fall back to writing
  into `public/uploads`, exactly as the app behaved before R2.
- Uploads are limited to 8 MB and to JPEG/PNG/WebP/AVIF, verified by inspecting
  the file's magic bytes. SVG is rejected — it is executable markup and would be
  a stored-XSS vector on the guest menu.
- Deleting a dish does not delete its image from R2 yet; orphans accumulate.

Do not run `npm run cf-typegen`. The generated `cloudflare-env.d.ts` also brings
in the Workers runtime `Request` type, whose `json()` returns `unknown` instead
of `any`, which breaks every route that reads a request body. Bindings are typed
by hand in `src/types/cloudflare.d.ts` instead.

## Tenant Isolation

The session cookie is an HMAC-signed token carrying the caller's role and, for a
restaurant admin, their `restaurantId`. Every write route derives its tenant from
that signed session — a `restaurantId` in a request body or query string is only
ever allowed to match it, never to replace it. See `resolveTenantScope` /
`requireTenantScope` in `src/lib/auth.ts`.

## Useful Scripts

- `npm run dev` - run app in development
- `npm run build` - production build
- `npm run prisma:generate` - regenerate Prisma client
- `npm run prisma:migrate` - create/apply migration
- `npm run prisma:seed` - fill DB with sample categories and dishes

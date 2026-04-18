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

## Default Admin Credentials

- Login: `admin`
- Password: `admin123`

You can override these values in `.env`.

## Security Keys

Set `QR_TOKEN_SECRET` and `QR_TABLE_KEY_SECRET` in `.env` to long random values.

## Useful Scripts

- `npm run dev` - run app in development
- `npm run build` - production build
- `npm run prisma:generate` - regenerate Prisma client
- `npm run prisma:migrate` - create/apply migration
- `npm run prisma:seed` - fill DB with sample categories and dishes

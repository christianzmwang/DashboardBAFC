# BAFC Dashboard

Interactive revenue and membership dashboard built with Next.js App Router, Tailwind CSS, D3, and Google Sign‑In via NextAuth.

## Tech Stack
- Next.js `14.x` (App Router)
- React `18`
- Tailwind CSS `3.4`
- D3 `7`
- NextAuth (Google provider)

## Prerequisites
- Node.js `>=18.17` (LTS recommended)
- pnpm (repo uses `packageManager: pnpm@9.12.1`)
- Google Cloud project for OAuth (for local dev you can use http://localhost)

Install pnpm if needed and enable Corepack:

```bash
corepack enable
corepack prepare pnpm@9.12.1 --activate
```

## Environment Variables
Authentication is required to access the app. Configure Google OAuth credentials and set these environment variables (create a `.env.local` in the project root):

```bash
# .env.local
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-string
```

Notes:
- `NEXTAUTH_SECRET`: generate with `openssl rand -base64 32` or `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`.
- Google OAuth Authorized redirect URI must be:
	- `http://localhost:3000/api/auth/callback/google` (for local dev)
	- `<your-prod-url>/api/auth/callback/google` (for production)

## Data Files
CSV files are read server-side from the `public/` folder. Ensure these exist:

- `public/dataprimo.csv` — payments with columns (sample headers):
	- `Invoice Number, Invoice Due Date, Transaction At, Transaction Amount, Payment Amount, Currency Code, Payer Home Location`
- `public/membersbeta.csv` — memberships; expects columns like:
	- `Client, Plan Name, Start Date, End Date, Used for Client's First Visit?, Membership?, Canceled?, Client's First Pass/Plan?, Client's First Membership?, Client's Home Location, Client ID, Plan ID`
- `public/membersalpha.csv` — alternative memberships source; may omit some boolean columns. The parser handles missing fields (assumes membership rows and infers cancellations from `End Date`).

File lookup tries multiple locations for serverless/container environments, but the simplest is to keep CSVs in `public/` during development and deployment.

## Install & Run
```bash
pnpm install
pnpm dev
```

App will be available at `http://localhost:3000`.

Sign in with Google on the `/auth/signin` page. Middleware protects `/`.

## Available Scripts
- `pnpm dev` — start Next.js dev server
- `pnpm build` — production build
- `pnpm start` — start production server (after build)
- `pnpm lint` — run ESLint

## What the APIs Do
- `GET /api/revenue-data` — overall and per‑location monthly revenue aggregates from `dataprimo.csv`
- `GET /api/revenue-data/amount-breakdown` — monthly revenue composition by rounded transaction amount
- `GET /api/revenue-data/amount-breakdown-by-location` — composition per location
- `GET /api/membership-data?file=membersbeta.csv|membersalpha.csv` — active totals/new/canceled per month
- `GET /api/membership-program-breakdown?file=...` — monthly active counts split by program

## Membership Sources Toggle
On the dashboard you can toggle between:
- `All Memberships` → uses `membersbeta.csv` (rows with `Membership? = Yes` or treated as memberships if column is absent)
- `First Memberships Only` → uses `membersalpha.csv` (rows where `Client's First Membership? = Yes`)

## Build & Run in Production
```bash
pnpm build
pnpm start
```

Make sure the environment variables are set in your hosting platform and that CSV files are deployed with the app (in `public/`).

## Tailwind & Styling
Tailwind CSS `3.4` with dark‑mode class strategy is used. Toggle theme from the UI header. Global styles are in `app/globals.css` and config in `tailwind.config.js`.

## Troubleshooting
- Auth redirect loop or `redirect_uri_mismatch` (Error 400):
	- In Google Cloud Console → APIs & Services → Credentials → your OAuth Client, add Authorized redirect URIs for each environment:
		- `http://localhost:3000/api/auth/callback/google` (local)
		- `https://your-domain.com/api/auth/callback/google` (prod)
	- Ensure `NEXTAUTH_URL` matches the base URL exactly (including protocol) for the environment.
	- Restart dev server after changing `.env.local`.
- Want to choose a different Google account each time?
	- The app forces the Google account chooser via `prompt=select_account` in the provider and sign-in call.
	- If you’re still being auto‑logged in, open an incognito window or sign out of Google at `https://accounts.google.com/`.
- 500 on API routes: ensure CSV files exist in `public/` with expected headers.
- Empty charts: adjust date range at the top; 2021 data is intentionally filtered out by the aggregators.

## License
Private project. All rights reserved.

# Revenue Dashboard (Next.js + Tailwind v4 alpha)

Visualizes month-over-month revenue aggregated from `data.csv`.

## Stack
- Next.js (App Router)
- React 18
- Tailwind CSS 4 alpha
- D3 for the bar chart

## Development
Install dependencies then run dev server:

```bash
corepack enable
pnpm install
pnpm dev
```

Navigate to http://localhost:3000

## Data parsing
`lib/parseCsv.ts` loads `data.csv` at build/runtime (server side) and aggregates total payment amount per YYYY-MM from the `Transaction At` timestamp.

## Notes
- CSV parsing is simplistic; for more complex CSVs consider `papaparse`.
- Tailwind 4 is still alpha; adjust version when stable.

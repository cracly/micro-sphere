# micro-sphere frontend

Static Next.js dashboard for the micro-sphere weather project. See the [root README](../README.md) for the full architecture.

Stack: Next.js 15 (app router, static export) · Tailwind CSS 4 · shadcn/ui · Recharts · lucide-react.

```bash
npm ci
npm run dev     # develop against the committed data in public/backend/data
npm run build   # static export to out/
```

Structure:

- `src/components/WeatherDashboard.tsx` — page layout, data loading, language/theme state
- `src/components/charts/` — small-multiple forecast panels (hourly, daily, nowcast)
- `src/lib/` — data types, i18n strings, WMO weather-code mapping, timezone-safe formatting

All forecast timestamps are Europe/Vienna wall time and are formatted without going through the
viewer's local timezone (see `src/lib/weather-utils.ts`).

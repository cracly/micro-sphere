# micro-sphere

Hyper-local, high-quality weather analytics and forecast for **Kledering** (Vienna outskirts, Austria).

A location-locked weather dashboard with no runtime backend: GitHub Actions fetch and process the data on a schedule, commit it as static JSON, and GitHub Pages serves a static Next.js frontend on top of it.

## Architecture

```
Open-Meteo API ──┐
                 ├─► backend/fetch_weather_data.py ─► processed_*.json ─► committed to repo
GeoSphere API ───┘        (GitHub Actions, every 15 min)                       │
                                                                               ▼
Open-Meteo API ─► backend/mistral_api_analysis.py ─► weather_analysis.json   Next.js static export
                       (GitHub Actions, daily, Mistral AI)                (GitHub Pages deploy)
```

- **Open-Meteo** (primary): current conditions, hourly forecast (yesterday + 8 days), daily forecast
- **GeoSphere Austria** (secondary): 3-hour nowcast at 15-minute resolution on a 1 km grid
- **Mistral AI**: daily natural-language weather briefing (English + German)

## Repository layout

| Path | Purpose |
|---|---|
| `backend/fetch_weather_data.py` | Fetches both APIs, shapes the data for the frontend |
| `backend/mistral_api_analysis.py` | Generates the AI weather briefing (needs `MISTRAL_API_KEY`) |
| `backend/data/` | Processed JSON (committed) and raw API dumps (gitignored) |
| `frontend/` | Next.js 15 + Tailwind 4 + Recharts dashboard, static export |
| `frontend/public/backend/data/` | Data files served to the browser (mirrored by the fetcher) |
| `.github/workflows/` | Data update (15 min), AI analysis (daily), Pages deploy |

## Development

Backend (Python ≥ 3.11):

```bash
cd backend
pip install -r requirements.txt
python fetch_weather_data.py          # refresh weather data
MISTRAL_API_KEY=... python mistral_api_analysis.py   # regenerate AI briefing
```

Frontend (Node ≥ 20):

```bash
cd frontend
npm ci
npm run dev     # local dev server
npm run build   # static export to frontend/out
```

## Secrets

| Secret | Used by |
|---|---|
| `MISTRAL_API_KEY` | `update-weather-analysis.yml` |
| `PAT_TOKEN` | `update-weather-data.yml` (push data commits) |

API keys live only in GitHub Actions secrets / environment variables — never in the repository.

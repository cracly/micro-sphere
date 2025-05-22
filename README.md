# micro-sphere
Hyper local high quality weather analytics and forecast

## structure
1. Project Overview:
   - A weather local dashboard, location locked
   - Data sources: open-meteo.com API (primary) and geosphere.at API (secondary/future)
   - Automated data fetching using GitHub Actions
   - Static frontend hosted on GitHub Pages
   - No backend server required - data stored as JSON files in repo

2. Technical Requirements:
   - Cache weather data as static JSON files in the repo
   - Support multiple weather models comparison (future feature)

3. Fetcher Script Requirements:
   - Fetch data from open-meteo.com API
   - Save with timestamp (for archiving) and as latest_xxx.json (for frontend use)
   - Create metadata file with last update time
   - Support for multiple data sources (expandable)

4. GitHub Actions Workflow:
   - Support manual triggering
   - Commit data files back to repository
   - Configure to run on Python 3.13+

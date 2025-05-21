# micro-sphere
Hyper local high quality weather analytics and forecast

## structure
1. Project Overview:
   - A weather dashboard for an Austrian village near Vienna
   - Data sources: open-meteo.com API (primary) and geosphere.at API (secondary/future)
   - Automated data fetching (3 times daily) using GitHub Actions
   - Static frontend hosted on GitHub Pages
   - No backend server required - data stored as JSON files in repo

2. Directory Structure:
   - /scripts: Python scripts for fetching weather data
   - /data: Directory to store fetched JSON data (ignored in .gitignore except metadata.json)
   - /assets: CSS, images, and other static assets
   - /js: JavaScript files for the frontend
   - index.html: Main dashboard page

3. Core Files to Create:
   - scripts/fetch_weather_data.py: Python script to fetch data from open-meteo API
   - .github/workflows/fetch-weather.yml: GitHub Action to run the fetcher 3 times daily
   - index.html: Main dashboard page with responsive design
   - js/dashboard.js: JavaScript for loading data and creating visualizations
   - assets/styles.css: CSS for styling the dashboard
   - README.md: Project documentation

4. Key Features:
   - Current weather conditions display
   - Hourly forecast for today
   - 7-day forecast
   - Temperature trends chart
   - Precipitation forecast
   - Last updated timestamp
   - Responsive design for mobile and desktop

5. Technical Requirements:
   - Use Chart.js for visualizations
   - Cache weather data as static JSON files in the repo
   - Support multiple weather models comparison (future feature)
   - No backend processing needed - API data used directly for visualization
   - API parameters for Vienna region (lat: ~48.2, lon: ~16.4)
   - Metadata file to track last update time

6. Fetcher Script Requirements:
   - Fetch data from open-meteo.com API
   - Save with timestamp (for archiving) and as latest_xxx.json (for frontend use)
   - Create metadata file with last update time
   - Handle errors gracefully
   - Support for multiple data sources (expandable)

7. GitHub Actions Workflow:
   - Run 3 times daily (6 AM, 2 PM, 10 PM)
   - Support manual triggering
   - Commit data files back to repository
   - Configure to run on Python 3.10+

8. Visualization Requirements:
   - Current conditions card with temperature, icon, and brief metrics
   - Today's hourly forecast line chart
   - 7-day forecast with min/max temperatures
   - Temperature trend line chart
   - Precipitation bar chart
   - Weather code to icon/description mapping

Help me implement this project focusing on simplicity and maintainability.

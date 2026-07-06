"""Fetch and process weather data for Kledering.

Sources:
  - Open-Meteo forecast API (primary): current conditions, hourly and daily forecast
  - GeoSphere Austria nowcast (secondary): 3-hour / 15-minute high-resolution nowcast

Raw API responses are stored under data/raw_*.json, processed frontend-ready
files under data/processed_*.json and mirrored into the frontend public dir.
"""

from __future__ import annotations

import json
import sys
import time
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import requests

# Location: Kledering (Vienna outskirts)
LATITUDE = 48.133029
LONGITUDE = 16.4277403
LOCATION_NAME = "Kledering"
LOCAL_TZ = ZoneInfo("Europe/Vienna")

REQUEST_TIMEOUT = 30  # seconds
RETRIES = 3
RETRY_BACKOFF = 5  # seconds between attempts

BACKEND_DIR = Path(__file__).resolve().parent
DATA_DIR = BACKEND_DIR / "data"
FRONTEND_DATA_DIR = BACKEND_DIR.parent / "frontend" / "public" / "backend" / "data"

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"
OPEN_METEO_PARAMS = {
    "latitude": LATITUDE,
    "longitude": LONGITUDE,
    "timezone": "Europe/Vienna",
    "past_days": 1,
    "forecast_days": 8,
    "models": "best_match",
    "current": ",".join([
        "temperature_2m",
        "apparent_temperature",
        "relative_humidity_2m",
        "precipitation",
        "weather_code",
        "cloud_cover",
        "pressure_msl",
        "wind_speed_10m",
        "wind_direction_10m",
        "wind_gusts_10m",
        "is_day",
    ]),
    "hourly": ",".join([
        "temperature_2m",
        "apparent_temperature",
        "relative_humidity_2m",
        "precipitation_probability",
        "precipitation",
        "weather_code",
        "cloud_cover",
        "visibility",
        "uv_index",
        "pressure_msl",
        "wind_speed_10m",
        "wind_direction_10m",
        "wind_gusts_10m",
        "is_day",
    ]),
    "daily": ",".join([
        "weather_code",
        "temperature_2m_max",
        "temperature_2m_min",
        "apparent_temperature_max",
        "apparent_temperature_min",
        "sunrise",
        "sunset",
        "daylight_duration",
        "sunshine_duration",
        "uv_index_max",
        "precipitation_sum",
        "precipitation_probability_max",
        "wind_speed_10m_max",
        "wind_gusts_10m_max",
        "wind_direction_10m_dominant",
    ]),
}

GEOSPHERE_URL = (
    "https://dataset.api.hub.geosphere.at/v1/timeseries/forecast/nowcast-v1-15min-1km"
)
GEOSPHERE_PARAMS = {
    "parameters": "t2m,rr,td,dd,ff,fx",
    "lat_lon": f"{LATITUDE},{LONGITUDE}",
}

MS_TO_KMH = 3.6


def fetch_json(url: str, params: dict) -> dict | None:
    """GET a JSON resource with retries; return None on persistent failure."""
    for attempt in range(1, RETRIES + 1):
        try:
            response = requests.get(url, params=params, timeout=REQUEST_TIMEOUT)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as exc:
            print(f"  attempt {attempt}/{RETRIES} failed for {url}: {exc}")
            if attempt < RETRIES:
                time.sleep(RETRY_BACKOFF)
    return None


def columns_to_rows(block: dict, fields: dict[str, str], time_key: str = "time") -> list[dict]:
    """Convert Open-Meteo's column-oriented block into a list of row dicts.

    fields maps output name -> API column name. Missing columns yield None.
    """
    times = block.get(time_key, [])
    columns = {out: block.get(src, []) for out, src in fields.items()}
    rows = []
    for i, timestamp in enumerate(times):
        row = {"time": timestamp}
        for out, column in columns.items():
            row[out] = column[i] if i < len(column) else None
        rows.append(row)
    return rows


def process_open_meteo(data: dict) -> dict:
    """Shape the raw Open-Meteo response into the frontend data model."""
    current = data.get("current", {})
    processed = {
        "location": {
            "name": LOCATION_NAME,
            "latitude": data.get("latitude", LATITUDE),
            "longitude": data.get("longitude", LONGITUDE),
            "elevation": data.get("elevation"),
            "timezone": data.get("timezone", "Europe/Vienna"),
        },
        "source": "Open-Meteo",
        "last_updated": datetime.now(LOCAL_TZ).isoformat(),
        "units": {
            "temperature": "°C",
            "precipitation": "mm",
            "wind": "km/h",
            "pressure": "hPa",
            "humidity": "%",
            "cloud_cover": "%",
            "visibility": "m",
        },
        "current": {
            "time": current.get("time"),
            "temperature": current.get("temperature_2m"),
            "feels_like": current.get("apparent_temperature"),
            "humidity": current.get("relative_humidity_2m"),
            "precipitation": current.get("precipitation"),
            "weather_code": current.get("weather_code"),
            "cloud_cover": current.get("cloud_cover"),
            "pressure": current.get("pressure_msl"),
            "wind_speed": current.get("wind_speed_10m"),
            "wind_direction": current.get("wind_direction_10m"),
            "wind_gusts": current.get("wind_gusts_10m"),
            "is_day": current.get("is_day"),
        },
        "hourly": columns_to_rows(data.get("hourly", {}), {
            "temperature": "temperature_2m",
            "feels_like": "apparent_temperature",
            "humidity": "relative_humidity_2m",
            "precipitation_probability": "precipitation_probability",
            "precipitation": "precipitation",
            "weather_code": "weather_code",
            "cloud_cover": "cloud_cover",
            "visibility": "visibility",
            "uv_index": "uv_index",
            "pressure": "pressure_msl",
            "wind_speed": "wind_speed_10m",
            "wind_direction": "wind_direction_10m",
            "wind_gusts": "wind_gusts_10m",
            "is_day": "is_day",
        }),
        "daily": columns_to_rows(data.get("daily", {}), {
            "weather_code": "weather_code",
            "temperature_max": "temperature_2m_max",
            "temperature_min": "temperature_2m_min",
            "feels_like_max": "apparent_temperature_max",
            "feels_like_min": "apparent_temperature_min",
            "sunrise": "sunrise",
            "sunset": "sunset",
            "daylight_duration": "daylight_duration",
            "sunshine_duration": "sunshine_duration",
            "uv_index_max": "uv_index_max",
            "precipitation_sum": "precipitation_sum",
            "precipitation_probability_max": "precipitation_probability_max",
            "wind_speed_max": "wind_speed_10m_max",
            "wind_gusts_max": "wind_gusts_10m_max",
            "wind_direction_dominant": "wind_direction_10m_dominant",
        }),
    }
    return processed


def process_geosphere(data: dict) -> dict | None:
    """Shape the raw GeoSphere nowcast into the frontend data model.

    Wind values arrive in m/s and are converted to km/h so they compare
    directly with the Open-Meteo panels.
    """
    timestamps = data.get("timestamps", [])
    try:
        parameters = data["features"][0]["properties"]["parameters"]
    except (KeyError, IndexError, TypeError):
        print("  unexpected GeoSphere response shape, skipping")
        return None

    def series(name: str) -> list:
        return parameters.get(name, {}).get("data", [])

    def kmh(value):
        return round(value * MS_TO_KMH, 1) if value is not None else None

    columns = {
        "temperature": series("t2m"),
        "precipitation": series("rr"),
        "dew_point": series("td"),
        "wind_direction": series("dd"),
        "wind_speed": [kmh(v) for v in series("ff")],
        "wind_gusts": [kmh(v) for v in series("fx")],
    }

    forecast = []
    for i, timestamp in enumerate(timestamps):
        row = {"time": timestamp}
        for name, column in columns.items():
            row[name] = column[i] if i < len(column) else None
        forecast.append(row)

    return {
        "location": {
            "name": LOCATION_NAME,
            "latitude": LATITUDE,
            "longitude": LONGITUDE,
            "timezone": "Europe/Vienna",
        },
        "source": "GeoSphere Austria",
        "forecast_type": "nowcast",
        "resolution_minutes": 15,
        "last_updated": datetime.now(LOCAL_TZ).isoformat(),
        "units": {
            # GeoSphere reports "degree_Celsius" / "kg m-2"; use display units
            # (1 kg/m² of rain = 1 mm)
            "temperature": "°C",
            "precipitation": "mm",
            "dew_point": "°C",
            "wind_direction": "°",
            "wind_speed": "km/h",
            "wind_gusts": "km/h",
        },
        "forecast_data": forecast,
    }


def save_json(data: dict, path: Path, mirror_to_frontend: bool = False) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"  wrote {path.relative_to(BACKEND_DIR.parent)}")
    if mirror_to_frontend:
        mirror = FRONTEND_DATA_DIR / path.name
        mirror.parent.mkdir(parents=True, exist_ok=True)
        with open(mirror, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"  wrote {mirror.relative_to(BACKEND_DIR.parent)}")


def run_source(name: str, url: str, params: dict, processor, output_stem: str) -> bool:
    """Fetch, process and persist one data source. Returns True on success."""
    print(f"Fetching {name}...")
    raw = fetch_json(url, params)
    if raw is None:
        print(f"  {name} unavailable")
        return False

    save_json(raw, DATA_DIR / f"raw_{output_stem}.json")
    processed = processor(raw)
    if processed is None:
        return False
    save_json(processed, DATA_DIR / f"processed_{output_stem}.json", mirror_to_frontend=True)
    return True


def main() -> int:
    results = {
        "Open-Meteo": run_source(
            "Open-Meteo forecast", OPEN_METEO_URL, OPEN_METEO_PARAMS,
            process_open_meteo, "open_meteo",
        ),
        "GeoSphere Austria": run_source(
            "GeoSphere nowcast", GEOSPHERE_URL, GEOSPHERE_PARAMS,
            process_geosphere, "geosphere",
        ),
    }

    metadata = {
        "last_update": datetime.now(LOCAL_TZ).isoformat(),
        "status": "success" if any(results.values()) else "error",
        "sources": [
            {"name": name, "status": "success" if ok else "error"}
            for name, ok in results.items()
        ],
    }
    save_json(metadata, DATA_DIR / "processed_metadata.json", mirror_to_frontend=True)

    if not any(results.values()):
        print("All sources failed.")
        return 1
    print("Done.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

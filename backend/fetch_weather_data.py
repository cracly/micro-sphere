import os
import json
import requests
import shutil
from datetime import datetime
import pytz  # For timezone handling

# Configuration
# short term nowcast 3 hours
GEOSPHERE_API_NOWCAST_URL = "https://dataset.api.hub.geosphere.at/v1/timeseries/forecast/nowcast-v1-15min-1km?parameters=t2m,rr,td,dd,ff,fx&lat_lon=48.133029,16.4277403"
OPEN_METEO_API_URL = "https://api.open-meteo.com/v1/forecast?latitude=48.133&longitude=16.4366&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset,daylight_duration,uv_index_max,precipitation_sum&hourly=temperature_2m,rain,cloud_cover,visibility,wind_speed_10m,wind_direction_10m,wind_gusts_10m&models=best_match&current=temperature_2m,apparent_temperature,rain,showers,precipitation,cloud_cover,wind_speed_10m,wind_gusts_10m,wind_direction_10m&timezone=auto&past_days=2"

# Path to frontend public directory
FRONTEND_PUBLIC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "backend", "data"))

# Define timezone for CEST
TIMEZONE_CEST = pytz.timezone('Europe/Vienna')  # Vienna is in CEST timezone

def fetch_geosphere_data():
    """Fetch data from Geosphere API"""
    try:
        response = requests.get(GEOSPHERE_API_NOWCAST_URL)
        response.raise_for_status()  # Raise exception for HTTP errors
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching data from Geosphere: {e}")
        return None

def fetch_open_meteo_data():
    """Fetch data from Open-Meteo API"""
    try:
        response = requests.get(OPEN_METEO_API_URL)
        response.raise_for_status()  # Raise exception for HTTP errors
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching data from Open-Meteo: {e}")
        return None

def process_geosphere_data(data):
    """Process Geosphere data for frontend consumption"""
    if not data:
        return None

    processed_data = {
        "location": "Kledering",
        "last_updated": datetime.now(TIMEZONE_CEST).isoformat(),
        "source": "Geosphere",
        "forecast_type": "nowcast",
        "forecast_period": "3 hour",
        "resolution": "15 minute"
    }

    timestamps = data.get("timestamps", [])

    # Safely extract parameters from the first feature
    try:
        parameters = data["features"][0]["properties"]["parameters"]
    except (KeyError, IndexError, TypeError):
        parameters = {}

    temperature = parameters.get("t2m", {}).get("data", [])
    precipitation = parameters.get("rr", {}).get("data", [])
    dew_point = parameters.get("td", {}).get("data", [])
    wind_direction = parameters.get("dd", {}).get("data", [])
    wind_speed = parameters.get("ff", {}).get("data", [])
    wind_gust = parameters.get("fx", {}).get("data", [])

    forecast_data = []
    for i, timestamp in enumerate(timestamps):
        entry = {
            "time": timestamp,
            "temperature": temperature[i] if i < len(temperature) else None,
            "precipitation": precipitation[i] if i < len(precipitation) else None,
            "dew_point": dew_point[i] if i < len(dew_point) else None,
            "wind_direction": wind_direction[i] if i < len(wind_direction) else None,
            "wind_speed": wind_speed[i] if i < len(wind_speed) else None,
            "wind_gust": wind_gust[i] if i < len(wind_gust) else None
        }
        forecast_data.append(entry)

    processed_data["forecast_data"] = forecast_data

    processed_data["units"] = {
        "temperature": parameters.get("t2m", {}).get("unit", "°C"),
        "precipitation": parameters.get("rr", {}).get("unit", "kg m-2"),
        "dew_point": parameters.get("td", {}).get("unit", "°C"),
        "wind_direction": parameters.get("dd", {}).get("unit", "m s-1"),
        "wind_speed": parameters.get("ff", {}).get("unit", "m s-1"),
        "wind_gust": parameters.get("fx", {}).get("unit", "m s-1")
    }

    return processed_data

def process_data_for_frontend(data):
    """Process and simplify the data for frontend consumption"""
    if not data:
        return None

    # Extract only the data we need for frontend
    processed_data = {
        "location": "Kledering",
        "last_updated": datetime.now(TIMEZONE_CEST).isoformat(),
        "current_weather": {
            "time": data.get("current", {}).get("time"),
            "temperature": {
                "value": data.get("current", {}).get("temperature_2m"),
                "unit": data.get("current_units", {}).get("temperature_2m", "°C"),
                "feels_like": data.get("current", {}).get("apparent_temperature")
            },
            "precipitation": {
                "value": data.get("current", {}).get("precipitation"),
                "unit": data.get("current_units", {}).get("precipitation", "mm")
            },
            "wind": {
                "speed": data.get("current", {}).get("wind_speed_10m"),
                "gusts": data.get("current", {}).get("wind_gusts_10m"),
                "direction": data.get("current", {}).get("wind_direction_10m"),
                "unit": data.get("current_units", {}).get("wind_speed_10m", "km/h")
            },
            "cloud_cover": {
                "value": data.get("current", {}).get("cloud_cover"),
                "unit": data.get("current_units", {}).get("cloud_cover", "%")
            }
        },
        "hourly_forecast": {}
    }

    # Process hourly data - combine related data into objects for easier frontend parsing
    hourly = data.get("hourly", {})
    times = hourly.get("time", [])
    processed_hourly = []

    for i in range(len(times)):
        hour_data = {
            "time": times[i],
            "temperature": hourly.get("temperature_2m", [])[i] if "temperature_2m" in hourly and i < len(hourly["temperature_2m"]) else None,
            "rain": hourly.get("rain", [])[i] if "rain" in hourly and i < len(hourly["rain"]) else None,
            "cloud_cover": hourly.get("cloud_cover", [])[i] if "cloud_cover" in hourly and i < len(hourly["cloud_cover"]) else None,
            "visibility": hourly.get("visibility", [])[i] if "visibility" in hourly and i < len(hourly["visibility"]) else None,
            "wind": {
                "speed": hourly.get("wind_speed_10m", [])[i] if "wind_speed_10m" in hourly and i < len(hourly["wind_speed_10m"]) else None,
                "direction": hourly.get("wind_direction_10m", [])[i] if "wind_direction_10m" in hourly and i < len(hourly["wind_direction_10m"]) else None,
                "gusts": hourly.get("wind_gusts_10m", [])[i] if "wind_gusts_10m" in hourly and i < len(hourly["wind_gusts_10m"]) else None
            }
        }
        processed_hourly.append(hour_data)

    processed_data["hourly_forecast"] = processed_hourly

    # Process daily data
    daily = data.get("daily", {})
    if daily:
        times = daily.get("time", [])
        processed_daily = []

        for i in range(len(times)):
            day_data = {
                "date": times[i],
                "temperature": {
                    "max": daily.get("temperature_2m_max", [])[i] if "temperature_2m_max" in daily and i < len(daily["temperature_2m_max"]) else None,
                    "min": daily.get("temperature_2m_min", [])[i] if "temperature_2m_min" in daily and i < len(daily["temperature_2m_min"]) else None
                },
                "sun": {
                    "sunrise": daily.get("sunrise", [])[i] if "sunrise" in daily and i < len(daily["sunrise"]) else None,
                    "sunset": daily.get("sunset", [])[i] if "sunset" in daily and i < len(daily["sunset"]) else None,
                    "daylight_duration": daily.get("daylight_duration", [])[i] if "daylight_duration" in daily and i < len(daily["daylight_duration"]) else None
                },
                "uv_index_max": daily.get("uv_index_max", [])[i] if "uv_index_max" in daily and i < len(daily["uv_index_max"]) else None,
                "precipitation_sum": daily.get("precipitation_sum", [])[i] if "precipitation_sum" in daily and i < len(daily["precipitation_sum"]) else None
            }
            processed_daily.append(day_data)

        processed_data["daily_forecast"] = processed_daily

    return processed_data

def ensure_directories():
    """Ensure all required directories exist"""
    os.makedirs("data", exist_ok=True)
    os.makedirs("data/archive", exist_ok=True)

def copy_to_frontend_public_dir(filename):
    """Copy processed file to frontend public directory"""
    if not os.path.exists(FRONTEND_PUBLIC_DIR):
        os.makedirs(FRONTEND_PUBLIC_DIR, exist_ok=True)
    shutil.copy(filename, os.path.join(FRONTEND_PUBLIC_DIR, os.path.basename(filename)))

def save_data(data, filename, is_processed=False):
    """Save data to JSON file"""
    # Ensure directories exist
    ensure_directories()



    # If this is processed data, also save to frontend directory
    if is_processed:
        processed_filename = f"data/processed_{filename}"
        with open(processed_filename, "w") as f:
            json.dump(data, f, indent=2)
        print(f"Processed data saved to directory as processed_{filename}")

        # Copy to frontend public directory
        copy_to_frontend_public_dir(processed_filename)
    else:
        # Save as raw
        with open(f"data/raw_{filename}", "w") as f:
            json.dump(data, f, indent=2)

def main():
    try:
        # Fetch Open-Meteo data
        print("Fetching weather data from Open-Meteo...")
        open_meteo_data = fetch_open_meteo_data()

        if open_meteo_data:
            # Save raw data
            save_data(open_meteo_data, "open_meteo.json")
            print("Raw Open-Meteo data saved.")

            # Process data for frontend
            print("Processing Open-Meteo data for frontend...")
            processed_open_meteo = process_data_for_frontend(open_meteo_data)

            # Save processed data for frontend
            save_data(processed_open_meteo, "open_meteo.json", is_processed=True)
            print("Open-Meteo data processing complete.")
        else:
            print("Failed to fetch Open-Meteo data.")

        # Fetch Geosphere data
        print("Fetching weather data from Geosphere...")
        geosphere_data = fetch_geosphere_data()

        if geosphere_data:
            # Save raw data
            save_data(geosphere_data, "geosphere.json")
            print("Raw Geosphere data saved.")

            # Process data for frontend
            print("Processing Geosphere data for frontend...")
            processed_geosphere = process_geosphere_data(geosphere_data)

            # Save processed data for frontend
            save_data(processed_geosphere, "geosphere.json", is_processed=True)
            print("Geosphere data processing complete.")
        else:
            print("Failed to fetch Geosphere data.")

        # Save metadata about this update
        metadata = {
            "last_update": datetime.now(TIMEZONE_CEST).isoformat(),
            "sources": [],
            "status": "success"
        }

        if open_meteo_data:
            metadata["sources"].append({
                "name": "Open-Meteo API",
                "status": "success"
            })
        else:
            metadata["sources"].append({
                "name": "Open-Meteo API",
                "status": "error"
            })

        if geosphere_data:
            metadata["sources"].append({
                "name": "Geosphere API",
                "status": "success"
            })
        else:
            metadata["sources"].append({
                "name": "Geosphere API",
                "status": "error"
            })

        save_data(metadata, "metadata.json", is_processed=True)

        print("All weather data processing complete.")

    except Exception as e:
        print(f"Error in weather data processing: {e}")
        # Save error metadata
        metadata = {
            "last_update": datetime.now(TIMEZONE_CEST).isoformat(),
            "sources": [
                {"name": "Open-Meteo API", "status": "unknown"},
                {"name": "Geosphere API", "status": "unknown"}
            ],
            "status": "error",
            "error_message": str(e)
        }
        save_data(metadata, "metadata.json")

if __name__ == "__main__":
    main()


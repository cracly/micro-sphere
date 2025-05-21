import os
import json
import requests
from datetime import datetime

# Configuration
OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"
OPEN_METEO_API_URL = "https://api.open-meteo.com/v1/forecast?latitude=48.133&longitude=16.4366&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset,daylight_duration,uv_index_max,precipitation_sum&hourly=temperature_2m,rain,cloud_cover,visibility,wind_speed_10m,wind_direction_10m,wind_gusts_10m&models=best_match&current=temperature_2m,apparent_temperature,rain,showers,precipitation,cloud_cover,wind_speed_10m,wind_gusts_10m,wind_direction_10m&timezone=auto&past_days=2"

def fetch_open_meteo_data():
    """Fetch data from Open-Meteo API"""
    try:
        response = requests.get(OPEN_METEO_API_URL)
        response.raise_for_status()  # Raise exception for HTTP errors
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching data from Open-Meteo: {e}")
        return None

def process_data_for_frontend(data):
    """Process and simplify the data for frontend consumption"""
    if not data:
        return None

    # Extract only the data we need for frontend
    processed_data = {
        "last_updated": datetime.now().isoformat(),
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


def save_data(data, filename, is_processed=False):
    """Save data to JSON file"""
    # Ensure directories exist
    ensure_directories()

    # Get current timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M")

    # Save to archive
    with open(f"data/archive/{timestamp}_{filename}", "w") as f:
        json.dump(data, f, indent=2)

    # Save as latest
    with open(f"data/latest_{filename}", "w") as f:
        json.dump(data, f, indent=2)

    # If this is processed data, also save to frontend directory
    if is_processed:
        with open(f"data/processed_{filename}", "w") as f:
            json.dump(data, f, indent=2)
        print(f"Processed data saved to directory as processed_{filename}")

def main():
    try:
        # Fetch Open-Meteo data
        print("Fetching weather data from Open-Meteo...")
        open_meteo_data = fetch_open_meteo_data()

        if not open_meteo_data:
            print("Failed to fetch weather data. Exiting.")
            return

        # Save raw data
        save_data(open_meteo_data, "open_meteo.json")
        print("Raw weather data saved.")

        # Process data for frontend
        print("Processing data for frontend...")
        processed_data = process_data_for_frontend(open_meteo_data)

        # Save processed data for frontend
        save_data(processed_data, "weather.json", is_processed=True)

        # Save metadata about this update
        metadata = {
            "last_update": datetime.now().isoformat(),
            "source": "Open-Meteo API",
            "status": "success"
        }
        save_data(metadata, "metadata.json", is_processed=True)

        print("Weather data processing complete.")

    except Exception as e:
        print(f"Error in weather data processing: {e}")
        # Save error metadata
        metadata = {
            "last_update": datetime.now().isoformat(),
            "source": "Open-Meteo API",
            "status": "error",
            "error_message": str(e)
        }
        save_data(metadata, "metadata.json")

if __name__ == "__main__":
    main()


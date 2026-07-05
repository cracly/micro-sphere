"""Generate an AI weather briefing for Kledering with Mistral.

Fetches a one-day, high-resolution forecast from Open-Meteo, asks Mistral for
a concise HTML briefing focused on outdoor-activity windows, translates it to
German, and saves both languages for the frontend.

The API key is read from the MISTRAL_API_KEY environment variable.
"""

from __future__ import annotations

import json
import os
import sys
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import requests
from mistralai import Mistral

LOCAL_TZ = ZoneInfo("Europe/Vienna")
MISTRAL_MODEL = os.environ.get("MISTRAL_MODEL", "mistral-small-latest")
REQUEST_TIMEOUT = 30

BACKEND_DIR = Path(__file__).resolve().parent
WEATHER_SNAPSHOT_PATH = BACKEND_DIR / "data" / "today_weather.json"
ANALYSIS_PATH = (
    BACKEND_DIR.parent / "frontend" / "public" / "backend" / "data" / "weather_analysis.json"
)

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"
OPEN_METEO_PARAMS = {
    "latitude": 48.133029,
    "longitude": 16.4277403,
    "timezone": "Europe/Vienna",
    "forecast_days": 1,
    "models": "best_match",
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
        "sunshine_duration",
        "wind_speed_10m",
        "wind_direction_10m",
        "wind_gusts_10m",
    ]),
}

ANALYSIS_PROMPT = """Generate a concise yet technical daily weather report based on the following forecast data for Kledering (Vienna, Austria):

{weather_summary}

Guidelines:

    Weather analysis:
        Provide a brief but technical analysis of the day.
        Highlight any unusual or noteworthy conditions; on a typical day keep it short.

    Outdoor activity suggestion:
        Suggest suitable time windows for running or biking.
        Prefer morning (7-9 AM) or afternoon/evening (4-8 PM) windows on weekdays.
        If the weather is unsuitable for outdoor sport, say so clearly.

    Formatting:
        Respond with embeddable HTML only (headings, paragraphs, lists, bold where useful).
        No page-level headings like "Weather Report" - the report is embedded under its own title.
        No markdown, no explanations outside the HTML.
"""

TRANSLATION_PROMPT = """Translate the following English weather report to German.
Keep every HTML tag and attribute exactly as it is; translate only the text content.
Do not change numbers, units or special characters like °C.
Respond with the HTML only.

{html}
"""


def get_api_key() -> str:
    api_key = os.environ.get("MISTRAL_API_KEY")
    if not api_key and os.isatty(0):
        import getpass
        api_key = getpass.getpass("Mistral API key: ")
    if not api_key:
        raise SystemExit("MISTRAL_API_KEY environment variable is not set")
    return api_key


def fetch_weather_data() -> dict:
    response = requests.get(OPEN_METEO_URL, params=OPEN_METEO_PARAMS, timeout=REQUEST_TIMEOUT)
    response.raise_for_status()
    return response.json()


def summarize_weather(data: dict) -> str:
    """Condense the hourly forecast into a compact text block for the LLM."""
    hourly = data["hourly"]
    date = hourly["time"][0].split("T")[0]

    def avg(values):
        return sum(values) / len(values)

    header = (
        f"Forecast for {date} | {data['latitude']}, {data['longitude']} | {data['timezone']}\n"
        f"Temperature: {min(hourly['temperature_2m'])} to {max(hourly['temperature_2m'])} °C\n"
        f"Wind: avg {avg(hourly['wind_speed_10m']):.1f} km/h, max {max(hourly['wind_speed_10m'])} km/h, "
        f"gusts up to {max(hourly['wind_gusts_10m'])} km/h\n"
        f"Precipitation: total {sum(hourly['precipitation']):.1f} mm, "
        f"max probability {max(hourly['precipitation_probability'])}%\n"
        f"Humidity: avg {avg(hourly['relative_humidity_2m']):.0f}%\n"
        f"UV index: max {max(hourly['uv_index'])}\n"
        f"Sunshine: {sum(hourly['sunshine_duration']) / 3600:.1f} h total\n"
        f"Visibility: avg {avg(hourly['visibility']) / 1000:.1f} km\n"
        f"WMO weather codes present: {sorted(set(hourly['weather_code']))}\n\n"
        "Hour | Temp °C | Feels °C | Wind km/h | Gusts | UV | Rain % | Rain mm | Cloud % | Code\n"
    )

    lines = []
    for i, timestamp in enumerate(hourly["time"]):
        lines.append(
            f"{timestamp.split('T')[1]} | {hourly['temperature_2m'][i]} | "
            f"{hourly['apparent_temperature'][i]} | {hourly['wind_speed_10m'][i]} | "
            f"{hourly['wind_gusts_10m'][i]} | {hourly['uv_index'][i]} | "
            f"{hourly['precipitation_probability'][i]}% | {hourly['precipitation'][i]} | "
            f"{hourly['cloud_cover'][i]}% | {hourly['weather_code'][i]}"
        )
    return header + "\n".join(lines)


def strip_code_fences(content: str) -> str:
    content = content.strip()
    if content.startswith("```"):
        content = content.split("\n", 1)[1] if "\n" in content else ""
    if content.endswith("```"):
        content = content[:-3]
    return content.strip()


def complete(client: Mistral, prompt: str) -> str:
    response = client.chat.complete(
        model=MISTRAL_MODEL,
        messages=[{"role": "user", "content": prompt}],
    )
    return strip_code_fences(response.choices[0].message.content)


def save_json(data: dict, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"wrote {path}")


def main() -> int:
    client = Mistral(api_key=get_api_key())

    print("Fetching weather data...")
    weather_data = fetch_weather_data()
    save_json(weather_data, WEATHER_SNAPSHOT_PATH)

    print("Generating analysis...")
    english = complete(client, ANALYSIS_PROMPT.format(weather_summary=summarize_weather(weather_data)))

    print("Translating to German...")
    german = complete(client, TRANSLATION_PROMPT.format(html=english))

    save_json(
        {
            "timestamp": datetime.now(LOCAL_TZ).isoformat(),
            "model": MISTRAL_MODEL,
            "english": english,
            "german": german,
        },
        ANALYSIS_PATH,
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())

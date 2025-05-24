import os
import json
import requests
from datetime import datetime
from mistralai import Mistral
from typing import Dict, Any, Optional, Tuple

# Import configuration if available
try:
    import config
except ImportError:
    # Create a minimal config if not found
    class config:
        MISTRAL_API_KEY = None
        MISTRAL_MODEL = "mistral-small-latest"

# Open-Meteo API URL for Vienna
OPEN_METEO_API_URL = "https://api.open-meteo.com/v1/forecast?latitude=48.1327459&longitude=16.4342418&hourly=temperature_2m,cloud_cover,visibility,wind_speed_10m,wind_direction_10m,wind_gusts_10m,precipitation_probability,uv_index,relative_humidity_2m,apparent_temperature,precipitation,weather_code,sunshine_duration&models=best_match&minutely_15=temperature_2m,apparent_temperature,precipitation,sunshine_duration,wind_speed_10m,weather_code,wind_gusts_10m,visibility,cape,lightning_potential,is_day&timezone=auto&forecast_days=1"

def get_api_key() -> str:
    """Get Mistral API key from environment or config."""
    api_key = os.environ.get("MISTRAL_API_KEY") or getattr(config, "MISTRAL_API_KEY", None)

    if not api_key and os.isatty(0):  # Check if running in interactive terminal
        import getpass
        print("Mistral API key not found in environment or config file.")
        api_key = getpass.getpass("Please enter your Mistral API key: ")

    if not api_key:
        raise ValueError("Mistral API key not found. Set it in environment variable MISTRAL_API_KEY or in config.py")

    return api_key

def fetch_weather_data() -> Optional[Dict[str, Any]]:
    """Fetch weather data from Open-Meteo API."""
    try:
        print("Fetching weather data from Open-Meteo API...")
        response = requests.get(OPEN_METEO_API_URL)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error fetching weather data: {e}")
        return None

def save_json_file(data: Dict[str, Any], path: str) -> bool:
    """Save data to a JSON file."""
    try:
        # Check if path is empty or None
        if not path:
            print("Error: Empty file path provided")
            return False

        # Ensure directory exists if path contains directories
        directory = os.path.dirname(path)
        if directory:  # Only create directories if path has a directory component
            os.makedirs(directory, exist_ok=True)

        # Save the file
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
        print(f"Data successfully saved to {path}")
        return True
    except Exception as e:
        print(f"Error saving file {path}: {e}")
        return False

def load_json_file(path: str) -> Optional[Dict[str, Any]]:
    """Load data from a JSON file."""
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading file {path}: {e}")
        return None

class WeatherAnalyzer:
    def __init__(self, api_key: str = None, model: str = None):
        """Initialize the weather analyzer with Mistral API credentials."""
        self.api_key = api_key or get_api_key()
        self.model = model or getattr(config, "MISTRAL_MODEL", "mistral-small-latest")
        self.client = Mistral(api_key=self.api_key)

    def prepare_weather_summary(self, weather_data: Dict[str, Any]) -> str:
        """Prepare a structured summary of weather data for the LLM."""
        # Extract key information
        location = f"Location: {weather_data['latitude']}, {weather_data['longitude']}"
        timezone = f"Timezone: {weather_data['timezone']}"
        date = weather_data['hourly']['time'][0].split('T')[0]
        hourly = weather_data['hourly']

        # Calculate key metrics
        temp_min, temp_max = min(hourly['temperature_2m']), max(hourly['temperature_2m'])
        wind_avg = sum(hourly['wind_speed_10m']) / len(hourly['wind_speed_10m'])
        wind_max = max(hourly['wind_speed_10m'])
        gusts_max = max(hourly['wind_gusts_10m'])
        uv_max = max(hourly['uv_index'])
        total_sunshine = sum(s for s in hourly['sunshine_duration'] if s > 0)
        total_precip = sum(hourly['precipitation'])
        max_precip_prob = max(hourly['precipitation_probability'])
        humidity_avg = sum(hourly['relative_humidity_2m']) / len(hourly['relative_humidity_2m'])
        visibility_avg = sum(hourly['visibility']) / len(hourly['visibility'])
        weather_codes = list(set(hourly['weather_code']))

        # Create summary
        summary = f"""Weather Forecast Analysis for {date}
{location} | {timezone}

TEMPERATURE:
- Range: {temp_min}°C to {temp_max}°C
- Hourly temperatures: {hourly['temperature_2m']}
- Apparent temperatures: {hourly['apparent_temperature']}

WIND CONDITIONS:
- Average wind speed: {wind_avg:.1f} km/h
- Maximum wind speed: {wind_max} km/h
- Maximum gusts: {gusts_max} km/h
- Wind directions: {hourly['wind_direction_10m']}
- Hourly wind speeds: {hourly['wind_speed_10m']}

PRECIPITATION & HUMIDITY:
- Total precipitation: {total_precip} mm
- Max precipitation probability: {max_precip_prob}%
- Average humidity: {humidity_avg:.1f}%
- Hourly precipitation: {hourly['precipitation']}

SUN & UV:
- Maximum UV index: {uv_max}
- Total sunshine duration: {total_sunshine/3600:.1f} hours
- Hourly UV index: {hourly['uv_index']}
- Hourly sunshine duration (seconds): {hourly['sunshine_duration']}

VISIBILITY & CLOUD COVER:
- Average visibility: {visibility_avg/1000:.1f} km
- Cloud cover by hour (%): {hourly['cloud_cover']}

WEATHER CODES:
- Present conditions (WMO codes): {weather_codes}

HOURLY TIMELINE:
Time | Temp | Wind | UV | Precip% | Cloud%
"""

        # Add hourly details
        for i, time in enumerate(hourly['time']):
            time_str = time.split('T')[1]
            summary += f"{time_str} | {hourly['temperature_2m'][i]}°C | {hourly['wind_speed_10m'][i]}km/h | {hourly['uv_index'][i]} | {hourly['precipitation_probability'][i]}% | {hourly['cloud_cover'][i]}%\n"

        return summary

    def analyze_weather(self, weather_data: Dict[str, Any]) -> str:
        """Analyze weather data using Mistral AI."""
        weather_summary = self.prepare_weather_summary(weather_data)

        prompt = f"""Generate a concise yet technical daily weather report based on the following  comprehensive weather forecast data for Kledering:

{weather_summary}

Guidelines for the Report:

    Weather Analysis:
        Provide a brief but technical analysis of the weather data.
        Highlight any unusual or special conditions observed in the data.

    Outdoor Activity Suggestion:
        Suggest suitable time windows for outdoor activities such as running or biking.
        Focus on morning (7-9 AM) or afternoon (4-8 PM) time windows on weekdays.
        Adapt suggestions for weekends and bad weather conditions.
        If the weather is not suitable for outdoor activities, clearly state that.

    Formatting:
        Format the report in HTML for easy embedding in a frontend.
        Ensure it has visually pleasing html and/or css formatting, including headings, paragraphs, and lists and bold text where appropriate.
        There's no need for general headings like "Weather Analysis" or "Report" as the report is embedded.
        NO MARKDOWN!


Further Instructions:
1. Include technical meteorological details that are noteworthy(if there are any)
2. Focus specifically on implications for outdoor sports activities
3. Analyze all relevant parameters (temperature, wind, UV, precipitation, visibility, etc.)
4. Identify weather patterns and transitions throughout the day
5. Only respond with the HTML content, do not include any additional text or explanations.
6. The report should not be too long, it should be concise but informative. It can be longer if there are special weather conditions, but if its a typical day it should be short.
"""

        try:
            print("Analyzing weather data with Mistral AI...")
            response = self.client.chat.complete(
                model=self.model,
                messages=[{"role": "user", "content": prompt}]
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"Error calling Mistral API: {str(e)}"

    def translate_to_german(self, english_content: str) -> str:
        """Translate English weather report to German while preserving HTML structure."""
        prompt = f"""Translate the following English weather report to German. 
Maintain all HTML tags and structure exactly as they are - do not modify any HTML elements or attributes.
Only translate the text content inside the HTML tags. Keep temperature values, metrics, and units unchanged.

Original English HTML content:
{english_content}

Instructions:
1. Preserve all HTML tags (<div>, <h1>, <p>, etc.) exactly as they appear
2. Translate only the English text to German
3. Do not change any numbers or measurements
4. Keep special characters like °C unchanged
5. Maintain the same level of technical vocabulary in German
6. Only respond with the HTML content, do not include any additional text or explanations.
"""

        try:
            print("Translating weather report to German...")
            response = self.client.chat.complete(
                model=self.model,
                messages=[{"role": "user", "content": prompt}]
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"Error translating to German: {str(e)}"

def run_weather_analysis(
    weather_path: str = "today_weather.json",
    analysis_path: str = "../frontend/public/backend/data/weather_analysis.json",
    api_key: str = None,
    model: str = None
) -> Tuple[str, Optional[str]]:
    """Run complete weather analysis workflow."""
    try:
        # 1. Get weather data
        weather_data = fetch_weather_data()
        if not weather_data:
            return "Failed to fetch weather data", None

        # 2. Save weather data
        save_json_file(weather_data, weather_path)

        # 3. Analyze with Mistral
        analyzer = WeatherAnalyzer(api_key, model)
        english_analysis = analyzer.analyze_weather(weather_data)

        # 4. Translate to German
        german_analysis = analyzer.translate_to_german(english_analysis)

        # 5. Save analysis for frontend
        analysis_data = {
            "timestamp": datetime.now().isoformat(),
            "english": english_analysis,
            "german": german_analysis
        }
        save_json_file(analysis_data, analysis_path)

        return english_analysis, analysis_path

    except Exception as e:
        return f"Error in analysis workflow: {str(e)}", None

def analyze_saved_weather_file(
    weather_path: str,
    analysis_path: str = "../frontend/public/backend/data/weather_analysis.json",
    api_key: str = None,
    model: str = None
) -> Tuple[str, Optional[str]]:
    """Analyze weather data from a previously saved file."""
    try:
        weather_data = load_json_file(weather_path)
        if not weather_data:
            return "Failed to load weather data", None

        analyzer = WeatherAnalyzer(api_key, model)
        english_analysis = analyzer.analyze_weather(weather_data)

        # Translate to German
        german_analysis = analyzer.translate_to_german(english_analysis)

        analysis_data = {
            "timestamp": datetime.now().isoformat(),
            "english": english_analysis,
            "german": german_analysis
        }
        save_json_file(analysis_data, analysis_path)

        return english_analysis, analysis_path

    except Exception as e:
        return f"Error analyzing from saved file: {str(e)}", None

if __name__ == "__main__":
    model = getattr(config, "MISTRAL_MODEL", "mistral-small-latest")

    print("=== Weather Analysis for Outdoor Activities ===")
    print("=" * 55)

    analysis, save_path = run_weather_analysis()

    print("\n📊 ANALYSIS RESULT:")
    print("-" * 50)
    print(analysis)
    print(f"\nAnalysis saved at: {save_path}")

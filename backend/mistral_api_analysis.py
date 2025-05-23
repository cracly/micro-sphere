import re

from mistralai import Mistral
import json
import requests
import os
from typing import Dict, Any, Tuple

# Open-Meteo API URL for your location (Vienna)
open_meteo_api_url = "https://api.open-meteo.com/v1/forecast?latitude=48.1327459&longitude=16.4342418&hourly=temperature_2m,cloud_cover,visibility,wind_speed_10m,wind_direction_10m,wind_gusts_10m,precipitation_probability,uv_index,relative_humidity_2m,apparent_temperature,precipitation,weather_code,sunshine_duration&models=best_match&minutely_15=temperature_2m,apparent_temperature,precipitation,sunshine_duration,wind_speed_10m,weather_code,wind_gusts_10m,visibility,cape,lightning_potential,is_day&timezone=auto&forecast_days=1"

def fetch_and_save_weather_data(save_path: str = "weather_data.json") -> Dict[str, Any]:
    """
    Fetch data from Open-Meteo API and save it to a JSON file.

    Args:
        save_path (str): Path where to save the weather data

    Returns:
        Dict[str, Any]: Weather data or None if error
    """
    try:
        print("Fetching weather data from Open-Meteo API...")
        response = requests.get(open_meteo_api_url)
        response.raise_for_status()  # Raise exception for HTTP errors

        weather_data = response.json()

        # Save to file
        with open(save_path, 'w', encoding='utf-8') as f:
            json.dump(weather_data, f, indent=2, ensure_ascii=False)

        print(f"Weather data saved to {save_path}")
        return weather_data

    except requests.exceptions.RequestException as e:
        print(f"Error fetching data from Open-Meteo: {e}")
        return None
    except json.JSONEncodeError as e:
        print(f"Error parsing JSON response: {e}")
        return None
    except Exception as e:
        print(f"Unexpected error: {e}")
        return None

class WeatherAnalyzer:
    def __init__(self, api_key: str, model: str = "mistral-small-latest"):
        """
        Initialize the weather analyzer with Mistral API key.

        Args:
            api_key (str): Your Mistral API key
            model (str): Mistral model to use
        """
        self.api_key = api_key
        self.model = model
        self.client = Mistral(api_key=api_key)

    def load_weather_data(self, file_path: str) -> Dict[str, Any]:
        """
        Load weather data from JSON file.

        Args:
            file_path (str): Path to the weather JSON file

        Returns:
            Dict[str, Any]: Parsed weather data
        """
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                return json.load(file)
        except FileNotFoundError:
            print(f"Error: File {file_path} not found")
            return None
        except json.JSONDecodeError as e:
            print(f"Error parsing JSON file: {e}")
            return None

    def prepare_weather_summary(self, weather_data: Dict[str, Any]) -> str:
        """
        Prepare a structured summary of weather data for the LLM.

        Args:
            weather_data (Dict[str, Any]): Raw weather data from Open-Meteo

        Returns:
            str: Formatted weather summary
        """
        # Extract key information
        location = f"Location: {weather_data['latitude']}, {weather_data['longitude']}"
        timezone = f"Timezone: {weather_data['timezone']}"
        date = weather_data['hourly']['time'][0].split('T')[0]

        # Hourly data analysis
        hourly = weather_data['hourly']

        # Temperature range
        temp_min = min(hourly['temperature_2m'])
        temp_max = max(hourly['temperature_2m'])

        # Wind analysis
        wind_avg = sum(hourly['wind_speed_10m']) / len(hourly['wind_speed_10m'])
        wind_max = max(hourly['wind_speed_10m'])
        gusts_max = max(hourly['wind_gusts_10m'])

        # UV and sunshine
        uv_max = max(hourly['uv_index'])
        total_sunshine = sum([s for s in hourly['sunshine_duration'] if s > 0])

        # Precipitation
        total_precip = sum(hourly['precipitation'])
        max_precip_prob = max(hourly['precipitation_probability'])

        # Humidity and visibility
        humidity_avg = sum(hourly['relative_humidity_2m']) / len(hourly['relative_humidity_2m'])
        visibility_avg = sum(hourly['visibility']) / len(hourly['visibility'])

        # Weather codes (simplified interpretation)
        weather_codes = set(hourly['weather_code'])

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
- Present conditions (WMO codes): {list(weather_codes)}

HOURLY TIMELINE:
Time | Temp | Wind | UV | Precip% | Cloud%
"""

        for i in range(len(hourly['time'])):
            time_str = hourly['time'][i].split('T')[1]
            summary += f"{time_str} | {hourly['temperature_2m'][i]}°C | {hourly['wind_speed_10m'][i]}km/h | {hourly['uv_index'][i]} | {hourly['precipitation_probability'][i]}% | {hourly['cloud_cover'][i]}%\n"

        return summary

    def analyze_weather_with_mistral(self, weather_data: Dict[str, Any]) -> str:
        """
        Send weather data to Mistral API for analysis using the official client.

        Args:
            weather_data (Dict[str, Any]): Weather data to analyze

        Returns:
            str: Analysis response from Mistral
        """
        weather_summary = self.prepare_weather_summary(weather_data)

        prompt = f"""You are a weather analyst specializing in outdoor sports activities. 
Analyze the following comprehensive weather forecast data and provide a detailed summary of how the day will be.

{weather_summary}

Instructions:
1. Provide a comprehensive analysis of the weather conditions
2. Include technical meteorological details that are noteworthy
3. Focus specifically on implications for outdoor sports activities
4. Analyze all relevant parameters (temperature, wind, UV, precipitation, visibility, etc.)
5. Identify weather patterns and transitions throughout the day
6. ALWAYS conclude with one sentence identifying the best time window for outdoor activities

FORMAT YOUR RESPONSE IN HTML:
- Use <h2> and <h3> tags for main sections
- Use <strong> tags for important values and highlights
- Use <ul> and <li> tags for lists
- Use <p> tags for paragraphs
- Keep your formatting clean and accessible

Your response should be informative but accessible, mentioning specific values and technical aspects while explaining their practical implications for outdoor activities."""

        try:
            print("Analyzing weather data with Mistral AI...")
            chat_response = self.client.chat.complete(
                model=self.model,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )
            return chat_response.choices[0].message.content

        except Exception as e:
            return f"Error calling Mistral API: {str(e)}"

    def save_analysis_for_frontend(self, analysis: str, save_path: str = "../frontend/public/backend/data/weather_analysis.json") -> str:
        """
        Save the Mistral API analysis to a JSON file that can be accessed by the frontend.
        The analysis is expected to be in HTML format directly from Mistral API.

        Args:
            analysis (str): The analysis in HTML format from Mistral API
            save_path (str): Path where to save the analysis, relative to project root

        Returns:
            str: Path where the file was saved
        """
        try:
            # Create a JSON structure for the frontend
            analysis_data = {
                "timestamp": self._get_current_timestamp(),
                "analysis": analysis  # Use the HTML directly without preprocessing
            }

            # Ensure directory exists
            os.makedirs(os.path.dirname(save_path), exist_ok=True)

            # Save the JSON file
            with open(save_path, 'w') as f:
                json.dump(analysis_data, f, indent=2)

            return save_path
        except Exception as e:
            print(f"Error saving analysis for frontend: {str(e)}")
            return None

    def _get_current_timestamp(self) -> str:
        """Get current timestamp in ISO format"""
        from datetime import datetime
        return datetime.now().isoformat()

    def run_complete_analysis(self, weather_file_path: str = "weather_data.json",
                             save_analysis_path: str = "../frontend/public/backend/data/weather_analysis.json") -> Tuple[str, str]:
        """
        Complete workflow: fetch data, save it, and analyze with Mistral.

        Args:
            weather_file_path (str): Path to save/load weather data
            save_analysis_path (str): Path where to save analysis for frontend

        Returns:
            Tuple[str, str]: Weather analysis and path where it was saved
        """
        try:
            # Step 1: Fetch and save weather data
            weather_data = fetch_and_save_weather_data(weather_file_path)

            if weather_data is None:
                return "Failed to fetch weather data", None

            # Step 2: Analyze with Mistral
            analysis = self.analyze_weather_with_mistral(weather_data)

            # Step 3: Save analysis for frontend
            saved_path = self.save_analysis_for_frontend(analysis, save_analysis_path)

            return analysis, saved_path

        except Exception as e:
            return f"Error in complete analysis workflow: {str(e)}", None

    def analyze_from_saved_file(self, file_path: str,
                               save_analysis_path: str = "frontend/public/backend/data/weather_analysis.json") -> Tuple[str, str]:
        """
        Analyze weather data from a previously saved file.

        Args:
            file_path (str): Path to the weather JSON file
            save_analysis_path (str): Path where to save analysis for frontend

        Returns:
            Tuple[str, str]: Weather analysis and path where it was saved
        """
        try:
            weather_data = self.load_weather_data(file_path)
            if weather_data is None:
                return "Failed to load weather data from file", None

            analysis = self.analyze_weather_with_mistral(weather_data)

            # Save analysis for frontend
            saved_path = self.save_analysis_for_frontend(analysis, save_analysis_path)

            return analysis, saved_path
        except Exception as e:
            return f"Error analyzing from saved file: {str(e)}", None


def main():
    """Main function to demonstrate the complete workflow"""

    # Your Mistral API key
    mistral_api_key = "goMqejLgA0bhHF8KGZLGqsGTCPtiVT4J"  # Replace with your actual key
    model = "mistral-small-latest"

    # Initialize the weather analyzer
    analyzer = WeatherAnalyzer(mistral_api_key, model)

    print("=== Weather Analysis for Outdoor Activities ===")
    print("=" * 55)

    # Option 1: Complete workflow (fetch + analyze)
    print("\n🌤️  Running complete analysis (fetch + analyze)...")
    result, saved_path = analyzer.run_complete_analysis("today_weather.json")
    print("\n📊 ANALYSIS RESULT:")
    print("-" * 50)
    print(result)
    print(f"\nAnalysis saved at: {saved_path}")

    # Option 2: Analyze from existing file (if you already have the data)
    # print("\n🔄 Analyzing from existing file...")
    # result_from_file, saved_path_from_file = analyzer.analyze_from_saved_file("today_weather.json")
    # print(result_from_file)
    # print(f"\nAnalysis saved at: {saved_path_from_file}")


# Utility functions for direct use
def quick_weather_analysis(
    mistral_api_key: str,
    weather_save_path: str = "quick_weather.json",
    analysis_save_path: str = "frontend/public/backend/data/weather_analysis.json"
) -> Tuple[str, str]:
    """
    Quick function to fetch weather data and get analysis in one call.

    Args:
        mistral_api_key (str): Your Mistral API key
        weather_save_path (str): Where to save the weather data
        analysis_save_path (str): Where to save the analysis for frontend use

    Returns:
        Tuple[str, str]: Weather analysis text and the path where it was saved
    """
    analyzer = WeatherAnalyzer(mistral_api_key)
    analysis, saved_path = analyzer.run_complete_analysis(weather_save_path, analysis_save_path)
    return analysis, saved_path


if __name__ == "__main__":
    main()

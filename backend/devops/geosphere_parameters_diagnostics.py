#!/usr/bin/env python3
"""
Geosphere API Parameter Discovery Script
Tests which parameters are available for the nowcast-v1-15min-1km model
Rate limit: 150 requests per hour (24 seconds between requests to be safe)
"""

import requests
import time
import json
from datetime import datetime
from typing import List, Dict, Set

class GeosphereParameterTester:
    def __init__(self):
        self.base_url = "https://dataset.api.hub.geosphere.at/v1/timeseries/forecast/nowcast-v1-15min-1km"
        self.test_location = "48.133029,16.4277403"  # Vienna coordinates
        self.rate_limit_delay = 5  # 25 seconds between requests (safe margin)
        self.valid_params = set()
        self.invalid_params = set()
        self.tested_params = set()

    def test_parameter(self, param: str) -> bool:
        """Test if a single parameter is valid"""
        url = f"{self.base_url}?parameters={param}&lat_lon={self.test_location}"

        try:
            print(f"Testing parameter: {param}")
            response = requests.get(url, timeout=30)

            if response.status_code == 200:
                data = response.json()
                # Check if parameter data is actually returned
                if self._has_parameter_data(data, param):
                    print(f"✅ VALID: {param}")
                    self.valid_params.add(param)
                    return True
                else:
                    print(f"❌ INVALID: {param} (no data returned)")
                    self.invalid_params.add(param)
                    return False
            elif response.status_code == 422:
                # Validation error - likely invalid parameter
                print(f"❌ INVALID: {param} (validation error)")
                self.invalid_params.add(param)
                return False
            else:
                print(f"⚠️  ERROR: {param} - HTTP {response.status_code}")
                return False

        except requests.exceptions.RequestException as e:
            print(f"⚠️  ERROR: {param} - {str(e)}")
            return False
        finally:
            self.tested_params.add(param)

    def _has_parameter_data(self, data: dict, param: str) -> bool:
        """Check if the response contains actual data for the parameter"""
        try:
            if 'features' in data and len(data['features']) > 0:
                properties = data['features'][0].get('properties', {})
                parameters = properties.get('parameters', {})
                return param in parameters and parameters[param].get('data') is not None
            return False
        except (KeyError, IndexError, TypeError):
            return False

    def test_all_first_request(self) -> Set[str]:
        """Make initial request without parameter filter to see all available params"""
        url = f"{self.base_url}?lat_lon={self.test_location}"

        try:
            print("🔍 Making initial request to discover all parameters...")
            response = requests.get(url, timeout=30)

            if response.status_code == 200:
                data = response.json()
                if 'features' in data and len(data['features']) > 0:
                    properties = data['features'][0].get('properties', {})
                    parameters = properties.get('parameters', {})
                    discovered_params = set(parameters.keys())
                    print(f"📋 Discovered parameters from full request: {sorted(discovered_params)}")
                    return discovered_params
                else:
                    print("⚠️  No features found in response")
            else:
                print(f"⚠️  Initial request failed with status {response.status_code}")

        except requests.exceptions.RequestException as e:
            print(f"⚠️  Initial request error: {str(e)}")

        return set()

    def get_parameter_candidates(self) -> List[str]:
        """Get list of parameter candidates following the short code pattern (t2m, rr, td)"""
        # Known working parameters
        known_valid = ['t2m', 'rr', 'td']

        # Short meteorological parameter codes (2-3 characters)
        # Following the pattern observed: t2m, rr, td
        temperature_params = [
            't2m',  # 2m temperature (confirmed)
            'tt',   # temperature
            'tx',   # maximum temperature
            'tn',   # minimum temperature
            'ts',   # surface temperature
        ]

        precipitation_params = [
            'rr',   # precipitation sum (confirmed)
            'tp',   # total precipitation
            'pr',   # precipitation rate
            'rs',   # precipitation solid
            'rl',   # precipitation liquid
        ]

        dewpoint_params = [
            'td',   # dew point (confirmed)
            'd2m',  # 2m dew point
            'dp',   # dew point
        ]

        wind_params = [
            'ff',   # wind speed
            'dd',   # wind direction
            'fx',   # wind gust / maximum wind speed
            'u10',  # u-component 10m wind
            'v10',  # v-component 10m wind
            'ws',   # wind speed
            'wd',   # wind direction
            'wg',   # wind gust
        ]

        humidity_params = [
            'rh',   # relative humidity
            'rf',   # relative feuchte
            'hh',   # humidity
            'hu',   # humidity
        ]

        pressure_params = [
            'sp',   # surface pressure
            'pp',   # pressure
            'ps',   # surface pressure
            'pm',   # mean sea level pressure
            'sl',   # sea level pressure
            'msl',  # mean sea level
        ]

        cloud_params = [
            'cc',   # cloud cover
            'cl',   # clouds
            'n',    # cloud amount (German: Bewölkung)
            'nh',   # high clouds
            'nm',   # medium clouds
            'nl',   # low clouds
        ]

        visibility_params = [
            'vv',   # visibility
            'vis',  # visibility
            'si',   # sicht (German for visibility)
        ]

        radiation_params = [
            'gs',   # global solar radiation
            'sd',   # sunshine duration
            'uv',   # UV index
            'sw',   # shortwave radiation
            'lw',   # longwave radiation
        ]

        # Additional short weather codes
        other_params = [
            'sf',   # snowfall
            'sn',   # snow
            'hs',   # snow height
            'ev',   # evaporation
            'et',   # evapotranspiration
        ]

        all_candidates = (known_valid + temperature_params + precipitation_params +
                          dewpoint_params + wind_params + humidity_params +
                          pressure_params + cloud_params + visibility_params +
                          radiation_params + other_params)

        # Remove duplicates and filter to keep only short codes (2-4 chars)
        unique_candidates = list(set(all_candidates))
        short_codes = [param for param in unique_candidates if 2 <= len(param) <= 4]

        return sorted(short_codes)

    def run_discovery(self):
        """Run the parameter discovery process"""
        print("🚀 Starting Geosphere API Parameter Discovery")
        print(f"⏱️  Rate limit: {self.rate_limit_delay}s between requests")
        print(f"📍 Test location: {self.test_location}")
        print("=" * 60)

        # First, try to get all parameters in one request
        discovered_params = self.test_all_first_request()

        if discovered_params:
            print(f"\n✅ Found {len(discovered_params)} parameters from initial request!")
            for param in sorted(discovered_params):
                self.valid_params.add(param)
            self.print_results()
            return

        # If that didn't work, test individual parameters
        print("\n🔍 Initial discovery failed, testing individual parameters...")
        candidates = self.get_parameter_candidates()

        print(f"📝 Testing {len(candidates)} short parameter codes (2-4 characters)")
        print(f"🎯 Following pattern: t2m, rr, td (known valid)")
        print("⚠️  This will take approximately {:.1f} minutes".format(
            len(candidates) * self.rate_limit_delay / 60))

        for i, param in enumerate(candidates, 1):
            print(f"\n[{i}/{len(candidates)}] ", end="")
            self.test_parameter(param)

            # Rate limiting - wait between requests
            if i < len(candidates):  # Don't wait after the last request
                print(f"⏳ Waiting {self.rate_limit_delay}s for rate limit...")
                time.sleep(self.rate_limit_delay)

        self.print_results()

    def print_results(self):
        """Print the discovery results"""
        print("\n" + "=" * 60)
        print("📊 PARAMETER DISCOVERY RESULTS")
        print("=" * 60)

        print(f"\n✅ VALID PARAMETERS ({len(self.valid_params)}):")
        for param in sorted(self.valid_params):
            print(f"   • {param}")

        if self.invalid_params:
            print(f"\n❌ INVALID PARAMETERS ({len(self.invalid_params)}):")
            for param in sorted(self.invalid_params):
                print(f"   • {param}")

        print(f"\n📈 SUMMARY:")
        print(f"   • Total tested: {len(self.tested_params)}")
        print(f"   • Valid: {len(self.valid_params)}")
        print(f"   • Invalid: {len(self.invalid_params)}")

        # Save results to file
        results = {
            'timestamp': datetime.now().isoformat(),
            'model': 'nowcast-v1-15min-1km',
            'test_location': self.test_location,
            'valid_parameters': sorted(list(self.valid_params)),
            'invalid_parameters': sorted(list(self.invalid_params)),
            'summary': {
                'total_tested': len(self.tested_params),
                'valid_count': len(self.valid_params),
                'invalid_count': len(self.invalid_params)
            }
        }

        filename = f"geosphere_parameters_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(results, f, indent=2, ensure_ascii=False)
            print(f"💾 Results saved to: {filename}")
        except Exception as e:
            print(f"⚠️  Could not save results: {e}")

def main():
    """Main function"""
    tester = GeosphereParameterTester()

    try:
        tester.run_discovery()
    except KeyboardInterrupt:
        print("\n\n⏹️  Discovery interrupted by user")
        if tester.valid_params:
            tester.print_results()
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        if tester.valid_params:
            tester.print_results()

if __name__ == "__main__":
    main()
import type { Language } from './types';

// WMO 4677 weather interpretation codes as delivered by Open-Meteo.
// Icon keys are resolved to lucide icons in WeatherIcon.tsx.

export type WeatherIconKey =
  | 'clear'
  | 'partly-cloudy'
  | 'cloudy'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'freezing-rain'
  | 'snow'
  | 'showers'
  | 'snow-showers'
  | 'thunderstorm';

interface WeatherCodeInfo {
  en: string;
  de: string;
  icon: WeatherIconKey;
}

const WEATHER_CODES: Record<number, WeatherCodeInfo> = {
  0: { en: 'Clear sky', de: 'Klar', icon: 'clear' },
  1: { en: 'Mostly clear', de: 'Überwiegend klar', icon: 'clear' },
  2: { en: 'Partly cloudy', de: 'Teilweise bewölkt', icon: 'partly-cloudy' },
  3: { en: 'Overcast', de: 'Bedeckt', icon: 'cloudy' },
  45: { en: 'Fog', de: 'Nebel', icon: 'fog' },
  48: { en: 'Depositing rime fog', de: 'Reifnebel', icon: 'fog' },
  51: { en: 'Light drizzle', de: 'Leichter Nieselregen', icon: 'drizzle' },
  53: { en: 'Drizzle', de: 'Nieselregen', icon: 'drizzle' },
  55: { en: 'Dense drizzle', de: 'Starker Nieselregen', icon: 'drizzle' },
  56: { en: 'Freezing drizzle', de: 'Gefrierender Nieselregen', icon: 'freezing-rain' },
  57: { en: 'Dense freezing drizzle', de: 'Starker gefrierender Nieselregen', icon: 'freezing-rain' },
  61: { en: 'Light rain', de: 'Leichter Regen', icon: 'rain' },
  63: { en: 'Rain', de: 'Regen', icon: 'rain' },
  65: { en: 'Heavy rain', de: 'Starker Regen', icon: 'rain' },
  66: { en: 'Freezing rain', de: 'Gefrierender Regen', icon: 'freezing-rain' },
  67: { en: 'Heavy freezing rain', de: 'Starker gefrierender Regen', icon: 'freezing-rain' },
  71: { en: 'Light snowfall', de: 'Leichter Schneefall', icon: 'snow' },
  73: { en: 'Snowfall', de: 'Schneefall', icon: 'snow' },
  75: { en: 'Heavy snowfall', de: 'Starker Schneefall', icon: 'snow' },
  77: { en: 'Snow grains', de: 'Schneegriesel', icon: 'snow' },
  80: { en: 'Light rain showers', de: 'Leichte Regenschauer', icon: 'showers' },
  81: { en: 'Rain showers', de: 'Regenschauer', icon: 'showers' },
  82: { en: 'Violent rain showers', de: 'Heftige Regenschauer', icon: 'showers' },
  85: { en: 'Light snow showers', de: 'Leichte Schneeschauer', icon: 'snow-showers' },
  86: { en: 'Snow showers', de: 'Schneeschauer', icon: 'snow-showers' },
  95: { en: 'Thunderstorm', de: 'Gewitter', icon: 'thunderstorm' },
  96: { en: 'Thunderstorm with hail', de: 'Gewitter mit Hagel', icon: 'thunderstorm' },
  99: { en: 'Thunderstorm with heavy hail', de: 'Gewitter mit starkem Hagel', icon: 'thunderstorm' },
};

const UNKNOWN: WeatherCodeInfo = { en: '—', de: '—', icon: 'cloudy' };

export function weatherCodeLabel(code: number | null | undefined, language: Language): string {
  if (code === null || code === undefined) return UNKNOWN[language];
  return (WEATHER_CODES[code] ?? UNKNOWN)[language];
}

export function weatherCodeIcon(code: number | null | undefined): WeatherIconKey {
  if (code === null || code === undefined) return UNKNOWN.icon;
  return (WEATHER_CODES[code] ?? UNKNOWN).icon;
}

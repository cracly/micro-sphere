import type { CurrentWeather, HourlyEntry, WeatherData } from './types';
import { viennaNow } from './weather-utils';

// The data pipeline only lands every 15 minutes — and can lag for hours when a
// deploy fails. Instead of pinning the hero card to the last computed value,
// estimate "now" from the hourly forecast: linear interpolation for the
// continuous quantities, nearest hour for the discrete ones.

/** Minutes on a comparable scale for Vienna wall-time strings ("2026-07-05T14:00"). */
function wallMinutes(time: string): number {
  return (
    Date.UTC(
      Number(time.slice(0, 4)),
      Number(time.slice(5, 7)) - 1,
      Number(time.slice(8, 10)),
      Number(time.slice(11, 13)),
      Number(time.slice(14, 16)) || 0
    ) / 60000
  );
}

/** Consider the fetched current value authoritative for this long. */
const FRESH_MINUTES = 45;

function lerp(a: number | null, b: number | null, f: number): number | null {
  if (a === null) return b;
  if (b === null) return a;
  return a + (b - a) * f;
}

export interface LiveCurrent {
  current: CurrentWeather;
  /** true when the values come from the forecast rather than a recent observation */
  estimated: boolean;
}

export function deriveCurrent(weather: WeatherData, now = viennaNow()): LiveCurrent {
  const { current, hourly } = weather;
  const nowMin = wallMinutes(`${now.date}T${String(now.hour).padStart(2, '0')}:${String(now.minute).padStart(2, '0')}`);

  const age = current.time ? nowMin - wallMinutes(current.time) : Infinity;
  if (age <= FRESH_MINUTES) return { current, estimated: false };

  // Bracket "now" between two hourly entries.
  let before: HourlyEntry | undefined;
  let after: HourlyEntry | undefined;
  for (const entry of hourly) {
    const entryMin = wallMinutes(entry.time);
    if (entryMin <= nowMin) before = entry;
    if (entryMin >= nowMin) {
      after = entry;
      break;
    }
  }
  if (!before && !after) return { current, estimated: false };
  before = before ?? after!;
  after = after ?? before;

  const span = wallMinutes(after.time) - wallMinutes(before.time);
  const f = span > 0 ? (nowMin - wallMinutes(before.time)) / span : 0;
  const nearest = f < 0.5 ? before : after;

  return {
    estimated: true,
    current: {
      time: `${now.date}T${String(now.hour).padStart(2, '0')}:${String(now.minute).padStart(2, '0')}`,
      temperature: lerp(before.temperature, after.temperature, f),
      feels_like: lerp(before.feels_like, after.feels_like, f),
      humidity: lerp(before.humidity, after.humidity, f),
      pressure: lerp(before.pressure ?? null, after.pressure ?? null, f) ?? current.pressure,
      wind_speed: lerp(before.wind_speed, after.wind_speed, f),
      wind_gusts: lerp(before.wind_gusts, after.wind_gusts, f),
      cloud_cover: lerp(before.cloud_cover, after.cloud_cover, f),
      // Discrete / categorical values: take the nearest hour as-is.
      wind_direction: nearest.wind_direction,
      weather_code: nearest.weather_code,
      precipitation: nearest.precipitation,
      is_day: nearest.is_day,
    },
  };
}

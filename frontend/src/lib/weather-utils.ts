import type { Language } from './types';

// Open-Meteo delivers naive local wall-time strings ("2026-07-05T14:00",
// Europe/Vienna). Never feed those to `new Date()` for display — the browser
// would reinterpret them in the viewer's timezone. Slice the string instead.
// GeoSphere delivers real instants with a UTC offset; those are formatted
// through Intl with an explicit Europe/Vienna timezone.

const VIENNA_TZ = 'Europe/Vienna';

/** "2026-07-05T14:00" -> "14:00" */
export function wallClock(time: string): string {
  return time.slice(11, 16);
}

/** "2026-07-05T14:00" -> "2026-07-05" */
export function wallDate(time: string): string {
  return time.slice(0, 10);
}

/** "2026-07-05T14:00" -> 14 */
export function wallHour(time: string): number {
  return Number(time.slice(11, 13));
}

/** Format an ISO instant (with offset) as HH:MM in Vienna time. */
export function instantClock(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: VIENNA_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(iso));
}

/** Current date (YYYY-MM-DD) and hour/minute in Vienna, regardless of viewer timezone. */
export function viennaNow(): { date: string; hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: VIENNA_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    hour: Number(get('hour')),
    minute: Number(get('minute')),
  };
}

/** Weekday / date label for a plain YYYY-MM-DD string (timezone-safe via noon anchor). */
export function formatDay(
  date: string,
  language: Language,
  style: 'weekday' | 'weekday-short' | 'full' = 'weekday'
): string {
  const anchor = new Date(`${date}T12:00:00`);
  const locale = language === 'de' ? 'de-AT' : 'en-GB';
  if (style === 'weekday') return anchor.toLocaleDateString(locale, { weekday: 'long' });
  if (style === 'weekday-short')
    return anchor.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'numeric' });
  return anchor.toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatTemperature(value: number | null | undefined, digits = 0): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '--°';
  return `${value.toFixed(digits)}°`;
}

export function formatNumber(
  value: number | null | undefined,
  unit: string,
  digits = 0
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '--';
  return `${value.toFixed(digits)} ${unit}`;
}

const WIND_DIRECTIONS = [
  'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
  'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW',
] as const;

/** Compass point (16-wind) for a direction in degrees. */
export function windDirectionLabel(deg: number | null | undefined): string {
  if (deg === null || deg === undefined || Number.isNaN(deg)) return '--';
  return WIND_DIRECTIONS[Math.round(((deg % 360) + 360) % 360 / 22.5) % 16];
}

/** Seconds -> "15.9 h" */
export function formatHours(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || Number.isNaN(seconds)) return '--';
  return `${(seconds / 3600).toFixed(1)} h`;
}

/** UV index risk band (WHO scale). */
export function uvRiskLabel(uv: number | null | undefined, language: Language): string {
  if (uv === null || uv === undefined || Number.isNaN(uv)) return '--';
  const bands: Array<[number, string, string]> = [
    [3, 'low', 'niedrig'],
    [6, 'moderate', 'mittel'],
    [8, 'high', 'hoch'],
    [11, 'very high', 'sehr hoch'],
    [Infinity, 'extreme', 'extrem'],
  ];
  const band = bands.find(([max]) => uv < max)!;
  return language === 'de' ? band[2] : band[1];
}

/** Format a stored ISO timestamp (with offset) for the "last updated" line. */
export function formatUpdatedAt(iso: string, language: Language): string {
  return new Date(iso).toLocaleString(language === 'de' ? 'de-AT' : 'en-GB', {
    timeZone: VIENNA_TZ,
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
}

// Utility functions for weather formatting, ported from original JS
export function formatTemperature(temp?: number): string {
  if (temp === null || temp === undefined || isNaN(temp)) return '--°C';
  return `${Math.round(temp)}°C`;
}

export function formatPrecipitation(
  value?: number,
  unit: string = 'mm'
): string {
  if (value === null || value === undefined || isNaN(value)) return '--';
  return `${value} ${unit}`;
}

export function formatWind(
  speed?: number,
  direction?: number,
  unit: string = 'km/h'
): string {
  if (speed === null || speed === undefined || isNaN(speed)) return '--';
  return `${speed} ${unit}`;
}

export function getWindDirection(deg?: number): string {
  if (deg === null || deg === undefined || isNaN(deg)) return '--';
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round((deg % 360) / 45) % 8];
}

export function formatDate(
  date: string,
  type: 'full' | 'date' | 'day' | 'time'
): string {
  const d = new Date(date);

  // Define options for date formatting with CEST timezone
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Europe/Paris', // Paris uses CEST timezone
  };

  if (type === 'full') {
    options.dateStyle = 'full';
    options.timeStyle = 'medium';
    return new Intl.DateTimeFormat(undefined, options).format(d);
  }
  if (type === 'date') {
    options.dateStyle = 'medium';
    return new Intl.DateTimeFormat(undefined, options).format(d);
  }
  if (type === 'day') {
    options.weekday = 'long';
    return new Intl.DateTimeFormat(undefined, options).format(d);
  }
  if (type === 'time') {
    options.timeStyle = 'short';
    return new Intl.DateTimeFormat(undefined, options).format(d);
  }
  return d.toString();
}

export function getWeatherIcon(
  cloudCover?: number,
  precipitation?: number
): string {
  if (precipitation && precipitation > 1) return 'fas fa-cloud-rain';
  if (precipitation && precipitation > 0) return 'fas fa-cloud-sun-rain';
  if (cloudCover && cloudCover > 60) return 'fas fa-cloud';
  if (cloudCover && cloudCover > 20) return 'fas fa-cloud-sun';
  return 'fas fa-sun';
}

export function getVisibilityPercentage(visibility?: number): number {
  if (!visibility || isNaN(visibility)) return 0;
  return Math.min(100, Math.round((visibility / 10) * 100));
}

export function formatVisibility(visibility?: number): string {
  if (!visibility || isNaN(visibility)) return '--';
  return `${visibility} km`;
}

// Get current date (YYYY-MM-DD) and hour (0-23) in Vienna timezone
export function getViennaDateAndHour(): {
  viennaDate: string;
  viennaHour: number;
} {
  const viennaNow = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'Europe/Vienna' })
  );
  const viennaDate = viennaNow.toISOString().slice(0, 10);
  const viennaHour = viennaNow.getHours();
  return { viennaDate, viennaHour };
}

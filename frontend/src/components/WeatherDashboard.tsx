'use client';
import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Cloud, Sun, CloudRain, CloudLightning, Wind } from 'lucide-react';
import {
  formatTemperature,
  formatPrecipitation,
  formatWind,
  getWindDirection,
  formatDate,
  getWeatherIcon,
} from '@/lib/weather-utils';
import WeatherChart from './WeatherChart';

// Helper: get background type from weather
function getWeatherBackgroundType(
  weather: Record<string, unknown> | null | undefined
): 'rain' | 'sunny' | 'cloudy' | 'thunderstorm' | 'default' {
  if (!weather) return 'default';
  const precip = (weather.precipitation as { value?: number })?.value ?? 0;
  const cloud = (weather.cloud_cover as { value?: number })?.value ?? 0;
  if (precip > 10) return 'thunderstorm';
  if (precip > 1) return 'rain';
  if (cloud > 80) return 'cloudy';
  if (cloud < 30) return 'sunny';
  return 'default';
}

// AnimatedWeatherIcon component (stop-motion style)
const AnimatedWeatherIcon: React.FC<{ type: string; size?: number }> = ({
  type,
  size = 64,
}) => {
  switch (type) {
    case 'sunny':
      return <Sun size={size} stroke="#fbbf24" fill="#ffe066" />;
    case 'cloudy':
      return <Cloud size={size} stroke="#cbd5e1" fill="#cbd5e1" />;
    case 'rain':
      return <CloudRain size={size} stroke="#60a5fa" fill="#cbd5e1" />;
    case 'thunderstorm':
      return <CloudLightning size={size} stroke="#facc15" fill="#cbd5e1" />;
    case 'windy':
      return <Wind size={size} stroke="#38bdf8" />;
    default:
      return <Cloud size={size} stroke="#cbd5e1" fill="#cbd5e1" />;
  }
};

const translations = {
  en: {
    today: 'Today',
    detailedWeather: 'Detailed Weather Kledering',
    lastUpdated: 'Last updated',
    feelsLike: 'Feels like',
    precipitation: 'Precipitation',
    wind: 'Wind',
    gusts: 'Gusts',
    direction: 'Direction',
    cloudCover: 'Cloud Cover',
    hourly: 'Hourly',
    daily: 'Daily',
    simplify: 'Simplify',
    showGraph: 'Show Graph',
    dataProvided: 'Data provided by',
    now: 'Now',
  },
  de: {
    today: 'Heute',
    detailedWeather: 'Wetter Kledering im Detail',
    lastUpdated: 'Zuletzt aktualisiert',
    feelsLike: 'Gefühlt',
    precipitation: 'Niederschlag',
    wind: 'Wind',
    gusts: 'Böen',
    direction: 'Richtung',
    cloudCover: 'Bewölkung',
    hourly: 'Stündlich',
    daily: 'Täglich',
    simplify: 'Vereinfachen',
    showGraph: 'Diagramm anzeigen',
    dataProvided: 'Daten bereitgestellt von',
    now: 'Jetzt',
  },
};

interface WeatherData {
  location: { timezone?: string };
  last_updated: string;
  current_weather: Record<string, unknown>;
  hourly_forecast: Record<string, unknown>[];
  daily_forecast?: Record<string, unknown>[];
}

const WeatherDashboard: React.FC = () => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [forecastType, setForecastType] = useState<'hourly' | 'daily'>(
    'hourly'
  );
  const [darkMode, setDarkMode] = useState(false);
  const [simplify, setSimplify] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string>(() => {
    // Default to today in local time, formatted as 'YYYY-MM-DD'
    const now = new Date();
    return now.toISOString().slice(0, 10);
  });
  const [language, setLanguage] = useState<'en' | 'de'>('en');
  const t = translations[language];
  // Non-translated app name
  const APP_NAME = 'micro-sphere';

  useEffect(() => {
    fetch('/backend/data/latest_weather.json')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        return res.json();
      })
      .then(setWeatherData)
      .catch(() =>
        setError('Failed to load weather data. Please try again later.')
      );
  }, []);

  useEffect(() => {
    if (darkMode) document.body.classList.add('dark');
    else document.body.classList.remove('dark');
  }, [darkMode]);

  if (error) {
    return (
      <Card className="p-6 my-8 text-center bg-destructive/10 border-destructive text-destructive">
        {error}
      </Card>
    );
  }
  if (!weatherData) {
    return (
      <Card className="p-6 my-8 text-center">Loading weather data...</Card>
    );
  }

  const { last_updated, current_weather, hourly_forecast, daily_forecast } =
    weatherData;

  // Safely extract values from Record<string, unknown>
  const cloudCoverValue = (current_weather.cloud_cover as { value?: number })
    ?.value;
  const precipitationValue = (
    current_weather.precipitation as { value?: number }
  )?.value;
  const temperatureValue = (current_weather.temperature as { value?: number })
    ?.value;
  const feelsLikeValue = (
    current_weather.temperature as { feels_like?: number }
  )?.feels_like;
  const precipitationUnit = (current_weather.precipitation as { unit?: string })
    ?.unit;
  const wind = current_weather.wind as Record<string, unknown> | undefined;
  const windSpeed = wind?.speed as number | undefined;
  const windDirection = wind?.direction as number | undefined;
  const windUnit = wind?.unit as string | undefined;
  const windGusts = wind?.gusts as number | undefined;
  const cloudCoverUnit = (current_weather.cloud_cover as { unit?: string })
    ?.unit;

  const icon = getWeatherIcon(cloudCoverValue, precipitationValue);

  // Hardcode location name

  // Only use data from latest_weather.json
  // current_weather: temperature.value, temperature.feels_like, precipitation.value, precipitation.unit, wind.speed, wind.gusts, wind.direction, wind.unit, cloud_cover.value, cloud_cover.unit
  // hourly_forecast: time, temperature, rain, cloud_cover, visibility, wind.speed, wind.direction, wind.gusts

  const backgroundType = getWeatherBackgroundType(weatherData?.current_weather);

  // Get all unique days available in hourly_forecast
  const availableDays = Array.from(
    new Set(
      hourly_forecast
        .map((h) =>
          typeof h.time === 'string' ? h.time.slice(0, 10) : undefined
        )
        .filter((d): d is string => Boolean(d))
    )
  );
  const currentDayIdx = availableDays.indexOf(selectedDay);
  const canGoPrev = currentDayIdx > 0;
  const canGoNext = currentDayIdx < availableDays.length - 1;

  // Before rendering, compute a vertical gradient per day
  const dayGradients: Record<string, string> = {};
  availableDays.forEach((day) => {
    const stops: string[] = [];
    for (let h = 0; h < 24; h++) {
      const entry = hourly_forecast.find(
        (e) =>
          typeof e.time === 'string' &&
          e.time.startsWith(day) &&
          Number(e.time.slice(11, 13)) === h
      );
      // Extract values
      const rainVal = typeof entry?.rain === 'number' ? entry.rain : undefined;
      const cloudVal =
        entry?.cloud_cover && typeof entry.cloud_cover === 'object'
          ? (entry.cloud_cover as { value?: number }).value ?? 0
          : typeof entry?.cloud_cover === 'number'
          ? entry.cloud_cover
          : 0;
      // Determine mood and color
      const mood = getWeatherBackgroundType({
        precipitation: { value: rainVal ?? 0 },
        cloud_cover: { value: cloudVal },
      });
      let color = '#f8fafc';
      switch (mood) {
        case 'sunny':
          color = '#fde047';
          break;
        case 'cloudy':
          color = '#cbd5e1';
          break;
        case 'rain':
          color = '#60a5fa';
          break;
        case 'thunderstorm':
          color = '#374151';
          break;
        default:
          color = '#e5e7eb';
      }
      const pos = (h / 23) * 100;
      stops.push(`${color} ${pos}%`);
    }
    dayGradients[day] = `linear-gradient(to bottom, ${stops.join(', ')})`;
  });

  return (
    <div className="relative min-h-screen bg-neutral-50 dark:bg-neutral-900 transition-colors duration-500 overflow-hidden">
      <div className="relative z-10 max-w-4xl mx-auto py-8 px-2">
        <header className="flex flex-col items-center gap-2 py-4">
          <div className="flex justify-between w-full max-w-4xl mb-2">
            <div></div>
            <Button
              variant="outline"
              onClick={() => setLanguage((l) => (l === 'en' ? 'de' : 'en'))}
            >
              {language === 'en' ? '🇬🇧 English' : '🇦🇹 Deutsch'}
            </Button>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight drop-shadow-lg text-neutral-900 dark:text-neutral-100">
            {APP_NAME}
          </h1>
          <p className="text-xs text-gray">
            {t.lastUpdated}:{' '}
            {new Date(last_updated).toLocaleString(
              language === 'de' ? 'de-AT' : undefined
            )}
          </p>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" onClick={() => setDarkMode((d) => !d)}>
              {darkMode ? '☀️ Light' : '🌙 Dark'}
            </Button>
          </div>
        </header>
        <main className="space-y-8">
          {/* Current day headline */}
          <div className="text-center mb-2">
            <h2 className="text-xl font-semibold text-neutral-700 dark:text-neutral-200">
              {t.today} –{' '}
              {new Date().toLocaleDateString(
                language === 'de' ? 'de-AT' : undefined,
                {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                }
              )}
            </h2>
          </div>
          {/* Hero Card */}
          <Card className="p-8 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl bg-white/40 dark:bg-neutral-800/40 backdrop-blur-md border border-white/30 dark:border-neutral-700/40">
            <div className="flex flex-col items-center gap-2">
              <i className={`text-7xl ${icon}`}></i>
              <span className="flex items-center gap-3 text-5xl font-bold text-neutral-900 dark:text-neutral-100">
                {formatTemperature(temperatureValue)}
                <AnimatedWeatherIcon type={backgroundType} size={48} />
              </span>
              <span className="text-muted-foreground text-lg">
                {t.feelsLike} {formatTemperature(feelsLikeValue)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-base">
              <div>
                <span className="font-semibold">{t.precipitation}:</span>{' '}
                {formatPrecipitation(precipitationValue, precipitationUnit)}
              </div>
              <div>
                <span className="font-semibold">{t.wind}:</span>{' '}
                {formatWind(windSpeed, windDirection, windUnit)}
              </div>
              <div>
                <span className="font-semibold">{t.gusts}:</span>{' '}
                {windGusts || '--'} {windUnit || 'km/h'}
              </div>
              <div>
                <span className="font-semibold">{t.direction}:</span>{' '}
                {getWindDirection(windDirection)} ({windDirection ?? '--'}°)
              </div>
              <div>
                <span className="font-semibold">{t.cloudCover}:</span>{' '}
                {cloudCoverValue || '--'}
                {cloudCoverUnit || '%'}
              </div>
            </div>
          </Card>
        </main>
        {/* Weather Chart Section */}
        <section className="mt-8">
          <div className="flex justify-between items-center mb-2">
            <div className="flex gap-2">
              <Button
                variant={forecastType === 'hourly' ? 'default' : 'outline'}
                onClick={() => setForecastType('hourly')}
              >
                {t.hourly}
              </Button>
              <Button
                variant={forecastType === 'daily' ? 'default' : 'outline'}
                onClick={() => setForecastType('daily')}
              >
                {t.daily}
              </Button>
            </div>
            <Button variant="secondary" onClick={() => setSimplify((s) => !s)}>
              {simplify ? t.showGraph : t.simplify}
            </Button>
          </div>
          {/* Hourly date navigation */}
          {forecastType === 'hourly' && (
            <div className="flex items-center justify-center gap-2 mb-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={() =>
                  canGoPrev && setSelectedDay(availableDays[currentDayIdx - 1])
                }
                disabled={!canGoPrev}
                aria-label="Previous day"
              >
                &#8592;
              </Button>
              <span className="font-semibold text-base">
                {selectedDay &&
                  new Date(selectedDay).toLocaleDateString(
                    language === 'de' ? 'de-AT' : undefined,
                    {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    }
                  )}
              </span>
              <Button
                size="icon"
                variant="ghost"
                onClick={() =>
                  canGoNext && setSelectedDay(availableDays[currentDayIdx + 1])
                }
                disabled={!canGoNext}
                aria-label="Next day"
              >
                &#8594;
              </Button>
            </div>
          )}
          {simplify ? (
            <div className="flex gap-3 overflow-x-auto py-2">
              {(forecastType === 'hourly'
                ? hourly_forecast.filter(
                    (h) =>
                      typeof h.time === 'string' &&
                      h.time.startsWith(selectedDay)
                  )
                : daily_forecast || []
              ).map((item, idx) => (
                <Card
                  key={idx}
                  className="min-w-[120px] flex-shrink-0 p-3 flex flex-col items-center bg-white/80 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700"
                >
                  <div className="font-semibold text-base">
                    {forecastType === 'hourly'
                      ? formatDate(
                          typeof item.time === 'string' ? item.time : '',
                          'time'
                        )
                      : formatDate(
                          typeof item.date === 'string'
                            ? item.date
                            : typeof item.time === 'string'
                            ? item.time
                            : '',
                          'day'
                        )}
                  </div>
                  <div className="text-2xl font-bold">
                    {forecastType === 'hourly'
                      ? formatTemperature(
                          typeof item.temperature === 'number'
                            ? item.temperature
                            : item.temperature &&
                              typeof item.temperature === 'object' &&
                              'value' in item.temperature
                            ? (item.temperature as { value?: number }).value
                            : undefined
                        )
                      : formatTemperature(
                          item.temperature &&
                            typeof item.temperature === 'object' &&
                            'max' in item.temperature
                            ? (item.temperature as { max?: number }).max
                            : undefined
                        )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {item.rain !== undefined
                      ? `${item.rain} mm`
                      : item.precipitation_sum !== undefined
                      ? `${item.precipitation_sum} mm`
                      : ''}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {item.cloud_cover !== undefined
                      ? `${item.cloud_cover}% ${t.cloudCover.toLowerCase()}`
                      : ''}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <WeatherChart
              hourly={hourly_forecast}
              daily={daily_forecast}
              type={forecastType}
              selectedDay={forecastType === 'hourly' ? selectedDay : undefined}
            />
          )}
        </section>
        {/* Super Detailed Overview Section */}
        <section className="mt-12">
          <h3 className="text-lg font-bold mb-4 text-neutral-800 dark:text-neutral-100 text-center">
            {APP_NAME} – Super Detailed Overview
          </h3>
          <div className="overflow-x-auto">
            <div
              className="grid"
              style={{
                gridTemplateColumns: `80px repeat(${availableDays.length}, minmax(80px, 1fr))`,
                borderRadius: '1rem',
                boxShadow: '0 2px 16px 0 rgba(0,0,0,0.08)',
                overflow: 'hidden',
                background: 'var(--table-bg, #f8fafc)',
              }}
            >
              {/* Header Row */}
              <div className="sticky left-0 z-10 bg-neutral-100 dark:bg-neutral-800 font-semibold flex items-center justify-center p-2 border-b border-r rounded-tl-xl">
                Hour
              </div>
              {availableDays.map((day, dayIdx) => (
                <div
                  key={day}
                  className="p-2 border-b bg-neutral-100 dark:bg-neutral-800 font-semibold text-center"
                  style={{
                    borderRight:
                      dayIdx === availableDays.length - 1
                        ? undefined
                        : '1px solid #e5e7eb',
                  }}
                >
                  {new Date(day).toLocaleDateString(
                    language === 'de' ? 'de-AT' : undefined,
                    {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    }
                  )}
                </div>
              ))}
              {/* Data Rows */}
              {Array.from({ length: 24 }).map((_, hourIdx) => [
                <div
                  key={`hour-${hourIdx}`}
                  className="sticky left-0 z-10 bg-neutral-50 dark:bg-neutral-900 font-semibold flex items-center justify-center p-2 border-r border-b"
                  style={{
                    borderBottomLeftRadius: hourIdx === 23 ? '1rem' : undefined,
                  }}
                >
                  {hourIdx.toString().padStart(2, '0')}:00
                </div>,
                ...availableDays.map((day, dayIdx) => {
                  // Extract this hour’s entry to display data
                  const entry = hourly_forecast.find(
                    (e) =>
                      typeof e.time === 'string' &&
                      e.time.startsWith(day) &&
                      Number(e.time.slice(11, 13)) === hourIdx
                  );
                  // Entry values
                  let entryTemp: number | undefined;
                  if (typeof entry?.temperature === 'number')
                    entryTemp = entry.temperature;
                  else if (
                    entry?.temperature &&
                    typeof entry.temperature === 'object' &&
                    'value' in entry.temperature
                  )
                    entryTemp = (entry.temperature as { value?: number }).value;
                  let entryRain: number | undefined;
                  if (typeof entry?.rain === 'number') entryRain = entry.rain;
                  let entryHumidity: number | undefined;
                  if (
                    entry?.humidity &&
                    typeof entry.humidity === 'object' &&
                    'value' in entry.humidity
                  )
                    entryHumidity = (entry.humidity as { value?: number })
                      .value;
                  return (
                    <div
                      key={day + hourIdx}
                      className="group relative flex items-center justify-center p-2 border-b border-r min-h-[56px] transition-transform duration-200 hover:scale-105 hover:shadow-lg hover:z-20 cursor-pointer"
                      style={{
                        backgroundImage: dayGradients[day],
                        backgroundSize: '100% 2400%',
                        backgroundPosition: `0 ${(hourIdx / 23) * 100}%`,
                        backgroundRepeat: 'no-repeat',
                      }}
                      title={`${day} ${hourIdx}:00`}
                    >
                      {/* Display actual data */}
                      <div className="flex flex-col items-center gap-1">
                        <div className="font-bold text-neutral-800 dark:text-neutral-900">
                          {entryTemp !== undefined
                            ? Math.round(entryTemp) + '°'
                            : '--'}
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-300">
                          {entryRain !== undefined ? entryRain + ' mm' : ''}
                        </div>
                        <div className="text-xs text-gray-500">
                          {entryHumidity !== undefined
                            ? entryHumidity + '%'
                            : ''}
                        </div>
                      </div>
                      {/* Hover overlay with full details */}
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full p-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl hidden group-hover:block w-64 z-30">
                        <h4 className="font-semibold mb-2">
                          Details @ {day} {hourIdx.toString().padStart(2, '0')}
                          :00
                        </h4>
                        <pre className="text-xs whitespace-pre-wrap">
                          {JSON.stringify(entry, null, 2)}
                        </pre>
                      </div>
                    </div>
                  );
                }),
              ])}
            </div>
          </div>
        </section>
        <footer className="text-center text-xs text-muted-foreground py-4">
          {t.dataProvided}{' '}
          <a
            href="https://open-meteo.com/"
            className="underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open-Meteo
          </a>
        </footer>
      </div>
    </div>
  );
};

export default WeatherDashboard;

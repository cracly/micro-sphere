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

  const {
    last_updated,
    current_weather,
    hourly_forecast,
    daily_forecast,
  } = weatherData;

  // Safely extract values from Record<string, unknown>
  const cloudCoverValue = (current_weather.cloud_cover as { value?: number })?.value;
  const precipitationValue = (current_weather.precipitation as { value?: number })?.value;
  const temperatureValue = (current_weather.temperature as { value?: number })?.value;
  const feelsLikeValue = (current_weather.temperature as { feels_like?: number })?.feels_like;
  const precipitationUnit = (current_weather.precipitation as { unit?: string })?.unit;
  const wind = current_weather.wind as Record<string, unknown> | undefined;
  const windSpeed = wind?.speed as number | undefined;
  const windDirection = wind?.direction as number | undefined;
  const windUnit = wind?.unit as string | undefined;
  const windGusts = wind?.gusts as number | undefined;
  const cloudCoverUnit = (current_weather.cloud_cover as { unit?: string })?.unit;

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
        .map((h) => typeof h.time === 'string' ? h.time.slice(0, 10) : undefined)
        .filter((d): d is string => Boolean(d))
    )
  );
  const currentDayIdx = availableDays.indexOf(selectedDay);
  const canGoPrev = currentDayIdx > 0;
  const canGoNext = currentDayIdx < availableDays.length - 1;

  return (
    <div className="relative min-h-screen bg-neutral-50 dark:bg-neutral-900 transition-colors duration-500 overflow-hidden">
      <div className="relative z-10 max-w-4xl mx-auto py-8 px-2">
        <header className="flex flex-col items-center gap-2 py-4">
          <h1 className="text-4xl font-extrabold tracking-tight drop-shadow-lg text-neutral-900 dark:text-neutral-100">
            Detailed Weather Kledering
          </h1>
          <p className="text-xs text-gray">
            Last updated: {formatDate(last_updated, 'full')}
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
              Today –{' '}
              {new Date().toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
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
                Feels like{' '}
                {formatTemperature(feelsLikeValue)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-base">
              <div>
                <span className="font-semibold">Precipitation:</span>{' '}
                {formatPrecipitation(
                  precipitationValue,
                  precipitationUnit
                )}
              </div>
              <div>
                <span className="font-semibold">Wind:</span>{' '}
                {formatWind(
                  windSpeed,
                  windDirection,
                  windUnit
                )}
              </div>
              <div>
                <span className="font-semibold">Gusts:</span>{' '}
                {windGusts ?? '--'} {windUnit ?? 'km/h'}
              </div>
              <div>
                <span className="font-semibold">Direction:</span>{' '}
                {getWindDirection(windDirection)} (
                {windDirection ?? '--'}°)
              </div>
              <div>
                <span className="font-semibold">Cloud Cover:</span>{' '}
                {cloudCoverValue ?? '--'}
                {cloudCoverUnit ?? '%'}
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
                Hourly
              </Button>
              <Button
                variant={forecastType === 'daily' ? 'default' : 'outline'}
                onClick={() => setForecastType('daily')}
              >
                Daily
              </Button>
            </div>
            <Button variant="secondary" onClick={() => setSimplify((s) => !s)}>
              {simplify ? 'Show Graph' : 'Simplify'}
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
                  new Date(selectedDay).toLocaleDateString(undefined, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
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
                    (h) => typeof h.time === 'string' && h.time.startsWith(selectedDay)
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
                            : (item.temperature && typeof item.temperature === 'object' && 'value' in item.temperature)
                            ? (item.temperature as { value?: number }).value
                            : undefined
                        )
                      : formatTemperature(
                          item.temperature && typeof item.temperature === 'object' && 'max' in item.temperature
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
                      ? `${item.cloud_cover}% clouds`
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
        <footer className="text-center text-xs text-muted-foreground py-4">
          Data provided by{' '}
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

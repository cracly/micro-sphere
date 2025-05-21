'use client';
import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  formatTemperature,
  formatPrecipitation,
  formatWind,
  getWindDirection,
  formatDate,
  getWeatherIcon,
  getVisibilityPercentage,
  formatVisibility,
} from '@/lib/weather-utils';
import WeatherChart from './WeatherChart';

interface WeatherData {
  location: { timezone?: string };
  last_updated: string;
  current_weather: any;
  hourly_forecast: any[];
  daily_forecast?: any[];
}

const WeatherDashboard: React.FC = () => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [forecastType, setForecastType] = useState<'hourly' | 'daily'>(
    'hourly'
  );
  const [darkMode, setDarkMode] = useState(false);

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
    location,
    last_updated,
    current_weather,
    hourly_forecast,
    daily_forecast,
  } = weatherData;
  const icon = getWeatherIcon(
    current_weather.cloud_cover?.value,
    current_weather.precipitation?.value
  );

  // Hardcode location name
  const locationName = 'Kledering';

  // Only use data from latest_weather.json
  // current_weather: temperature.value, temperature.feels_like, precipitation.value, precipitation.unit, wind.speed, wind.gusts, wind.direction, wind.unit, cloud_cover.value, cloud_cover.unit
  // hourly_forecast: time, temperature, rain, cloud_cover, visibility, wind.speed, wind.direction, wind.gusts

  return (
    <div className="relative min-h-screen bg-neutral-50 dark:bg-neutral-900 transition-colors duration-500">
      <div className="relative z-10 max-w-4xl mx-auto py-8 px-2">
        <header className="flex flex-col items-center gap-2 py-4">
          <h1 className="text-4xl font-extrabold tracking-tight drop-shadow-lg text-neutral-900 dark:text-neutral-100">
            Weather Dashboard
          </h1>
          <p className="text-muted-foreground text-lg">{locationName}</p>
          <p className="text-xs">
            Last updated: {formatDate(last_updated, 'full')}
          </p>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" onClick={() => setDarkMode((d) => !d)}>
              {darkMode ? '☀️ Light' : '🌙 Dark'}
            </Button>
          </div>
        </header>
        <main className="space-y-8">
          {/* Hero Card */}
          <Card className="p-8 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl bg-white/90 dark:bg-neutral-800/90">
            <div className="flex flex-col items-center gap-2">
              <i className={`text-7xl ${icon}`}></i>
              <span className="text-5xl font-bold text-neutral-900 dark:text-neutral-100">
                {formatTemperature(current_weather.temperature?.value)}
              </span>
              <span className="text-muted-foreground text-lg">
                Feels like{' '}
                {formatTemperature(current_weather.temperature?.feels_like)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-base">
              <div>
                <span className="font-semibold">Precipitation:</span>{' '}
                {formatPrecipitation(
                  current_weather.precipitation?.value,
                  current_weather.precipitation?.unit
                )}
              </div>
              <div>
                <span className="font-semibold">Wind:</span>{' '}
                {formatWind(
                  current_weather.wind?.speed,
                  current_weather.wind?.direction,
                  current_weather.wind?.unit
                )}
              </div>
              <div>
                <span className="font-semibold">Gusts:</span>{' '}
                {current_weather.wind?.gusts || '--'}{' '}
                {current_weather.wind?.unit || 'km/h'}
              </div>
              <div>
                <span className="font-semibold">Direction:</span>{' '}
                {getWindDirection(current_weather.wind?.direction)} (
                {current_weather.wind?.direction ?? '--'}°)
              </div>
              <div>
                <span className="font-semibold">Cloud Cover:</span>{' '}
                {current_weather.cloud_cover?.value || '--'}
                {current_weather.cloud_cover?.unit || '%'}
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
          </div>
          <WeatherChart
            hourly={hourly_forecast}
            daily={daily_forecast}
            type={forecastType}
          />
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

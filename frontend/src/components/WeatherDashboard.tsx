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

  return (
    <div className="space-y-8">
      <header className="flex flex-col items-center gap-2 py-4">
        <h1 className="text-3xl font-bold">Weather Dashboard</h1>
        <p className="text-muted-foreground">
          {location?.timezone || 'Unknown location'}
        </p>
        <p className="text-xs">
          Last updated: {formatDate(last_updated, 'full')}
        </p>
      </header>
      <main className="space-y-8">
        <Card className="p-6 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
            <div className="flex flex-col items-center gap-2">
              <i
                className={`text-5xl ${getWeatherIcon(
                  current_weather.cloud_cover?.value,
                  current_weather.precipitation?.value
                )}`}
              ></i>
              <span className="text-4xl font-bold">
                {formatTemperature(current_weather.temperature?.value)}
              </span>
              <span className="text-muted-foreground">
                Feels like{' '}
                {formatTemperature(current_weather.temperature?.feels_like)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold">Wind:</span>{' '}
                {formatWind(
                  current_weather.wind?.speed,
                  current_weather.wind?.direction,
                  current_weather.wind?.unit
                )}
                <span className="ml-2">
                  ({getWindDirection(current_weather.wind?.direction)})
                </span>
              </div>
              <div>
                <span className="font-semibold">Gusts:</span>{' '}
                {current_weather.wind?.gusts || '--'}{' '}
                {current_weather.wind?.unit || 'km/h'}
              </div>
              <div>
                <span className="font-semibold">Precipitation:</span>{' '}
                {formatPrecipitation(
                  current_weather.precipitation?.value,
                  current_weather.precipitation?.unit
                )}
              </div>
              <div>
                <span className="font-semibold">Cloud Cover:</span>{' '}
                {current_weather.cloud_cover?.value || '--'}
                {current_weather.cloud_cover?.unit || '%'}
              </div>
              <div>
                <span className="font-semibold">Visibility:</span>{' '}
                {formatVisibility(current_weather.visibility)}
              </div>
            </div>
          </div>
        </Card>
        <div className="flex gap-2 justify-center">
          <Button
            variant={forecastType === 'hourly' ? 'default' : 'outline'}
            onClick={() => setForecastType('hourly')}
          >
            Hourly Forecast
          </Button>
          <Button
            variant={forecastType === 'daily' ? 'default' : 'outline'}
            onClick={() => setForecastType('daily')}
          >
            Daily Forecast
          </Button>
        </div>
        {forecastType === 'hourly' ? (
          <Card className="p-4">
            <h2 className="text-xl font-semibold mb-4">Next 24 Hours</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {hourly_forecast.slice(0, 24).map((hour, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center p-2 border rounded bg-muted"
                >
                  <span className="font-semibold">
                    {formatDate(hour.time, 'time')}
                  </span>
                  <i
                    className={`text-2xl ${getWeatherIcon(
                      hour.cloud_cover,
                      hour.rain
                    )}`}
                  ></i>
                  <span>{formatTemperature(hour.temperature)}</span>
                  <span className="text-xs">
                    Rain: {formatPrecipitation(hour.rain)}
                  </span>
                  <span className="text-xs">Wind: {hour.wind.speed} km/h</span>
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <Card className="p-4">
            <h2 className="text-xl font-semibold mb-4">Next 7 Days</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {daily_forecast?.map((day, i) => {
                let icon = 'fas fa-sun';
                if (day.precipitation_sum > 1) icon = 'fas fa-cloud-rain';
                else if (day.precipitation_sum > 0)
                  icon = 'fas fa-cloud-sun-rain';
                return (
                  <div
                    key={i}
                    className="flex flex-col items-center p-2 border rounded bg-muted"
                  >
                    <span className="font-semibold">
                      {formatDate(day.date, 'day')}
                    </span>
                    <span className="text-xs">
                      {formatDate(day.date, 'date')}
                    </span>
                    <i className={`text-2xl ${icon}`}></i>
                    <span>{formatTemperature(day.temperature.max)}</span>
                    <span className="text-xs">
                      Min: {formatTemperature(day.temperature.min)}
                    </span>
                    <span className="text-xs">
                      Precip: {formatPrecipitation(day.precipitation_sum)}
                    </span>
                    <span className="text-xs">
                      UV Index: {day.uv_index_max || '--'}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </main>
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
  );
};

export default WeatherDashboard;

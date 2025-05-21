'use client';
import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
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

// Helper: get background type from weather
function getWeatherBackgroundType(
  weather: any
): 'rain' | 'sunny' | 'cloudy' | 'thunderstorm' | 'default' {
  if (!weather) return 'default';
  const precip = weather.precipitation?.value ?? 0;
  const cloud = weather.cloud_cover?.value ?? 0;
  if (precip > 10) return 'thunderstorm';
  if (precip > 1) return 'rain';
  if (cloud > 80) return 'cloudy';
  if (cloud < 30) return 'sunny';
  return 'default';
}

// Animated SVG backgrounds for each weather type using framer-motion for smooth transitions
const WeatherBackgrounds = {
  sunny: (
    <motion.div
      key="sunny"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
      className="absolute inset-0 w-full h-full z-0 pointer-events-none"
    >
      <svg viewBox="0 0 1440 900" fill="none" className="w-full h-full">
        <defs>
          <radialGradient id="sunnyGradient" cx="50%" cy="40%" r="80%">
            <stop offset="0%" stopColor="#ffe066" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.2" />
          </radialGradient>
        </defs>
        <rect width="1440" height="900" fill="url(#sunnyGradient)" />
        <motion.circle
          cx="720"
          cy="300"
          r="120"
          fill="#ffe066"
          animate={{
            filter: ['blur(0px)', 'blur(8px)', 'blur(0px)'],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </svg>
    </motion.div>
  ),
  cloudy: (
    <motion.div
      key="cloudy"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
      className="absolute inset-0 w-full h-full z-0 pointer-events-none"
    >
      <svg viewBox="0 0 1440 900" fill="none" className="w-full h-full">
        <rect width="1440" height="900" fill="#dbeafe" />
        <motion.ellipse
          cx="400"
          cy="200"
          rx="180"
          ry="60"
          fill="#cbd5e1"
          fillOpacity="0.7"
          animate={{ x: [0, 60, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
        />
        <motion.ellipse
          cx="600"
          cy="250"
          rx="140"
          ry="50"
          fill="#e5e7eb"
          fillOpacity="0.8"
          animate={{ x: [0, 40, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
        />
        <motion.ellipse
          cx="900"
          cy="180"
          rx="200"
          ry="70"
          fill="#cbd5e1"
          fillOpacity="0.6"
          animate={{ x: [0, 80, 0] }}
          transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
        />
        <motion.ellipse
          cx="1200"
          cy="220"
          rx="160"
          ry="60"
          fill="#e0e7ef"
          fillOpacity="0.7"
          animate={{ x: [0, 50, 0] }}
          transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
        />
      </svg>
    </motion.div>
  ),
  rain: (
    <motion.div
      key="rain"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
      className="absolute inset-0 w-full h-full z-0 pointer-events-none"
    >
      <svg viewBox="0 0 1440 900" fill="none" className="w-full h-full">
        <rect width="1440" height="900" fill="#a5b4fc" />
        <motion.ellipse
          cx="500"
          cy="200"
          rx="180"
          ry="60"
          fill="#cbd5e1"
          fillOpacity="0.7"
          animate={{ x: [0, 60, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
        />
        <motion.ellipse
          cx="800"
          cy="250"
          rx="140"
          ry="50"
          fill="#e5e7eb"
          fillOpacity="0.8"
          animate={{ x: [0, 40, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
        />
        <motion.ellipse
          cx="1100"
          cy="180"
          rx="200"
          ry="70"
          fill="#cbd5e1"
          fillOpacity="0.6"
          animate={{ x: [0, 80, 0] }}
          transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
        />
        {/* Rain drops */}
        {[...Array(30)].map((_, i) => (
          <motion.rect
            key={i}
            x={40 + i * 45}
            y={300 + (i % 5) * 30}
            width="4"
            height="40"
            rx="2"
            fill="#60a5fa"
            fillOpacity="0.7"
            animate={{
              y: [300 + (i % 5) * 30, 380 + (i % 5) * 30],
              opacity: [1, 0.2],
            }}
            transition={{
              duration: 1.5 + (i % 5) * 0.2,
              repeat: Infinity,
              repeatType: 'loop',
              delay: (i % 5) * 0.1,
              ease: 'linear',
            }}
          />
        ))}
      </svg>
    </motion.div>
  ),
  thunderstorm: (
    <motion.div
      key="thunderstorm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
      className="absolute inset-0 w-full h-full z-0 pointer-events-none"
    >
      <svg viewBox="0 0 1440 900" fill="none" className="w-full h-full">
        <rect width="1440" height="900" fill="#64748b" />
        <motion.ellipse
          cx="600"
          cy="220"
          rx="200"
          ry="70"
          fill="#cbd5e1"
          fillOpacity="0.7"
          animate={{ x: [0, 60, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
        />
        <motion.ellipse
          cx="900"
          cy="180"
          rx="220"
          ry="80"
          fill="#e5e7eb"
          fillOpacity="0.8"
          animate={{ x: [0, 80, 0] }}
          transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
        />
        {/* Thunder bolt */}
        <motion.polygon
          points="800,350 830,420 810,420 840,490 820,490 850,560 790,470 810,470 780,400 800,400"
          fill="#facc15"
          fillOpacity="0.8"
          animate={{
            opacity: [0.7, 1, 0.2, 1, 0.2, 1, 0.7],
          }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'steps(7)' }}
        />
        {/* Rain drops */}
        {[...Array(20)].map((_, i) => (
          <motion.rect
            key={i}
            x={200 + i * 60}
            y={400 + (i % 5) * 30}
            width="4"
            height="40"
            rx="2"
            fill="#60a5fa"
            fillOpacity="0.7"
            animate={{
              y: [400 + (i % 5) * 30, 480 + (i % 5) * 30],
              opacity: [1, 0.2],
            }}
            transition={{
              duration: 1.5 + (i % 5) * 0.2,
              repeat: Infinity,
              repeatType: 'loop',
              delay: (i % 5) * 0.1,
              ease: 'linear',
            }}
          />
        ))}
      </svg>
    </motion.div>
  ),
  default: (
    <motion.div
      key="default"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
      className="absolute inset-0 w-full h-full z-0 pointer-events-none"
    >
      <svg viewBox="0 0 1440 900" fill="none" className="w-full h-full">
        <rect width="1440" height="900" fill="#f1f5f9" />
      </svg>
    </motion.div>
  ),
};

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

  const backgroundType = getWeatherBackgroundType(weatherData?.current_weather);

  return (
    <div className="relative min-h-screen bg-neutral-50 dark:bg-neutral-900 transition-colors duration-500 overflow-hidden">
      <AnimatePresence mode="wait">
        {WeatherBackgrounds[backgroundType]}
      </AnimatePresence>
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
          <Card className="p-8 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl bg-white/40 dark:bg-neutral-800/40 backdrop-blur-md border border-white/30 dark:border-neutral-700/40">
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

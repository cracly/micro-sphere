'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Cloud,
  CloudRain,
  Droplets,
  Gauge,
  Moon,
  Sun,
  Sunrise,
  Sunset,
  Wind,
} from 'lucide-react';
import type { GeosphereData, Language, WeatherData } from '@/lib/types';
import { translations } from '@/lib/i18n';
import { dataUrl } from '@/lib/data-url';
import {
  formatDay,
  formatNumber,
  formatTemperature,
  formatUpdatedAt,
  uvRiskLabel,
  viennaNow,
  wallClock,
  windDirectionLabel,
} from '@/lib/weather-utils';
import { weatherCodeIcon, weatherCodeLabel } from '@/lib/weather-codes';
import WeatherIcon from './WeatherIcon';
import StatTile from './StatTile';
import DayStrip from './DayStrip';
import HourlyCards from './HourlyCards';
import WeatherBriefing from './WeatherBriefing';
import HourlyPanels from './charts/HourlyPanels';
import DailyPanels from './charts/DailyPanels';
import NowcastPanels from './charts/NowcastPanels';

const WeatherDashboard: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [nowcast, setNowcast] = useState<GeosphereData | null>(null);
  const [error, setError] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  const [darkMode, setDarkMode] = useState(false);
  const [view, setView] = useState<'charts' | 'cards'>('charts');
  const [selectedDay, setSelectedDay] = useState(() => viennaNow().date);
  const t = translations[language];

  useEffect(() => {
    fetch(dataUrl('processed_open_meteo.json'))
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(setWeather)
      .catch(() => setError(true));

    // Nowcast is optional: when it fails, the section shows an
    // unavailable note instead of made-up data.
    fetch(dataUrl('processed_geosphere.json'))
      .then((res) => (res.ok ? res.json() : null))
      .then(setNowcast)
      .catch(() => setNowcast(null));
  }, []);

  // Theme: the inline script in layout.tsx applies the class pre-hydration;
  // this syncs React state with it and persists changes.
  useEffect(() => {
    setDarkMode(document.documentElement.classList.contains('dark'));
    const stored = localStorage.getItem('language');
    if (stored === 'de' || stored === 'en') setLanguage(stored);
  }, []);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  const switchLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const todayEntry = useMemo(() => {
    const today = viennaNow().date;
    return weather?.daily.find((d) => d.time === today) ?? null;
  }, [weather]);

  if (error) {
    return (
      <Card className="mx-auto my-16 max-w-lg p-6 text-center text-destructive">
        {t.loadError}
      </Card>
    );
  }
  if (!weather) {
    return (
      <Card className="mx-auto my-16 max-w-lg p-6 text-center text-muted-foreground">
        {t.loading}
      </Card>
    );
  }

  const { current } = weather;

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-4 py-6">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            micro-sphere <span className="font-normal text-muted-foreground">· Kledering</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            {t.tagline} · {t.lastUpdated} {formatUpdatedAt(weather.last_updated, language)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-border" role="group" aria-label="Language">
            {(['en', 'de'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => switchLanguage(lang)}
                aria-pressed={language === lang}
                className={`px-3 py-1.5 text-sm font-medium first:rounded-l-md last:rounded-r-md ${
                  language === lang
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent'
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleDarkMode}
            aria-label={darkMode ? t.lightMode : t.darkMode}
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </Button>
        </div>
      </header>

      {/* Current conditions */}
      <Card className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-5">
          <WeatherIcon
            icon={weatherCodeIcon(current.weather_code)}
            isDay={current.is_day !== 0}
            size={72}
            className="text-muted-foreground"
          />
          <div>
            <div className="text-5xl font-semibold leading-none">
              {formatTemperature(current.temperature, 1)}
            </div>
            <div className="mt-2 text-lg">{weatherCodeLabel(current.weather_code, language)}</div>
            <div className="text-sm text-muted-foreground">
              {t.feelsLike} {formatTemperature(current.feels_like, 1)}
            </div>
          </div>
        </div>
        <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4 md:max-w-xl">
          <StatTile
            label={t.wind}
            value={formatNumber(current.wind_speed, 'km/h')}
            sub={`${windDirectionLabel(current.wind_direction)} · ${t.gusts} ${formatNumber(current.wind_gusts, 'km/h')}`}
            icon={Wind}
          />
          <StatTile
            label={t.humidity}
            value={formatNumber(current.humidity, '%')}
            icon={Droplets}
          />
          <StatTile
            label={t.precipitation}
            value={formatNumber(current.precipitation, 'mm', 1)}
            sub={
              todayEntry?.precipitation_probability_max != null
                ? `${t.rainChance} ${todayEntry.precipitation_probability_max}%`
                : undefined
            }
            icon={CloudRain}
          />
          <StatTile
            label={t.cloudCover}
            value={formatNumber(current.cloud_cover, '%')}
            icon={Cloud}
          />
          <StatTile
            label={t.pressure}
            value={formatNumber(current.pressure, 'hPa')}
            icon={Gauge}
          />
          <StatTile
            label={t.uvIndex}
            value={todayEntry?.uv_index_max != null ? todayEntry.uv_index_max.toFixed(1) : '--'}
            sub={uvRiskLabel(todayEntry?.uv_index_max, language)}
            icon={Sun}
          />
          <StatTile
            label={t.sunrise}
            value={todayEntry?.sunrise ? wallClock(todayEntry.sunrise) : '--'}
            icon={Sunrise}
          />
          <StatTile
            label={t.sunset}
            value={todayEntry?.sunset ? wallClock(todayEntry.sunset) : '--'}
            icon={Sunset}
          />
        </div>
      </Card>

      {/* AI briefing */}
      <WeatherBriefing language={language} t={t} />

      {/* Hourly forecast */}
      <Card className="gap-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{t.hourlyCharts}</h2>
            <p className="text-sm text-muted-foreground">
              {formatDay(selectedDay, language, 'full')}
            </p>
          </div>
          <div className="flex rounded-md border border-border" role="group">
            {(['charts', 'cards'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setView(mode)}
                aria-pressed={view === mode}
                className={`px-3 py-1.5 text-sm font-medium first:rounded-l-md last:rounded-r-md ${
                  view === mode
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent'
                }`}
              >
                {mode === 'charts' ? t.chartView : t.cardView}
              </button>
            ))}
          </div>
        </div>
        <DayStrip
          daily={weather.daily}
          selectedDay={selectedDay}
          onSelect={setSelectedDay}
          language={language}
          t={t}
        />
        {view === 'charts' ? (
          <HourlyPanels
            hourly={weather.hourly}
            selectedDay={selectedDay}
            darkMode={darkMode}
            language={language}
            t={t}
          />
        ) : (
          <HourlyCards hourly={weather.hourly} selectedDay={selectedDay} t={t} />
        )}
      </Card>

      {/* Daily outlook */}
      <Card className="gap-4 p-6">
        <h2 className="text-lg font-semibold">{t.dailyCharts}</h2>
        <DailyPanels daily={weather.daily} darkMode={darkMode} language={language} t={t} />
      </Card>

      {/* GeoSphere nowcast */}
      <Card className="gap-4 p-6">
        <div>
          <h2 className="text-lg font-semibold">{t.nowcastTitle}</h2>
          <p className="text-sm text-muted-foreground">
            {t.nowcastSubtitle}
            {nowcast && ` · ${t.lastUpdated} ${formatUpdatedAt(nowcast.last_updated, language)}`}
          </p>
        </div>
        {nowcast && nowcast.forecast_data.length > 0 ? (
          <NowcastPanels data={nowcast} darkMode={darkMode} language={language} t={t} />
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t.nowcastUnavailable}
          </p>
        )}
      </Card>

      {/* Footer */}
      <footer className="border-t border-border pb-2 pt-4 text-center text-xs text-muted-foreground">
        {t.dataProvided}{' '}
        <a
          href="https://open-meteo.com/"
          className="underline underline-offset-2"
          target="_blank"
          rel="noopener noreferrer"
        >
          Open-Meteo
        </a>{' '}
        &{' '}
        <a
          href="https://www.geosphere.at/"
          className="underline underline-offset-2"
          target="_blank"
          rel="noopener noreferrer"
        >
          GeoSphere Austria
        </a>{' '}
        · micro-sphere
      </footer>
    </div>
  );
};

export default WeatherDashboard;

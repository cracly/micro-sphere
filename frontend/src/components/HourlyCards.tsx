'use client';
import React from 'react';
import type { HourlyEntry } from '@/lib/types';
import type { Translation } from '@/lib/i18n';
import {
  wallClock,
  wallDate,
  wallHour,
  viennaNow,
  formatTemperature,
} from '@/lib/weather-utils';
import { weatherCodeIcon } from '@/lib/weather-codes';
import WeatherIcon from './WeatherIcon';

interface HourlyCardsProps {
  hourly: HourlyEntry[];
  selectedDay: string;
  t: Translation;
}

/** Compact card-per-hour view — the glanceable alternative to the charts. */
const HourlyCards: React.FC<HourlyCardsProps> = ({ hourly, selectedDay, t }) => {
  const now = viennaNow();
  const entries = hourly.filter((h) => wallDate(h.time) === selectedDay);
  if (entries.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {entries.map((entry) => {
        const isNow = selectedDay === now.date && wallHour(entry.time) === now.hour;
        return (
          <div
            key={entry.time}
            className={`flex min-w-[84px] flex-col items-center gap-1 rounded-lg border p-3 ${
              isNow ? 'border-primary' : 'border-border'
            } bg-background/60`}
          >
            <span className="text-xs font-medium text-muted-foreground">
              {isNow ? t.now : wallClock(entry.time)}
            </span>
            <WeatherIcon
              icon={weatherCodeIcon(entry.weather_code)}
              isDay={entry.is_day !== 0}
              size={24}
            />
            <span className="text-base font-semibold">
              {formatTemperature(entry.temperature)}
            </span>
            <span className="text-xs text-muted-foreground">
              {entry.precipitation_probability ?? 0}%
              {entry.precipitation ? ` · ${entry.precipitation} mm` : ''}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default HourlyCards;

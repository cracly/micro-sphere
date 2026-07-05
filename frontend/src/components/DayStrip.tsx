'use client';
import React from 'react';
import type { DailyEntry, Language } from '@/lib/types';
import type { Translation } from '@/lib/i18n';
import { formatDay, formatTemperature, viennaNow } from '@/lib/weather-utils';
import { weatherCodeIcon } from '@/lib/weather-codes';
import WeatherIcon from './WeatherIcon';

interface DayStripProps {
  daily: DailyEntry[];
  selectedDay: string;
  onSelect: (day: string) => void;
  language: Language;
  t: Translation;
}

/** Horizontal day selector: weekday, condition icon, high/low. */
const DayStrip: React.FC<DayStripProps> = ({ daily, selectedDay, onSelect, language, t }) => {
  const today = viennaNow().date;
  return (
    <div
      role="tablist"
      aria-label={t.daySelector}
      className="flex gap-2 overflow-x-auto pb-2"
    >
      {daily.map((day) => {
        const selected = day.time === selectedDay;
        return (
          <button
            key={day.time}
            role="tab"
            aria-selected={selected}
            onClick={() => onSelect(day.time)}
            className={`flex min-w-[74px] flex-col items-center gap-1 rounded-lg border px-3 py-2 text-sm transition-colors ${
              selected
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background/60 hover:bg-accent'
            }`}
          >
            <span className="text-xs font-medium">
              {day.time === today ? t.today : formatDay(day.time, language, 'weekday-short')}
            </span>
            <WeatherIcon icon={weatherCodeIcon(day.weather_code)} size={22} />
            <span className="text-xs">
              <span className="font-semibold">{formatTemperature(day.temperature_max)}</span>{' '}
              <span className={selected ? 'opacity-80' : 'text-muted-foreground'}>
                {formatTemperature(day.temperature_min)}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default DayStrip;

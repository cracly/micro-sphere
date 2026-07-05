'use client';
import React, { useMemo } from 'react';
import {
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Bar,
  LabelList,
} from 'recharts';
import type { DailyEntry, Language } from '@/lib/types';
import type { Translation } from '@/lib/i18n';
import { formatDay, viennaNow } from '@/lib/weather-utils';
import { chartTheme, tickStyle, type ChartTheme } from './theme';
import Panel from './Panel';

interface DailyPanelsProps {
  daily: DailyEntry[];
  darkMode: boolean;
  language: Language;
  t: Translation;
}

// Label both ends of a floating range bar: low below, high above.
function rangeLabel(theme: ChartTheme) {
  const RangeLabel = (props: unknown): React.ReactElement<SVGElement> => {
    const { x = 0, y = 0, width = 0, height = 0, value } = props as {
      x?: number;
      y?: number;
      width?: number;
      height?: number;
      value?: number | [number, number];
    };
    if (!Array.isArray(value)) return <g />;
    const [min, max] = value;
    const cx = x + width / 2;
    return (
      <g>
        <text x={cx} y={y - 6} textAnchor="middle" fontSize={11} fill={theme.ink}>
          {Math.round(max)}°
        </text>
        <text x={cx} y={y + height + 14} textAnchor="middle" fontSize={11} fill={theme.tick}>
          {Math.round(min)}°
        </text>
      </g>
    );
  };
  return RangeLabel;
}

const SYNC_ID = 'daily';

const DailyPanels: React.FC<DailyPanelsProps> = ({ daily, darkMode, language, t }) => {
  const theme = chartTheme(darkMode);
  const today = viennaNow().date;

  const data = useMemo(
    () =>
      daily.map((d) => ({
        day: d.time === today ? t.today : formatDay(d.time, language, 'weekday-short'),
        range:
          d.temperature_min !== null && d.temperature_max !== null
            ? ([d.temperature_min, d.temperature_max] as [number, number])
            : undefined,
        precipitation: d.precipitation_sum,
        rain_chance: d.precipitation_probability_max,
      })),
    [daily, language, t, today]
  );

  if (data.length === 0) return null;

  return (
    <div className="space-y-5">
      {/* Temperature range: floating bars, one hue — labels carry the values */}
      <Panel title={`${t.tempRange} (°C)`} height={220} theme={theme}>
        <ComposedChart data={data} syncId={SYNC_ID} margin={{ top: 20, right: 8, left: -20, bottom: 16 }}>
          <CartesianGrid stroke={theme.grid} strokeWidth={1} vertical={false} />
          <XAxis
            dataKey="day"
            tick={tickStyle(theme)}
            tickLine={false}
            axisLine={{ stroke: theme.axis }}
            interval={0}
          />
          <YAxis
            tick={tickStyle(theme)}
            tickLine={false}
            axisLine={false}
            domain={['auto', 'auto']}
            tickCount={5}
          />
          <Bar
            dataKey="range"
            name={t.temperature}
            fill={theme.temperature}
            radius={4}
            maxBarSize={20}
            isAnimationActive={false}
          >
            <LabelList dataKey="range" content={rangeLabel(theme)} />
          </Bar>
        </ComposedChart>
      </Panel>

      {/* Precipitation sum */}
      <Panel title={`${t.precipPanel} (mm)`} height={150} theme={theme}>
        <ComposedChart data={data} syncId={SYNC_ID} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid stroke={theme.grid} strokeWidth={1} vertical={false} />
          <XAxis
            dataKey="day"
            tick={tickStyle(theme)}
            tickLine={false}
            axisLine={{ stroke: theme.axis }}
            interval={0}
          />
          <YAxis
            tick={tickStyle(theme)}
            tickLine={false}
            axisLine={false}
            domain={[0, (dataMax: number) => Math.max(2, Math.ceil(dataMax))]}
            tickCount={3}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload || payload.length === 0) return null;
              const row = payload[0].payload as (typeof data)[number];
              return (
                <div
                  className="rounded-md border px-3 py-2 text-xs shadow-md"
                  style={{ background: theme.surface, borderColor: theme.grid, color: theme.ink }}
                >
                  <div className="mb-1 font-medium" style={{ color: theme.tick }}>
                    {String(label ?? '')}
                  </div>
                  <div className="leading-5">
                    <span className="font-semibold">
                      {row.precipitation !== null && row.precipitation !== undefined
                        ? row.precipitation.toFixed(1)
                        : '--'}{' '}
                      mm
                    </span>{' '}
                    <span style={{ color: theme.tick }}>{t.precipitation}</span>
                  </div>
                  <div className="leading-5">
                    <span className="font-semibold">
                      {row.rain_chance !== null && row.rain_chance !== undefined
                        ? Math.round(row.rain_chance)
                        : '--'}{' '}
                      %
                    </span>{' '}
                    <span style={{ color: theme.tick }}>{t.rainChance}</span>
                  </div>
                </div>
              );
            }}
          />
          <Bar
            dataKey="precipitation"
            name={t.precipitation}
            fill={theme.precipitation}
            radius={[4, 4, 0, 0]}
            maxBarSize={20}
          />
        </ComposedChart>
      </Panel>
    </div>
  );
};

export default DailyPanels;

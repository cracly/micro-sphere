'use client';
import React, { useMemo } from 'react';
import {
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Line,
  Area,
  Bar,
  ReferenceLine,
} from 'recharts';
import type { HourlyEntry, Language } from '@/lib/types';
import type { Translation } from '@/lib/i18n';
import { wallClock, wallDate, viennaNow } from '@/lib/weather-utils';
import { chartTheme, tickStyle } from './theme';
import ChartTooltip from './ChartTooltip';
import Panel from './Panel';

interface HourlyPanelsProps {
  hourly: HourlyEntry[];
  selectedDay: string;
  darkMode: boolean;
  language: Language;
  t: Translation;
}

// Four aligned small multiples (one unit per axis — never a dual-axis chart).
// syncId links the crosshair and tooltip across all panels.
const SYNC_ID = 'hourly';

const HourlyPanels: React.FC<HourlyPanelsProps> = ({
  hourly,
  selectedDay,
  darkMode,
  t,
}) => {
  const theme = chartTheme(darkMode);

  const data = useMemo(
    () =>
      hourly
        .filter((h) => wallDate(h.time) === selectedDay)
        .map((h) => ({
          hour: wallClock(h.time),
          temperature: h.temperature,
          feels_like: h.feels_like,
          precipitation: h.precipitation,
          rain_chance: h.precipitation_probability,
          cloud_cover: h.cloud_cover,
          wind_speed: h.wind_speed,
          wind_gusts: h.wind_gusts,
        })),
    [hourly, selectedDay]
  );

  const now = viennaNow();
  const nowLabel =
    selectedDay === now.date
      ? `${String(now.hour).padStart(2, '0')}:00`
      : undefined;

  if (data.length === 0) return null;

  const grid = <CartesianGrid stroke={theme.grid} strokeWidth={1} vertical={false} />;
  const xAxis = (showTicks: boolean) => (
    <XAxis
      dataKey="hour"
      tick={showTicks ? tickStyle(theme) : false}
      tickLine={false}
      axisLine={{ stroke: theme.axis }}
      interval={2}
      height={showTicks ? 24 : 6}
    />
  );
  const nowLine = (withLabel: boolean) =>
    nowLabel ? (
      <ReferenceLine
        x={nowLabel}
        stroke={theme.nowLine}
        strokeWidth={1}
        label={
          withLabel
            ? { value: t.now, position: 'top', fill: theme.nowLine, fontSize: 11 }
            : undefined
        }
      />
    ) : null;

  return (
    <div className="space-y-5">
      {/* Temperature */}
      <Panel
        title={`${t.temperature} (°C)`}
        legend={[
          { label: t.temperature, color: theme.temperature },
          { label: t.feelsLike, color: theme.feelsLike, dashed: true },
        ]}
        height={200}
        theme={theme}
      >
        <ComposedChart data={data} syncId={SYNC_ID} margin={{ top: 16, right: 8, left: -20, bottom: 0 }}>
          {grid}
          {xAxis(false)}
          <YAxis
            tick={tickStyle(theme)}
            tickLine={false}
            axisLine={false}
            domain={['auto', 'auto']}
            tickCount={5}
          />
          <Tooltip content={<ChartTooltip theme={theme} unit="°C" />} />
          <Area
            type="monotone"
            dataKey="temperature"
            name={t.temperature}
            stroke={theme.temperature}
            strokeWidth={2}
            fill={theme.temperature}
            fillOpacity={0.1}
            dot={false}
            activeDot={{ r: 4, stroke: theme.surface, strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            dataKey="feels_like"
            name={t.feelsLike}
            stroke={theme.feelsLike}
            strokeWidth={2}
            strokeDasharray="4 3"
            dot={false}
            activeDot={{ r: 4, stroke: theme.surface, strokeWidth: 2 }}
          />
          {nowLine(true)}
        </ComposedChart>
      </Panel>

      {/* Precipitation amount */}
      <Panel title={`${t.precipPanel} (mm)`} height={120} theme={theme}>
        <ComposedChart data={data} syncId={SYNC_ID} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          {grid}
          {xAxis(false)}
          <YAxis
            tick={tickStyle(theme)}
            tickLine={false}
            axisLine={false}
            domain={[0, (dataMax: number) => Math.max(1, Math.ceil(dataMax))]}
            tickCount={3}
          />
          <Tooltip content={<ChartTooltip theme={theme} unit="mm" />} />
          <Bar
            dataKey="precipitation"
            name={t.precipitation}
            fill={theme.precipitation}
            radius={[4, 4, 0, 0]}
            maxBarSize={12}
          />
          {nowLine(false)}
        </ComposedChart>
      </Panel>

      {/* Rain chance & cloud cover (both %) */}
      <Panel
        title={`${t.skyPanel} (%)`}
        legend={[
          { label: t.rainChance, color: theme.rainChance },
          { label: t.cloudCover, color: theme.cloudCover, dashed: true },
        ]}
        height={140}
        theme={theme}
      >
        <ComposedChart data={data} syncId={SYNC_ID} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          {grid}
          {xAxis(false)}
          <YAxis
            tick={tickStyle(theme)}
            tickLine={false}
            axisLine={false}
            domain={[0, 100]}
            ticks={[0, 50, 100]}
          />
          <Tooltip content={<ChartTooltip theme={theme} unit="%" digits={0} />} />
          <Line
            type="monotone"
            dataKey="rain_chance"
            name={t.rainChance}
            stroke={theme.rainChance}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, stroke: theme.surface, strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            dataKey="cloud_cover"
            name={t.cloudCover}
            stroke={theme.cloudCover}
            strokeWidth={2}
            strokeDasharray="4 3"
            dot={false}
            activeDot={{ r: 4, stroke: theme.surface, strokeWidth: 2 }}
          />
          {nowLine(false)}
        </ComposedChart>
      </Panel>

      {/* Wind */}
      <Panel
        title={`${t.windPanel} (km/h)`}
        legend={[
          { label: t.wind, color: theme.wind },
          { label: t.gusts, color: theme.wind, dashed: true },
        ]}
        height={150}
        theme={theme}
      >
        <ComposedChart data={data} syncId={SYNC_ID} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          {grid}
          {xAxis(true)}
          <YAxis
            tick={tickStyle(theme)}
            tickLine={false}
            axisLine={false}
            domain={[0, 'auto']}
            tickCount={4}
          />
          <Tooltip content={<ChartTooltip theme={theme} unit="km/h" digits={0} />} />
          <Line
            type="monotone"
            dataKey="wind_speed"
            name={t.wind}
            stroke={theme.wind}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, stroke: theme.surface, strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            dataKey="wind_gusts"
            name={t.gusts}
            stroke={theme.wind}
            strokeWidth={2}
            strokeDasharray="4 3"
            dot={false}
            activeDot={{ r: 4, stroke: theme.surface, strokeWidth: 2 }}
          />
          {nowLine(false)}
        </ComposedChart>
      </Panel>
    </div>
  );
};

export default HourlyPanels;

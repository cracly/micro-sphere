'use client';
import React, { useMemo } from 'react';
import {
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Line,
  Bar,
} from 'recharts';
import type { GeosphereData, Language } from '@/lib/types';
import type { Translation } from '@/lib/i18n';
import { instantClock } from '@/lib/weather-utils';
import { chartTheme, tickStyle } from './theme';
import ChartTooltip from './ChartTooltip';
import Panel from './Panel';

interface NowcastPanelsProps {
  data: GeosphereData;
  darkMode: boolean;
  language: Language;
  t: Translation;
}

const SYNC_ID = 'nowcast';

// GeoSphere 3-hour nowcast: 15-minute steps, rendered as the same kind of
// small multiples as the hourly forecast. Timestamps arrive as UTC instants
// and are displayed in Vienna time.
const NowcastPanels: React.FC<NowcastPanelsProps> = ({ data, darkMode, t }) => {
  const theme = chartTheme(darkMode);

  const rows = useMemo(
    () =>
      data.forecast_data.map((entry) => ({
        time: instantClock(entry.time),
        temperature: entry.temperature,
        dew_point: entry.dew_point,
        precipitation: entry.precipitation,
        wind_speed: entry.wind_speed,
        wind_gusts: entry.wind_gusts,
      })),
    [data]
  );

  if (rows.length === 0) return null;

  const grid = <CartesianGrid stroke={theme.grid} strokeWidth={1} vertical={false} />;
  const xAxis = (showTicks: boolean) => (
    <XAxis
      dataKey="time"
      tick={showTicks ? tickStyle(theme) : false}
      tickLine={false}
      axisLine={{ stroke: theme.axis }}
      interval={1}
      height={showTicks ? 24 : 6}
    />
  );

  return (
    <div className="space-y-5">
      <Panel
        title={`${t.temperature} / ${t.dewPoint} (°C)`}
        legend={[
          { label: t.temperature, color: theme.temperature },
          { label: t.dewPoint, color: theme.dewPoint },
        ]}
        height={170}
        theme={theme}
      >
        <ComposedChart data={rows} syncId={SYNC_ID} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
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
          <Line
            type="monotone"
            dataKey="temperature"
            name={t.temperature}
            stroke={theme.temperature}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, stroke: theme.surface, strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            dataKey="dew_point"
            name={t.dewPoint}
            stroke={theme.dewPoint}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, stroke: theme.surface, strokeWidth: 2 }}
          />
        </ComposedChart>
      </Panel>

      <Panel title={`${t.precipPanel} (mm / 15 min)`} height={110} theme={theme}>
        <ComposedChart data={rows} syncId={SYNC_ID} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          {grid}
          {xAxis(false)}
          <YAxis
            tick={tickStyle(theme)}
            tickLine={false}
            axisLine={false}
            domain={[0, (dataMax: number) => Math.max(0.5, Math.ceil(dataMax * 2) / 2)]}
            tickCount={3}
          />
          <Tooltip content={<ChartTooltip theme={theme} unit="mm" digits={2} />} />
          <Bar
            dataKey="precipitation"
            name={t.precipitation}
            fill={theme.precipitation}
            radius={[4, 4, 0, 0]}
            maxBarSize={14}
          />
        </ComposedChart>
      </Panel>

      <Panel
        title={`${t.windPanel} (km/h)`}
        legend={[
          { label: t.wind, color: theme.wind },
          { label: t.gusts, color: theme.wind, dashed: true },
        ]}
        height={140}
        theme={theme}
      >
        <ComposedChart data={rows} syncId={SYNC_ID} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
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
        </ComposedChart>
      </Panel>
    </div>
  );
};

export default NowcastPanels;

'use client';
import React from 'react';
import { Card } from '@/components/ui/card';
import { formatDate, getViennaDateAndHour } from '@/lib/weather-utils';
import {
  ResponsiveContainer,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Line,
  Bar,
  Area,
  ReferenceArea,
  ReferenceLine,
} from 'recharts';

interface WeatherChartProps {
  hourly: Record<string, unknown>[];
  daily?: Record<string, unknown>[];
  type: 'hourly' | 'daily';
  selectedDay?: string; // YYYY-MM-DD
}

const WeatherChart: React.FC<WeatherChartProps> = ({
  hourly,
  daily,
  type,
  selectedDay,
}) => {
  // Prepare data for chart
  let chartData: Record<string, unknown>[] = [];
  if (type === 'hourly') {
    // Only show selected day's hours
    const dayStr = selectedDay || new Date().toISOString().slice(0, 10);
    chartData = hourly
      .filter((h) => typeof h.time === 'string' && h.time.startsWith(dayStr))
      .map((h) => ({
        time: typeof h.time === 'string' ? formatDate(h.time, 'time') : '',
        rawTime: h.time,
        temperature: h.temperature,
        rain: h.rain,
        cloud_cover: h.cloud_cover,
        wind:
          h.wind && typeof h.wind === 'object' && h.wind !== null
            ? (h.wind as Record<string, unknown>).speed
            : undefined,
      }));
  } else {
    chartData =
      daily?.map((d) => ({
        time: typeof d.date === 'string' ? formatDate(d.date, 'day') : '',
        temperature:
          d.temperature &&
          typeof d.temperature === 'object' &&
          d.temperature !== null
            ? (d.temperature as Record<string, unknown>).max
            : undefined,
        rain: d.precipitation_sum,
        cloud_cover: undefined, // Not available in daily
        wind: undefined, // Not available in daily,
      })) || [];
  }

  // Highlight current day in hourly chart
  let todayStartIdx = -1;
  let todayEndIdx = -1;
  let currentHourIdx = -1;
  let showNow = false;
  if (type === 'hourly' && chartData.length > 0) {
    const { viennaDate, viennaHour } = getViennaDateAndHour();
    const dayStr = selectedDay || viennaDate;
    showNow = dayStr === viennaDate;
    for (let i = 0; i < chartData.length; i++) {
      const rawTime = chartData[i].rawTime as string;
      if (i === 0) todayStartIdx = i;
      todayEndIdx = i;
      // Find current hour in Vienna time
      const hour = Number(rawTime.slice(11, 13));
      if (showNow && hour === viennaHour) currentHourIdx = i;
    }
  }

  return (
    <Card className="p-4 bg-white/80 dark:bg-neutral-800/80 shadow-lg">
      <h3 className="font-semibold mb-2 text-lg text-neutral-800 dark:text-neutral-100">
        {type === 'hourly' ? 'Hourly Forecast' : 'Daily Forecast'}
      </h3>
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart
          data={chartData}
          margin={{ top: 48, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="time" tick={{ fontSize: 12 }} />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 12 }}
            domain={['auto', 'auto']}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 12 }}
            domain={[0, 'auto']}
          />
          {/* Highlight today's hours */}
          {type === 'hourly' && todayStartIdx !== -1 && todayEndIdx !== -1 && (
            <ReferenceArea
              x1={chartData[todayStartIdx].time as string}
              x2={chartData[todayEndIdx].time as string}
              strokeOpacity={0}
              fill="#fbbf24"
              fillOpacity={0.08}
            />
          )}
          {/* Mark current hour (Now) only if selected day is Vienna today */}
          {type === 'hourly' && showNow && currentHourIdx !== -1 && (
            <ReferenceLine
              x={chartData[currentHourIdx].time as string}
              yAxisId="left"
              stroke="#f59e42" // brighter orange
              strokeWidth={4}
              strokeDasharray="6 2"
              label={{
                value: 'Now',
                position: 'top',
                fill: '#f59e42',
                fontSize: 18,
                fontWeight: 'bold',
                dy: -8,
              }}
            />
          )}
          <Tooltip
            contentStyle={{
              background: '#18181b',
              color: '#fff',
              borderRadius: 8,
            }}
            labelStyle={{ color: '#fff' }}
          />
          <Legend />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="temperature"
            name="Temperature (°C)"
            fill="#60a5fa"
            stroke="#2563eb"
            fillOpacity={0.2}
            activeDot={{ r: 6 }}
          />
          <Bar
            yAxisId="right"
            dataKey="rain"
            name="Rain (mm)"
            fill="#38bdf8"
            barSize={type === 'hourly' ? 8 : 24}
          />
          {type === 'hourly' && (
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="cloud_cover"
              name="Cloud Cover (%)"
              stroke="#a3a3a3"
              strokeDasharray="5 5"
              dot={false}
            />
          )}
          {type === 'hourly' && (
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="wind"
              name="Wind (km/h)"
              stroke="#fbbf24"
              dot={false}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default WeatherChart;

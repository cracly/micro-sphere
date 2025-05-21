'use client';
import React from 'react';
import { Card } from '@/components/ui/card';
import {
  formatTemperature,
  formatPrecipitation,
  formatDate,
} from '@/lib/weather-utils';
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
} from 'recharts';

interface WeatherChartProps {
  hourly: any[];
  daily?: any[];
  type: 'hourly' | 'daily';
}

const WeatherChart: React.FC<WeatherChartProps> = ({ hourly, daily, type }) => {
  // Prepare data for chart
  const chartData =
    type === 'hourly'
      ? hourly.map((h) => ({
          time: formatDate(h.time, 'time'),
          temperature: h.temperature,
          rain: h.rain,
          cloud_cover: h.cloud_cover,
          wind: h.wind?.speed,
        }))
      : daily?.map((d) => ({
          time: formatDate(d.date, 'day'),
          temperature: d.temperature?.max,
          rain: d.precipitation_sum,
          cloud_cover: undefined, // Not available in daily
          wind: undefined, // Not available in daily
        })) || [];

  return (
    <Card className="p-4 bg-white/80 dark:bg-neutral-800/80 shadow-lg">
      <h3 className="font-semibold mb-2 text-lg text-neutral-800 dark:text-neutral-100">
        {type === 'hourly' ? 'Hourly Forecast' : 'Daily Forecast'}
      </h3>
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
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

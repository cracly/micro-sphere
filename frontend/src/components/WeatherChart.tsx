'use client';
import React from 'react';
import { Card } from '@/components/ui/card';
import {
  formatTemperature,
  formatPrecipitation,
  formatDate,
} from '@/lib/weather-utils';

interface WeatherChartProps {
  hourly: any[];
  daily?: any[];
}

// Chart code removed to fix 'linear is not a registered scale' error
const WeatherChart: React.FC<WeatherChartProps> = () => {
  return null;
};

export default WeatherChart;

import React from 'react';
import {
  Sun,
  Moon,
  CloudSun,
  CloudMoon,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudHail,
  CloudSunRain,
  CloudMoonRain,
  CloudLightning,
  type LucideIcon,
} from 'lucide-react';
import type { WeatherIconKey } from '@/lib/weather-codes';

const DAY_ICONS: Record<WeatherIconKey, LucideIcon> = {
  clear: Sun,
  'partly-cloudy': CloudSun,
  cloudy: Cloud,
  fog: CloudFog,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  'freezing-rain': CloudHail,
  snow: CloudSnow,
  showers: CloudSunRain,
  'snow-showers': CloudSnow,
  thunderstorm: CloudLightning,
};

const NIGHT_ICONS: Partial<Record<WeatherIconKey, LucideIcon>> = {
  clear: Moon,
  'partly-cloudy': CloudMoon,
  showers: CloudMoonRain,
};

interface WeatherIconProps {
  icon: WeatherIconKey;
  isDay?: boolean;
  size?: number;
  className?: string;
}

const WeatherIcon: React.FC<WeatherIconProps> = ({
  icon,
  isDay = true,
  size = 24,
  className,
}) => {
  const Icon = (!isDay && NIGHT_ICONS[icon]) || DAY_ICONS[icon];
  return <Icon size={size} className={className} strokeWidth={1.75} aria-hidden />;
};

export default WeatherIcon;

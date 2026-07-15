import type { LucideIcon } from "lucide-react";
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Sun,
} from "lucide-react";

export const getWeatherIcon = (code: number): LucideIcon => {
  if (code === 0) return Sun;
  if (code === 1 || code === 2) return CloudSun;
  if (code === 3) return Cloud;
  if (code === 45 || code === 48) return CloudFog;
  if (code >= 51 && code <= 55) return CloudDrizzle;
  if (code >= 61 && code <= 65) return CloudRain;
  if (code >= 71 && code <= 77) return CloudSnow;
  if (code >= 80 && code <= 82) return CloudRain;
  if (code >= 85 && code <= 86) return CloudSnow;
  if (code >= 95) return CloudLightning;
  return Cloud;
};

interface WeatherIconProps {
  code: number;
  size?: number;
  className?: string;
  strokeWidth?: number;
}

export function WeatherIcon({ code, size = 48, className, strokeWidth = 1.5 }: WeatherIconProps) {
  const Icon = getWeatherIcon(code);
  return <Icon size={size} className={className} strokeWidth={strokeWidth} aria-hidden />;
}

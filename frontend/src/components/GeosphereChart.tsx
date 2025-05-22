import React, { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';

interface GeosphereData {
  location: string;
  last_updated: string;
  source: string;
  forecast_type: string;
  forecast_period: string;
  resolution: string;
  forecast_data: Array<{
    time: string;
    temperature: number | null;
  }>;
  units: {
    temperature: string;
  };
}

interface GeosphereChartProps {
  data: GeosphereData | null;
  darkMode: boolean;
}

const GeosphereChart: React.FC<GeosphereChartProps> = ({ data, darkMode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!data || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions for high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const forecastData = data.forecast_data || [];
    if (!forecastData.length) return;

    // Filter out entries with null temperature
    const validData = forecastData.filter(entry => entry.temperature !== null);
    if (!validData.length) return;

    // Extract temperature values and timestamps
    const temperatures = validData.map(entry => entry.temperature) as number[];
    const timestamps = validData.map(entry => new Date(entry.time));

    // Find min and max temps for the scale
    const minTemp = Math.min(...temperatures) - 1;
    const maxTemp = Math.max(...temperatures) + 1;

    const padding = { top: 40, right: 30, bottom: 60, left: 50 };
    const chartWidth = rect.width - padding.left - padding.right;
    const chartHeight = rect.height - padding.top - padding.bottom;

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Draw grid
    ctx.beginPath();
    ctx.strokeStyle = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

    // Vertical grid lines (time)
    for (let i = 0; i < timestamps.length; i++) {
      const x = padding.left + (i / (timestamps.length - 1)) * chartWidth;
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, padding.top + chartHeight);

      // Add time labels
      const timeFormat = new Intl.DateTimeFormat('default', {
        hour: 'numeric',
        minute: 'numeric',
      }).format(timestamps[i]);

      ctx.save();
      ctx.translate(x, padding.top + chartHeight + 20);
      ctx.rotate(Math.PI / 4); // Rotate text for better spacing
      ctx.textAlign = 'right';
      ctx.fillStyle = darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)';
      ctx.font = '10px sans-serif';
      ctx.fillText(timeFormat, 0, 0);
      ctx.restore();
    }

    // Horizontal grid lines (temperature)
    const tempStep = Math.ceil((maxTemp - minTemp) / 5);
    for (let temp = Math.floor(minTemp); temp <= Math.ceil(maxTemp); temp += tempStep) {
      const y = padding.top + chartHeight - ((temp - minTemp) / (maxTemp - minTemp)) * chartHeight;
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartWidth, y);

      // Add temperature labels
      ctx.fillStyle = darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)';
      ctx.textAlign = 'right';
      ctx.font = '10px sans-serif';
      ctx.fillText(`${temp}°${data.units?.temperature || 'C'}`, padding.left - 10, y + 4);
    }

    ctx.stroke();

    // Draw temperature line
    ctx.beginPath();
    ctx.strokeStyle = darkMode ? '#38bdf8' : '#0284c7'; // Technical blue color
    ctx.lineWidth = 3;

    for (let i = 0; i < validData.length; i++) {
      const x = padding.left + (i / (validData.length - 1)) * chartWidth;
      // Use non-null assertion since we've already filtered out null values
      const temperature = validData[i].temperature!;
      const y = padding.top + chartHeight - ((temperature - minTemp) / (maxTemp - minTemp)) * chartHeight;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      // Draw data points
      ctx.fillStyle = darkMode ? '#f0f9ff' : '#0284c7';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();

      // Add temperature value above point
      ctx.fillStyle = darkMode ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)';
      ctx.textAlign = 'center';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`${temperature.toFixed(1)}°`, x, y - 10);
    }

    ctx.stroke();

    // Draw chart title
    ctx.fillStyle = darkMode ? '#f0f9ff' : '#1e293b';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Geosphere High-Precision Temperature Forecast (15min)', rect.width / 2, 20);

    // Draw source info
    ctx.font = '10px sans-serif';
    ctx.fillStyle = darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
    ctx.textAlign = 'right';
    ctx.fillText(`Source: ${data.source || 'Geosphere'} • ${data.resolution || '15 minute'} resolution`, rect.width - 10, rect.height - 10);

  }, [data, darkMode]);

  if (!data || !data.forecast_data || data.forecast_data.length === 0) {
    return <Card className="p-4 my-8 text-center">No Geosphere data available</Card>;
  }

  return (
    <div className="relative w-full h-full">
      <Card className="p-4 my-2 w-full bg-white/70 dark:bg-neutral-800/70 backdrop-blur-sm border border-white/30 dark:border-neutral-700/40">
        <canvas
          ref={canvasRef}
          className="w-full"
          style={{ height: "350px" }}
        />
      </Card>
    </div>
  );
};

// Interactive technical details panel
export const GeosphereTechnicalPanel: React.FC<{ data: GeosphereData | null }> = ({ data }) => {
  if (!data) return null;

  return (
    <Card className="my-4 overflow-hidden border border-neutral-200 dark:border-neutral-700">
      <div className="bg-neutral-100 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 p-3">
        <h3 className="text-sm font-mono font-bold flex items-center">
          <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-2"></span>
          Geosphere High-Precision Nowcast
        </h3>
      </div>
      <div className="p-4 font-mono text-xs space-y-2 bg-neutral-50 dark:bg-neutral-900">
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded">
            <div className="text-neutral-500 dark:text-neutral-400">Source</div>
            <div className="font-bold">{data.source}</div>
          </div>
          <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded">
            <div className="text-neutral-500 dark:text-neutral-400">Resolution</div>
            <div className="font-bold">{data.resolution}</div>
          </div>
          <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded">
            <div className="text-neutral-500 dark:text-neutral-400">Forecast Period</div>
            <div className="font-bold">{data.forecast_period}</div>
          </div>
          <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded">
            <div className="text-neutral-500 dark:text-neutral-400">Forecast Type</div>
            <div className="font-bold">{data.forecast_type}</div>
          </div>
          <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded">
            <div className="text-neutral-500 dark:text-neutral-400">Data Points</div>
            <div className="font-bold">{data.forecast_data?.length || 0}</div>
          </div>
          <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded">
            <div className="text-neutral-500 dark:text-neutral-400">Last Updated</div>
            <div className="font-bold">{new Date(data.last_updated).toLocaleTimeString()}</div>
          </div>
        </div>

        <div className="border-t border-neutral-200 dark:border-neutral-700 pt-2 mt-2">
          <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">System Status</div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
              Online
            </span>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
              High Precision
            </span>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100">
              Nowcast
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default GeosphereChart;

import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';

// Parameter type definition
type ParameterType = 'temperature' | 'precipitation' | 'dew_point' | 'wind_speed' | 'wind_gust' | 'wind_direction';

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
    precipitation: number | null;
    dew_point: number | null;
    wind_direction: number | null;
    wind_speed: number | null;
    wind_gust: number | null;
  }>;
  units: {
    temperature: string;
    precipitation: string;
    dew_point: string;
    wind_direction: string;
    wind_speed: string;
    wind_gust: string;
  };
}

interface GeosphereChartProps {
  data: GeosphereData | null;
  darkMode: boolean;
}

const GeosphereChart: React.FC<GeosphereChartProps> = ({ data, darkMode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedParameter, setSelectedParameter] = useState<ParameterType>('temperature');

  // Color mapping for different parameters
  const parameterColors = {
    temperature: { line: darkMode ? '#38bdf8' : '#0284c7', point: darkMode ? '#f0f9ff' : '#0284c7' },
    precipitation: { line: darkMode ? '#22c55e' : '#16a34a', point: darkMode ? '#f0fdf4' : '#16a34a' },
    dew_point: { line: darkMode ? '#a78bfa' : '#7c3aed', point: darkMode ? '#f5f3ff' : '#7c3aed' },
    wind_speed: { line: darkMode ? '#f97316' : '#ea580c', point: darkMode ? '#fff7ed' : '#ea580c' },
    wind_gust: { line: darkMode ? '#ef4444' : '#dc2626', point: darkMode ? '#fef2f2' : '#dc2626' },
    wind_direction: { line: darkMode ? '#64748b' : '#475569', point: darkMode ? '#f8fafc' : '#475569' }
  };

  // Parameter display settings
  const parameterConfig = {
    temperature: {
      title: 'Temperature (°C)',
      valueFormatter: (val: number) => `${val.toFixed(1)}°`,
      unit: data?.units?.temperature || '°C',
      color: parameterColors.temperature
    },
    precipitation: {
      title: 'Precipitation (mm)',
      valueFormatter: (val: number) => `${val.toFixed(2)}`,
      unit: data?.units?.precipitation || 'mm',
      color: parameterColors.precipitation
    },
    dew_point: {
      title: 'Dew Point (°C)',
      valueFormatter: (val: number) => `${val.toFixed(1)}°`,
      unit: data?.units?.dew_point || '°C',
      color: parameterColors.dew_point
    },
    wind_speed: {
      title: 'Wind Speed (m/s)',
      valueFormatter: (val: number) => `${val.toFixed(1)}`,
      unit: data?.units?.wind_speed || 'm/s',
      color: parameterColors.wind_speed
    },
    wind_gust: {
      title: 'Wind Gust (m/s)',
      valueFormatter: (val: number) => `${val.toFixed(1)}`,
      unit: data?.units?.wind_gust || 'm/s',
      color: parameterColors.wind_gust
    },
    wind_direction: {
      title: 'Wind Direction (°)',
      valueFormatter: (val: number) => `${val.toFixed(0)}°`,
      unit: 'degrees',
      color: parameterColors.wind_direction
    }
  };

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

    // Filter out entries with null value for the selected parameter
    const validData = forecastData.filter(entry => entry[selectedParameter] !== null);
    if (!validData.length) return;

    // Extract values and timestamps
    const values = validData.map(entry => entry[selectedParameter]) as number[];
    const timestamps = validData.map(entry => new Date(entry.time));

    // Find min and max values for the scale with some padding
    let min = Math.min(...values);
    let max = Math.max(...values);

    // Add padding to the range
    const range = max - min;
    min = min - range * 0.1;
    max = max + range * 0.1;

    // For parameters that should start at zero (like precipitation)
    if (selectedParameter === 'precipitation' && min > 0) {
      min = 0;
    }

    const padding = { top: 40, right: 30, bottom: 60, left: 60 };
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

    // Horizontal grid lines
    const valueStep = calculateNiceStep(min, max);
    for (let val = Math.floor(min / valueStep) * valueStep; val <= Math.ceil(max / valueStep) * valueStep; val += valueStep) {
      const y = padding.top + chartHeight - ((val - min) / (max - min)) * chartHeight;
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartWidth, y);

      // Add value labels
      ctx.fillStyle = darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)';
      ctx.textAlign = 'right';
      ctx.font = '10px sans-serif';

      // Format the value label according to parameter type
      const formattedValue = parameterConfig[selectedParameter].valueFormatter(val);
      ctx.fillText(formattedValue, padding.left - 10, y + 4);
    }

    ctx.stroke();

    // Draw data line
    ctx.beginPath();
    ctx.strokeStyle = parameterConfig[selectedParameter].color.line;
    ctx.lineWidth = 3;

    for (let i = 0; i < validData.length; i++) {
      const x = padding.left + (i / (validData.length - 1)) * chartWidth;
      const value = validData[i][selectedParameter]!; // We filtered out null values
      const y = padding.top + chartHeight - ((value - min) / (max - min)) * chartHeight;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      // Draw data points
      ctx.fillStyle = parameterConfig[selectedParameter].color.point;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();

      // Add value above point
      ctx.fillStyle = darkMode ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)';
      ctx.textAlign = 'center';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(parameterConfig[selectedParameter].valueFormatter(value), x, y - 10);
    }

    ctx.stroke();

    // Draw chart title
    ctx.fillStyle = darkMode ? '#f0f9ff' : '#1e293b';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Geosphere ${parameterConfig[selectedParameter].title}`, rect.width / 2, 20);

    // Draw source info
    ctx.font = '10px sans-serif';
    ctx.fillStyle = darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
    ctx.textAlign = 'right';
    ctx.fillText(`Source: ${data.source || 'Geosphere'} • ${data.resolution || '15 minute'} resolution`, rect.width - 10, rect.height - 10);

  }, [data, darkMode, selectedParameter, parameterConfig]);

  // Helper function to calculate nice step sizes for the chart
  const calculateNiceStep = (min: number, max: number): number => {
    const range = max - min;
    const roughStep = range / 5;
    const magnitude = 10 ** Math.floor(Math.log10(roughStep));
    const normalized = roughStep / magnitude;

    if (normalized < 1.5) return magnitude;
    if (normalized < 3) return 2 * magnitude;
    if (normalized < 7.5) return 5 * magnitude;
    return 10 * magnitude;
  };

  if (!data || !data.forecast_data || data.forecast_data.length === 0) {
    return <Card className="p-4 my-8 text-center">No Geosphere data available</Card>;
  }

  return (
    <div className="relative w-full h-full">
      <Card className="p-4 my-2 w-full bg-white/70 dark:bg-neutral-800/70 backdrop-blur-sm border border-white/30 dark:border-neutral-700/40">
        <div className="mb-4 flex flex-wrap gap-2 items-center justify-center">
          {Object.keys(parameterConfig).map((param) => (
            <button
              key={param}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                selectedParameter === param
                  ? `bg-${param === 'temperature' ? 'blue' : 
                       param === 'precipitation' ? 'green' : 
                       param === 'dew_point' ? 'purple' : 
                       param === 'wind_speed' || param === 'wind_gust' ? 'orange' : 
                       'gray'}-100 dark:bg-${param === 'temperature' ? 'blue' : 
                       param === 'precipitation' ? 'green' : 
                       param === 'dew_point' ? 'purple' : 
                       param === 'wind_speed' || param === 'wind_gust' ? 'orange' : 
                       'gray'}-900 text-${param === 'temperature' ? 'blue' : 
                       param === 'precipitation' ? 'green' : 
                       param === 'dew_point' ? 'purple' : 
                       param === 'wind_speed' || param === 'wind_gust' ? 'orange' : 
                       'gray'}-800 dark:text-${param === 'temperature' ? 'blue' : 
                       param === 'precipitation' ? 'green' : 
                       param === 'dew_point' ? 'purple' : 
                       param === 'wind_speed' || param === 'wind_gust' ? 'orange' : 
                       'gray'}-100 border-2 border-${param === 'temperature' ? 'blue' : 
                       param === 'precipitation' ? 'green' : 
                       param === 'dew_point' ? 'purple' : 
                       param === 'wind_speed' || param === 'wind_gust' ? 'orange' : 
                       'gray'}-500`
                  : `bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700`
              }`}
              onClick={() => setSelectedParameter(param as ParameterType)}
            >
              {parameterConfig[param as ParameterType].title}
            </button>
          ))}
        </div>
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

  // Get the latest forecast data point
  const latestData = data.forecast_data.length > 0 ? data.forecast_data[data.forecast_data.length - 1] : null;

  return (
    <Card className="my-4 overflow-hidden border border-neutral-200 dark:border-neutral-700">
      <div className="bg-neutral-100 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 p-3">
        <h3 className="text-sm font-mono font-bold flex items-center">
          <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-2"></span>
          Geosphere High-Precision Nowcast
        </h3>
      </div>

      <div className="p-4 font-mono text-xs space-y-2 bg-neutral-50 dark:bg-neutral-900">
        {/* Metadata section */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
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

        {/* Latest Parameter Values */}
        <div>
          <h4 className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Latest Parameter Values</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Temperature Section */}
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-100 dark:border-blue-800">
              <div className="flex justify-between items-center mb-1">
                <div className="text-blue-700 dark:text-blue-300 font-semibold">Temperature</div>
                <div className="text-blue-900 dark:text-blue-100 text-lg font-bold">
                  {latestData?.temperature !== null ? `${latestData?.temperature.toFixed(1)}°${data.units.temperature}` : 'N/A'}
                </div>
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400">
                Dew Point: {latestData?.dew_point !== null ? `${latestData?.dew_point.toFixed(1)}°${data.units.dew_point}` : 'N/A'}
              </div>
            </div>

            {/* Precipitation Section */}
            <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-100 dark:border-green-800">
              <div className="flex justify-between items-center mb-1">
                <div className="text-green-700 dark:text-green-300 font-semibold">Precipitation</div>
                <div className="text-green-900 dark:text-green-100 text-lg font-bold">
                  {latestData?.precipitation !== null ? `${latestData?.precipitation.toFixed(2)} ${data.units.precipitation}` : 'N/A'}
                </div>
              </div>
              <div className={`text-xs ${Number(latestData?.precipitation) > 0 ? 'text-green-600 dark:text-green-400' : 'text-neutral-500 dark:text-neutral-400'}`}>
                {Number(latestData?.precipitation) > 0 ? 'Precipitation detected' : 'No precipitation'}
              </div>
            </div>

            {/* Wind Section */}
            <div className="p-3 bg-orange-50 dark:bg-orange-900/30 rounded-lg border border-orange-100 dark:border-orange-800 md:col-span-2">
              <div className="flex justify-between items-center mb-1">
                <div className="text-orange-700 dark:text-orange-300 font-semibold">Wind Conditions</div>
                <div className="flex space-x-2">
                  <div className="flex flex-col items-end">
                    <span className="text-orange-900 dark:text-orange-100 text-lg font-bold">
                      {latestData?.wind_speed !== null ? `${latestData?.wind_speed.toFixed(1)} ${data.units.wind_speed}` : 'N/A'}
                    </span>
                    <span className="text-xs text-orange-600 dark:text-orange-400">Wind Speed</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-red-900 dark:text-red-100 text-lg font-bold">
                      {latestData?.wind_gust !== null ? `${latestData?.wind_gust.toFixed(1)} ${data.units.wind_gust}` : 'N/A'}
                    </span>
                    <span className="text-xs text-red-600 dark:text-red-400">Gust Speed</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-800 flex items-center justify-center">
                  <div
                    className="absolute w-4 h-1 bg-orange-600 dark:bg-orange-400"
                    style={{
                      transformOrigin: 'center',
                      transform: `rotate(${latestData?.wind_direction || 0}deg)`
                    }}
                  ></div>
                  <div className="w-1 h-1 rounded-full bg-orange-800 dark:bg-orange-200"></div>
                </div>
                <div className="text-xs text-orange-700 dark:text-orange-300">
                  Direction: {latestData?.wind_direction !== null ? `${Math.round(latestData?.wind_direction as number)}°` : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* System Status */}
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
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
              Multi-Parameter
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default GeosphereChart;

import React from 'react';
import type { TooltipProps } from 'recharts';
import type { ChartTheme } from './theme';

// Shared tooltip: value leads (strong), series name follows, keyed by a short
// stroke of the series color. Names/values are rendered as text nodes only.

interface ChartTooltipProps extends TooltipProps<number, string> {
  theme: ChartTheme;
  unit?: string;
  digits?: number;
}

const ChartTooltip: React.FC<ChartTooltipProps> = ({
  active,
  payload,
  label,
  theme,
  unit = '',
  digits = 1,
}) => {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div
      className="rounded-md border px-3 py-2 text-xs shadow-md"
      style={{
        background: theme.surface,
        borderColor: theme.grid,
        color: theme.ink,
      }}
    >
      <div className="mb-1 font-medium" style={{ color: theme.tick }}>
        {String(label ?? '')}
      </div>
      {payload.map((entry) => {
        const value =
          typeof entry.value === 'number' ? entry.value.toFixed(digits) : '--';
        return (
          <div key={entry.dataKey as string} className="flex items-center gap-2 leading-5">
            <span
              className="inline-block h-0.5 w-3 rounded-full"
              style={{ background: entry.color }}
            />
            <span className="font-semibold">
              {value}
              {unit && ` ${unit}`}
            </span>
            <span style={{ color: theme.tick }}>{entry.name}</span>
          </div>
        );
      })}
    </div>
  );
};

export default ChartTooltip;

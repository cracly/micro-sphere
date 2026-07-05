import React from 'react';
import { ResponsiveContainer } from 'recharts';
import type { ChartTheme } from './theme';

interface LegendItem {
  label: string;
  color: string;
  dashed?: boolean;
  kind?: 'line' | 'bar';
}

interface PanelProps {
  title: string;
  legend?: LegendItem[]; // omit for single-series panels: the title names it
  height: number;
  theme: ChartTheme;
  children: React.ReactElement;
}

/** One small-multiple chart panel: title row + optional legend + plot. */
const Panel: React.FC<PanelProps> = ({ title, legend, height, theme, children }) => (
  <div>
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-1 pb-1">
      <h4 className="text-sm font-medium text-foreground">{title}</h4>
      {legend && legend.length > 1 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {legend.map((item) => (
            <span key={item.label} className="flex items-center gap-1.5 text-xs" style={{ color: theme.tick }}>
              {item.kind === 'bar' ? (
                <span
                  className="inline-block h-2.5 w-2.5 rounded-sm"
                  style={{ background: item.color }}
                />
              ) : (
                <svg width="16" height="4" aria-hidden>
                  <line
                    x1="0"
                    y1="2"
                    x2="16"
                    y2="2"
                    stroke={item.color}
                    strokeWidth="2"
                    strokeDasharray={item.dashed ? '4 3' : undefined}
                    strokeLinecap="round"
                  />
                </svg>
              )}
              {item.label}
            </span>
          ))}
        </div>
      )}
    </div>
    <ResponsiveContainer width="100%" height={height}>
      {children}
    </ResponsiveContainer>
  </div>
);

export default Panel;

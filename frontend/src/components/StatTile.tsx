import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatTileProps {
  label: string;
  value: string;
  sub?: string;
  icon?: LucideIcon;
}

/** Small labelled value tile for the current-conditions grid. */
const StatTile: React.FC<StatTileProps> = ({ label, value, sub, icon: Icon }) => (
  <div className="rounded-lg border border-border bg-background/60 p-3">
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      {Icon && <Icon size={14} strokeWidth={2} aria-hidden />}
      {label}
    </div>
    <div className="mt-1 text-lg font-semibold leading-tight">{value}</div>
    {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
  </div>
);

export default StatTile;

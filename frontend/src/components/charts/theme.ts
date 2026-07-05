// Chart color roles. Color follows the entity (temperature is always orange,
// precipitation always blue, …) across every panel, in both modes. The hues
// are palette slots validated for adjacent-pair CVD separation; each panel
// uses at most two of them.

export interface ChartTheme {
  temperature: string;
  feelsLike: string; // context series: de-emphasis gray
  dewPoint: string;
  precipitation: string;
  rainChance: string;
  cloudCover: string;
  wind: string;
  grid: string;
  axis: string;
  tick: string;
  ink: string;
  surface: string;
  nowLine: string;
}

export const lightTheme: ChartTheme = {
  temperature: '#eb6834',
  feelsLike: '#898781',
  dewPoint: '#199e70', // one step darker than the palette's light aqua to clear 3:1 on the surface
  precipitation: '#2a78d6',
  rainChance: '#2a78d6',
  cloudCover: '#898781',
  wind: '#4a3aa7',
  grid: '#e1e0d9',
  axis: '#c3c2b7',
  tick: '#898781',
  ink: '#0b0b0b',
  surface: '#fcfcfb',
  nowLine: '#52514e',
};

export const darkTheme: ChartTheme = {
  temperature: '#d95926',
  feelsLike: '#898781',
  dewPoint: '#199e70',
  precipitation: '#3987e5',
  rainChance: '#3987e5',
  cloudCover: '#898781',
  wind: '#9085e9',
  grid: '#2c2c2a',
  axis: '#383835',
  tick: '#898781',
  ink: '#ffffff',
  surface: '#1a1a19',
  nowLine: '#c3c2b7',
};

export function chartTheme(darkMode: boolean): ChartTheme {
  return darkMode ? darkTheme : lightTheme;
}

/** Shared axis tick style. */
export function tickStyle(theme: ChartTheme) {
  return { fontSize: 11, fill: theme.tick };
}

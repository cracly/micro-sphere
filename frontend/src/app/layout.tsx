import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'micro-sphere · Kledering weather',
  description:
    'Hyper-local weather analytics and forecast for Kledering: current conditions, hourly and 8-day forecast, and a 15-minute GeoSphere nowcast.',
};

// Apply the stored (or system) theme before hydration to avoid a flash.
const themeInit = `(function(){try{var s=localStorage.getItem('theme');var d=s?s==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className={`${inter.className} bg-background text-foreground min-h-screen`}>
        {children}
      </body>
    </html>
  );
}

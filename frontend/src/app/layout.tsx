import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Inter } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Weather Dashboard',
  description:
    'A modern weather dashboard built with Next.js, Tailwind, and shadcn/ui.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} bg-background text-foreground min-h-screen`}
      >
        {' '}
        {/* Use Inter font and Tailwind backgrounds */}
        <div className="container mx-auto px-4 py-6">{children}</div>
      </body>
    </html>
  );
}

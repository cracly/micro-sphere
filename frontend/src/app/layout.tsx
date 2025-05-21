import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

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

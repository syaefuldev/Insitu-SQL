import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://insitu-sql.vercel.app'),
  title: {
    default: 'InSitu SQL — Local-First In-Browser SQL & Tabular Analytics Studio',
    template: '%s | InSitu SQL',
  },
  description:
    'InSitu SQL is a modern in-browser SQL and tabular analytics studio. 100% Client-Side, Zero Backend, Zero Telemetry. Process data directly in-situ from CSV, JSON, Parquet, and Excel files powered by the DuckDB-WASM engine.',
  keywords: [
    'InSitu SQL',
    'Local-First SQL',
    'In-Browser SQL',
    'Data Exploration',
    'DuckDB WASM',
    'Parquet Viewer',
    'CSV Query',
    'Excel Query',
    'Zero Telemetry',
    'Client-Side Analytics',
    'WASM Data Studio',
  ],
  authors: [{ name: 'InSitu SQL Engineering' }],
  creator: 'InSitu SQL Engineering',
  publisher: 'InSitu SQL',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://insitu-sql.vercel.app',
    siteName: 'InSitu SQL',
    title: 'InSitu SQL — Local-First In-Browser SQL Studio',
    description: '100% Client-Side, Zero Backend, Zero Telemetry SQL analytics studio powered by DuckDB-WASM.',
    images: [
      {
        url: 'https://insitu-sql.vercel.app/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'InSitu SQL Studio Interface',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'InSitu SQL — Local-First SQL Studio',
    description: '100% Client-Side, Zero Backend SQL analytics studio powered by DuckDB-WASM.',
    images: ['https://insitu-sql.vercel.app/og-image.jpg'],
    creator: '@insitusql',
  },
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="%23090a0f"/><path d="M30 40 L50 25 L70 40 L70 65 L50 80 L30 65 Z" fill="none" stroke="%236366f1" stroke-width="8" stroke-linejoin="round"/><path d="M50 48 L50 65 M40 56 L60 56" stroke="%236366f1" stroke-width="6" stroke-linecap="round"/></svg>',
    apple: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="%23090a0f"/><path d="M30 40 L50 25 L70 40 L70 65 L50 80 L30 65 Z" fill="none" stroke="%236366f1" stroke-width="8" stroke-linejoin="round"/><path d="M50 48 L50 65 M40 56 L60 56" stroke="%236366f1" stroke-width="6" stroke-linecap="round"/></svg>',
  },
  alternates: {
    canonical: 'https://insitu-sql.vercel.app',
  },
};

export const viewport: Viewport = {
  themeColor: '#090a0f',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full w-full">
      <body className="h-full w-full overflow-hidden bg-carbon-900 text-zinc-100 antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
        {children}
      </body>
    </html>
  );
}

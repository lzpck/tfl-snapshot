import type { Metadata, Viewport } from 'next';
import './globals.css';
import Header from './components/Header';
import { ThemeProvider } from './components/ThemeProvider';

export const metadata: Metadata = {
  title: 'TFL Snapshot',
  description: 'Acompanhe suas ligas de fantasy football com dados em tempo real do Sleeper',
  keywords: ['fantasy football', 'sleeper', 'TFL', 'standings', 'matchups'],
  authors: [{ name: 'TFL Snapshot' }],
  creator: 'TFL Snapshot',
  publisher: 'TFL Snapshot',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/icon-32x32.svg', sizes: '32x32', type: 'image/svg+xml' },
      { url: '/icons/icon-64x64.svg', sizes: '64x64', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/icons/icon-192x192.svg', sizes: '192x192', type: 'image/svg+xml' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/icons/icon-512x512.svg',
        color: '#3b82f6',
      },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TFL Snapshot',
  },
  applicationName: 'TFL Snapshot',
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'TFL Snapshot',
    'msapplication-TileColor': '#3b82f6',
    'msapplication-TileImage': '/icons/icon-512x512.svg',
    'msapplication-config': '/browserconfig.xml',
    'theme-color': '#3b82f6',
  },
};

export const viewport: Viewport = {
  themeColor: '#3b82f6',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-screen bg-background" suppressHydrationWarning>
        <ThemeProvider>
          <Header />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
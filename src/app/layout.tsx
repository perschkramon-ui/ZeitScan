import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { FirebaseClientProvider } from '@/firebase/client-provider';
import Script from 'next/script';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';

export const metadata: Metadata = {
  title: 'ZeitScan | Professionelle Zeiterfassung',
  description: 'QR-Code basierte Zeiterfassung für moderne Unternehmen.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ZeitScan',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
  keywords: ['Zeiterfassung', 'QR-Code', 'Arbeitszeiterfassung', 'Zeitverfolgung'],
  authors: [{ name: 'ZeitScan Team' }],
  creator: 'ZeitScan',
  category: 'Business',
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    url: 'https://zeitscan.app',
    siteName: 'ZeitScan',
    title: 'ZeitScan | Professionelle Zeiterfassung',
    description: 'QR-Code basierte Zeiterfassung für moderne Unternehmen.',
    images: [
      {
        url: '/icon-512x512.png',
        width: 512,
        height: 512,
        alt: 'ZeitScan Logo',
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: '#2200ff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="ZeitScan" />
        <meta name="apple-mobile-web-app-title" content="ZeitScan" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#2200ff" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#2200ff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#2200ff" media="(prefers-color-scheme: dark)" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icon-192x192.png" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="canonical" href="https://zeitscan.app" />
        <link rel="privacy-policy" href="https://zeitscan.app/privacy" />
        <link rel="terms-of-service" href="https://zeitscan.app/terms" />
      </head>
      <body className="font-body antialiased">
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.deferredPWAInstallPrompt = null;
              window.addEventListener('beforeinstallprompt', function(e) {
                e.preventDefault();
                window.deferredPWAInstallPrompt = e;
                // Dispatch a custom event in case components are already listening
                window.dispatchEvent(new Event('early-pwa-prompt'));
              });
            `
          }}
        />
        <FirebaseClientProvider>
          {children}
        </FirebaseClientProvider>
        <PWAInstallPrompt />
        <Toaster />
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(function(registration) {
                  console.log('ServiceWorker registration successful with scope: ', registration.scope);
                }, function(err) {
                  console.log('ServiceWorker registration failed: ', err);
                });
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}

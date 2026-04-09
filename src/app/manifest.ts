import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ZeitScan Zeiterfassung',
    short_name: 'ZeitScan',
    description: 'QR-Code basierte Zeiterfassung für moderne Unternehmen.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#E8EAEF',
    theme_color: '#2200ff',
    categories: ['productivity', 'business'],
    prefer_related_applications: false,
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    screenshots: [
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        form_factor: 'wide',
        label: 'ZeitScan Startbildschirm',
      },
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'ZeitScan Startbildschirm',
      },
    ],
    shortcuts: [
      {
        name: 'QR-Code Scan',
        short_name: 'Scan',
        description: 'Schnell QR-Code scannen',
        url: '/scan',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
        ],
      },
    ],
  }
}

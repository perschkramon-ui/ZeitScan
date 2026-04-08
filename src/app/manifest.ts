import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ZeitScan Zeiterfassung',
    short_name: 'ZeitScan',
    description: 'QR-Code basierte Zeiterfassung für moderne Unternehmen.',
    start_url: '/',
    display: 'standalone',
    background_color: '#E8EAEF',
    theme_color: '#2200ff',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
  }
}

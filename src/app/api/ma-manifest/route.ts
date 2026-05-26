import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id') || '';
  const manifest = {
    name: 'ZeitScan Mitarbeiter-App',
    short_name: 'ZeitScan',
    description: 'Deine persönliche Zeiterfassung',
    start_url: `/ma/${id}`,
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#E8EAEF',
    theme_color: '#2200ff',
    icons: [
      { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
  return NextResponse.json(manifest, {
    headers: { 'Content-Type': 'application/manifest+json' },
  });
}

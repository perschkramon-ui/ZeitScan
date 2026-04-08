import { NextResponse } from 'next/server';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const manifest = {
    name: 'ZeitScan Mitarbeiter',
    short_name: 'ZeitScan',
    description: 'Dein persönliches Zeitkonto',
    start_url: `/ma/${params.id}`,
    display: 'standalone',
    background_color: '#E8EAEF',
    theme_color: '#2200ff',
    icons: [
      { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
      { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
    ],
  };

  return NextResponse.json(manifest);
}

import { NextRequest, NextResponse } from 'next/server';

/**
 * Returns the public IP address of the requesting client.
 * Used for the location-lock feature: admin saves their office IP,
 * and employees can only clock in/out from the same IP (= same network).
 */
export async function GET(request: NextRequest) {
  // Next.js on App Hosting / Vercel: the client IP is in x-forwarded-for
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded
    ? forwarded.split(',')[0].trim()
    : request.headers.get('x-real-ip') || 'unknown';

  return NextResponse.json({ ip });
}

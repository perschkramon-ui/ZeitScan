
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Keine E-Mail-Adresse für dieses Konto gefunden." }, { status: 400 });
    }

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ error: "Stripe API Key nicht konfiguriert." }, { status: 500 });
    }

    const stripe = new Stripe(secretKey);

    // Kunden bei Stripe anhand der E-Mail finden
    const customers = await stripe.customers.list({
      email: email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return NextResponse.json({ 
        error: "Kein aktives Abonnement gefunden. Sie müssen zuerst ein Abo abschließen, um das Portal zu nutzen." 
      }, { status: 404 });
    }

    const customerId = customers.data[0].id;

    // Billing Portal Session erstellen
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${request.headers.get('origin')}/admin/dashboard`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Stripe Portal Fehler:', err.message);
    return NextResponse.json({ error: "Portal-Fehler: " + err.message }, { status: 500 });
  }
}

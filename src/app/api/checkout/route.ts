import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(request: Request) {
  try {
    const { userId, email } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "UserId fehlt." }, { status: 400 });
    }

    const secretKey = process.env.STRIPE_SECRET_KEY;
    
    if (!secretKey || secretKey.length < 10) {
      console.error('Stripe Error: STRIPE_SECRET_KEY ist nicht korrekt konfiguriert.');
      return NextResponse.json({ 
        error: "Stripe API Key nicht konfiguriert oder ungültig." 
      }, { status: 400 });
    }

    // Initialisierung ohne explizite Version, um Versions-Konflikte zu vermeiden
    const stripe = new Stripe(secretKey);

    const priceId = process.env.STRIPE_PRICE_ID;

    if (!priceId) {
      return NextResponse.json({ error: "Stripe Price ID fehlt." }, { status: 400 });
    }

    const sessionOptions: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      subscription_data: {
        trial_period_days: 30,
      },
      success_url: `${request.headers.get('origin')}/admin/dashboard?success=true`,
      cancel_url: `${request.headers.get('origin')}/admin/dashboard?canceled=true`,
      metadata: {
        userId: userId,
      },
    };

    // E-Mail nur hinzufügen, wenn sie vorhanden ist
    if (email && email.trim() !== '') {
      sessionOptions.customer_email = email;
    }

    const session = await stripe.checkout.sessions.create(sessionOptions);

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Stripe Checkout Fehler:', err.message);
    return NextResponse.json({ error: "Zahlungsdienst-Fehler: " + err.message }, { status: 500 });
  }
}

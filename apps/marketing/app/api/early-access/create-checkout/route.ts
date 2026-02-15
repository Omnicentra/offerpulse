import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, competitorUrl, abVariant, utmSource, utmMedium, utmCampaign } = body;

    const depositAmount = abVariant === "B" ? 39 : 19;

    // TODO: Implement Stripe Checkout
    // For now, return a placeholder
    
    console.log("Deposit checkout requested:", {
      email,
      competitorUrl,
      depositAmount,
      abVariant,
      utmSource,
      utmMedium,
      utmCampaign,
    });

    // In production:
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // const session = await stripe.checkout.sessions.create({
    //   payment_method_types: ['card'],
    //   line_items: [{
    //     price_data: {
    //       currency: 'gbp',
    //       product_data: {
    //         name: 'OfferPulse Early Access Deposit',
    //       },
    //       unit_amount: depositAmount * 100,
    //     },
    //     quantity: 1,
    //   }],
    //   mode: 'payment',
    //   success_url: `${process.env.NEXT_PUBLIC_MARKETING_APP_URL}/snapshot/success?session_id={CHECKOUT_SESSION_ID}`,
    //   cancel_url: `${process.env.NEXT_PUBLIC_MARKETING_APP_URL}/snapshot?cancelled=true`,
    //   customer_email: email,
    //   metadata: {
    //     competitorUrl,
    //     abVariant,
    //     utmSource: utmSource || '',
    //     utmMedium: utmMedium || '',
    //     utmCampaign: utmCampaign || '',
    //   },
    // });
    // return NextResponse.json({ url: session.url });

    // Placeholder response
    return NextResponse.json({
      url: `/snapshot/success?email=${encodeURIComponent(email)}`,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

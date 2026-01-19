import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe, getCreditPackById, CREDIT_PACKS } from "@/lib/stripe/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { packId } = await request.json();

    if (!packId) {
      return NextResponse.json(
        { error: "Pack ID is required" },
        { status: 400 }
      );
    }

    const pack = getCreditPackById(packId);

    if (!pack) {
      return NextResponse.json(
        { error: "Invalid credit pack" },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Check if user has a Stripe customer ID
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", session.user.id)
      .single();

    let customerId = subscription?.stripe_customer_id;

    // If no customer, create one
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email,
        metadata: {
          user_id: session.user.id,
        },
      });
      customerId = customer.id;
    }

    // Create checkout session for one-time payment
    // If we have a Stripe price ID configured, use it; otherwise create a price on the fly
    let lineItems;

    if (pack.stripe_price_id) {
      lineItems = [
        {
          price: pack.stripe_price_id,
          quantity: 1,
        },
      ];
    } else {
      // Create a price on the fly for the credit pack
      lineItems = [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `SafePlay ${pack.name}`,
              description: `${pack.credits} credits for content filtering - never expire`,
            },
            unit_amount: pack.price_cents,
          },
          quantity: 1,
        },
      ];
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      success_url: `${appUrl}/billing?purchase=success&credits=${pack.credits}`,
      cancel_url: `${appUrl}/billing?purchase=cancelled`,
      metadata: {
        user_id: session.user.id,
        pack_id: pack.id,
        credits: pack.credits.toString(),
        type: "credit_pack",
      },
    });

    return NextResponse.json({
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error) {
    console.error("Credit pack purchase error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

// Return available credit packs
export async function GET() {
  const packs = Object.values(CREDIT_PACKS).map((pack) => ({
    id: pack.id,
    credits: pack.credits,
    price_cents: pack.price_cents,
    name: pack.name,
  }));

  return NextResponse.json({ packs });
}

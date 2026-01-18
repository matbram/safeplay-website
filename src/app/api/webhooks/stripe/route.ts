import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe, getPlanByPriceId, getCreditPackById } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";
import Stripe from "stripe";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Helper to safely extract subscription period dates
function getSubscriptionPeriod(subscription: Stripe.Subscription) {
  // Access properties that exist on the subscription object
  const sub = subscription as unknown as {
    current_period_start: number;
    current_period_end: number;
    cancel_at_period_end: boolean;
    status: string;
    items: { data: Array<{ price: { id: string } }> };
    id: string;
    metadata?: Record<string, string>;
  };

  return {
    periodStart: new Date(sub.current_period_start * 1000).toISOString(),
    periodEnd: new Date(sub.current_period_end * 1000).toISOString(),
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    status: sub.status,
    priceId: sub.items.data[0]?.price.id,
    id: sub.id,
    userId: sub.metadata?.user_id,
  };
}

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const customerId = session.customer as string;
        const sessionType = session.metadata?.type;

        // Handle credit pack purchase (one-time payment)
        if (sessionType === "credit_pack") {
          const packId = session.metadata?.pack_id;
          const creditsToAdd = parseInt(session.metadata?.credits || "0", 10);

          if (userId && packId && creditsToAdd > 0) {
            const pack = getCreditPackById(packId);

            if (pack) {
              // Get current credit balance
              const { data: currentBalance } = await supabase
                .from("credit_balances")
                .select("*")
                .eq("user_id", userId)
                .single();

              const currentCredits = currentBalance?.available_credits || 0;
              const currentTopup = currentBalance?.topup_credits || 0;
              const newTopupCredits = currentTopup + creditsToAdd;
              const newTotalCredits = currentCredits + creditsToAdd;

              // Add credit transaction
              await supabase.from("credit_transactions").insert({
                user_id: userId,
                amount: creditsToAdd,
                balance_after: newTotalCredits,
                type: "topup",
                description: `Purchased ${pack.name} credit pack`,
              });

              // Update credit balance
              await supabase
                .from("credit_balances")
                .update({
                  available_credits: newTotalCredits,
                  topup_credits: newTopupCredits,
                })
                .eq("user_id", userId);

              // Store invoice record for the purchase
              const sessionDetails = session as unknown as {
                amount_total: number;
                invoice: string | null;
              };

              await supabase.from("invoices").insert({
                user_id: userId,
                stripe_invoice_id: session.id, // Use session ID for one-time payments
                amount_cents: sessionDetails.amount_total,
                status: "paid",
                invoice_pdf_url: null,
                period_start: new Date().toISOString(),
                period_end: null,
              });
            }
          }
          break;
        }

        // Handle subscription checkout
        const subscriptionId = session.subscription as string;

        if (userId && subscriptionId) {
          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const subData = getSubscriptionPeriod(subscription);
          const plan = getPlanByPriceId(subData.priceId);

          if (plan) {
            // Update user subscription in database
            await supabase.from("subscriptions").upsert({
              user_id: userId,
              plan_id: plan.id,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              status: subData.status,
              current_period_start: subData.periodStart,
              current_period_end: subData.periodEnd,
              cancel_at_period_end: subData.cancelAtPeriodEnd,
            });

            // Add initial credits
            await supabase.from("credit_transactions").insert({
              user_id: userId,
              amount: plan.credits_per_month,
              balance_after: plan.credits_per_month,
              type: "subscription_renewal",
              description: `Initial credits for ${plan.name} plan`,
            });

            // Update credit balance
            await supabase.from("credit_balances").upsert({
              user_id: userId,
              available_credits: plan.credits_per_month,
              used_this_period: 0,
              rollover_credits: 0,
              period_start: subData.periodStart,
              period_end: subData.periodEnd,
            });
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const subData = getSubscriptionPeriod(subscription);

        if (subData.userId) {
          const plan = getPlanByPriceId(subData.priceId);

          if (plan) {
            await supabase
              .from("subscriptions")
              .update({
                plan_id: plan.id,
                status: subData.status,
                current_period_start: subData.periodStart,
                current_period_end: subData.periodEnd,
                cancel_at_period_end: subData.cancelAtPeriodEnd,
              })
              .eq("stripe_subscription_id", subData.id);
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const subData = getSubscriptionPeriod(subscription);

        // Downgrade to free plan
        await supabase
          .from("subscriptions")
          .update({
            plan_id: "free",
            status: "canceled",
            stripe_subscription_id: null,
          })
          .eq("stripe_subscription_id", subData.id);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as unknown as {
          subscription: string | null;
          billing_reason: string;
          id: string;
          amount_paid: number;
          invoice_pdf: string | null;
          period_start: number | null;
          period_end: number | null;
        };
        const subscriptionId = invoice.subscription;

        if (subscriptionId && invoice.billing_reason === "subscription_cycle") {
          // Get subscription to find user
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const subData = getSubscriptionPeriod(subscription);
          const plan = getPlanByPriceId(subData.priceId);

          if (subData.userId && plan) {
            // Get current credit balance
            const { data: balance } = await supabase
              .from("credit_balances")
              .select("*")
              .eq("user_id", subData.userId)
              .single();

            // Calculate rollover (max 2x monthly credits)
            const maxRollover = plan.credits_per_month * 2;
            const unusedCredits = balance
              ? Math.max(0, balance.available_credits - balance.used_this_period)
              : 0;
            const rollover = Math.min(unusedCredits, maxRollover);

            // Add new credits
            const newTotal = plan.credits_per_month + rollover;

            await supabase.from("credit_transactions").insert({
              user_id: subData.userId,
              amount: plan.credits_per_month,
              balance_after: newTotal,
              type: "subscription_renewal",
              description: `Monthly credits for ${plan.name} plan`,
            });

            // Update credit balance
            await supabase.from("credit_balances").upsert({
              user_id: subData.userId,
              available_credits: newTotal,
              used_this_period: 0,
              rollover_credits: rollover,
              period_start: subData.periodStart,
              period_end: subData.periodEnd,
            });

            // Store invoice record
            await supabase.from("invoices").insert({
              user_id: subData.userId,
              stripe_invoice_id: invoice.id,
              amount_cents: invoice.amount_paid,
              status: "paid",
              invoice_pdf_url: invoice.invoice_pdf,
              period_start: invoice.period_start ? new Date(invoice.period_start * 1000).toISOString() : null,
              period_end: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null,
            });
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as unknown as { subscription: string | null };
        const subscriptionId = invoice.subscription;

        if (subscriptionId) {
          // Update subscription status
          await supabase
            .from("subscriptions")
            .update({ status: "past_due" })
            .eq("stripe_subscription_id", subscriptionId);

          // TODO: Send notification email to user
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

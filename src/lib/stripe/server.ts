import Stripe from "stripe";

// Lazy initialization to avoid build-time errors when env vars aren't set
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-12-15.clover",
      typescript: true,
    });
  }
  return _stripe;
}

// Export for backwards compatibility - uses getter
export const stripe = {
  get webhooks() {
    return getStripe().webhooks;
  },
  get subscriptions() {
    return getStripe().subscriptions;
  },
  get customers() {
    return getStripe().customers;
  },
  get checkout() {
    return getStripe().checkout;
  },
  get billingPortal() {
    return getStripe().billingPortal;
  },
};

// Plan configuration
export const PLANS = {
  free: {
    id: "free",
    name: "Free",
    price_cents: 0,
    credits_per_month: 30,
    max_profiles: 1,
    stripe_price_id: null,
    features: {
      custom_words: false,
      priority_support: false,
      family_sharing: false,
      team_management: false,
      parental_controls: false,
    },
  },
  individual: {
    id: "individual",
    name: "Individual",
    price_cents: 999,
    credits_per_month: 750,
    max_profiles: 3,
    stripe_price_id: process.env.STRIPE_PRICE_INDIVIDUAL,
    features: {
      custom_words: true,
      priority_support: false,
      family_sharing: true,
      team_management: false,
      parental_controls: false,
    },
  },
  family: {
    id: "family",
    name: "Family",
    price_cents: 1999,
    credits_per_month: 1500,
    max_profiles: 10,
    stripe_price_id: process.env.STRIPE_PRICE_FAMILY,
    features: {
      custom_words: true,
      priority_support: true,
      family_sharing: true,
      team_management: false,
      parental_controls: true,
    },
  },
  organization: {
    id: "organization",
    name: "Organization",
    price_cents: 4999,
    credits_per_month: 3750,
    max_profiles: -1, // Unlimited
    stripe_price_id: process.env.STRIPE_PRICE_ORGANIZATION,
    features: {
      custom_words: true,
      priority_support: true,
      family_sharing: true,
      team_management: true,
      parental_controls: true,
    },
  },
} as const;

export type PlanId = keyof typeof PLANS;

export function getPlanByPriceId(priceId: string): (typeof PLANS)[PlanId] | null {
  for (const plan of Object.values(PLANS)) {
    if (plan.stripe_price_id === priceId) {
      return plan;
    }
  }
  return null;
}

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

// Credit top-up packs - priced at 1.5x the subscription rate
// Subscription: $9.99 = 750 credits (~$0.0133/credit)
// Top-up: ~$0.02/credit (1.5x markup)
export const CREDIT_PACKS = {
  pack_250: {
    id: "pack_250",
    credits: 250,
    price_cents: 499,
    name: "250 Credits",
    stripe_price_id: process.env.STRIPE_PRICE_PACK_250,
  },
  pack_500: {
    id: "pack_500",
    credits: 500,
    price_cents: 999,
    name: "500 Credits",
    stripe_price_id: process.env.STRIPE_PRICE_PACK_500,
  },
  pack_1000: {
    id: "pack_1000",
    credits: 1000,
    price_cents: 1999,
    name: "1000 Credits",
    stripe_price_id: process.env.STRIPE_PRICE_PACK_1000,
  },
  pack_2500: {
    id: "pack_2500",
    credits: 2500,
    price_cents: 4999,
    name: "2500 Credits",
    stripe_price_id: process.env.STRIPE_PRICE_PACK_2500,
  },
} as const;

export type CreditPackId = keyof typeof CREDIT_PACKS;

export function getCreditPackById(packId: string): (typeof CREDIT_PACKS)[CreditPackId] | null {
  return CREDIT_PACKS[packId as CreditPackId] || null;
}

export function getCreditPackByPriceId(priceId: string): (typeof CREDIT_PACKS)[CreditPackId] | null {
  for (const pack of Object.values(CREDIT_PACKS)) {
    if (pack.stripe_price_id === priceId) {
      return pack;
    }
  }
  return null;
}

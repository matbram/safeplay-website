"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check, X, Zap, Crown, Users, Building } from "lucide-react";

const plans = [
  {
    name: "Free",
    icon: Zap,
    price: 0,
    period: "forever",
    description: "Perfect for trying out SafePlay",
    credits: "30",
    creditsLabel: "credits/month",
    features: [
      { text: "30 minutes of filtering", included: true },
      { text: "Mute or bleep options", included: true },
      { text: "Access cached videos", included: true },
      { text: "Custom word filters", included: false },
      { text: "Family profiles", included: false },
      { text: "Priority support", included: false },
    ],
    cta: "Get Started Free",
    href: "/signup?plan=free",
    popular: false,
    highlighted: false,
  },
  {
    name: "Individual",
    icon: Crown,
    price: 9.99,
    period: "month",
    description: "Great for personal use",
    credits: "750",
    creditsLabel: "credits/month",
    features: [
      { text: "750 minutes of filtering", included: true },
      { text: "Mute or bleep options", included: true },
      { text: "Access cached videos", included: true },
      { text: "Custom word filters", included: true },
      { text: "Up to 3 profiles", included: true },
      { text: "Email support", included: true },
    ],
    cta: "Start 7-Day Trial",
    href: "/signup?plan=individual",
    popular: true,
    highlighted: true,
  },
  {
    name: "Family",
    icon: Users,
    price: 19.99,
    period: "month",
    description: "Share with your whole family",
    credits: "1,500",
    creditsLabel: "credits/month",
    features: [
      { text: "1,500 minutes of filtering", included: true },
      { text: "Mute or bleep options", included: true },
      { text: "Access cached videos", included: true },
      { text: "Custom word filters", included: true },
      { text: "Up to 10 profiles", included: true },
      { text: "Parental controls", included: true },
    ],
    cta: "Start 7-Day Trial",
    href: "/signup?plan=family",
    popular: false,
    highlighted: false,
  },
  {
    name: "Organization",
    icon: Building,
    price: 49.99,
    period: "month",
    description: "For teams & businesses",
    credits: "3,750",
    creditsLabel: "credits/month",
    features: [
      { text: "3,750 minutes of filtering", included: true },
      { text: "Mute or bleep options", included: true },
      { text: "Access cached videos", included: true },
      { text: "Custom word filters", included: true },
      { text: "Unlimited members", included: true },
      { text: "Admin dashboard & priority support", included: true },
    ],
    cta: "Contact Sales",
    href: "/contact?type=enterprise",
    popular: false,
    highlighted: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="section bg-background-secondary">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="heading-1 text-foreground">
            Simple, transparent{" "}
            <span className="gradient-text">pricing</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Choose the plan that fits your needs. All plans include a 7-day free trial.
          </p>

          {/* Credit explanation */}
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-sm text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-primary" />
            1 credit = 1 minute of video filtering
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-6 transition-all duration-300 ${
                plan.highlighted
                  ? "bg-[#0F0F0F] text-white ring-2 ring-primary shadow-xl lg:scale-105 lg:-my-4 lg:py-10"
                  : "bg-card border border-border hover:border-primary/30 hover:shadow-lg"
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-white text-xs font-semibold">
                  MOST POPULAR
                </div>
              )}

              {/* Icon & Plan Name */}
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  plan.highlighted ? "bg-primary" : "bg-primary/10"
                }`}>
                  <plan.icon className={`w-5 h-5 ${plan.highlighted ? "text-white" : "text-primary"}`} />
                </div>
                <h3 className={`text-lg font-semibold ${plan.highlighted ? "text-white" : "text-foreground"}`}>
                  {plan.name}
                </h3>
              </div>

              {/* Price */}
              <div className="mt-6">
                <div className="flex items-baseline gap-1">
                  <span className={`text-4xl font-bold ${plan.highlighted ? "text-white" : "text-foreground"}`}>
                    ${plan.price}
                  </span>
                  <span className={`text-sm ${plan.highlighted ? "text-white/60" : "text-muted-foreground"}`}>
                    /{plan.period}
                  </span>
                </div>
                <p className={`mt-1 text-sm ${plan.highlighted ? "text-white/70" : "text-muted-foreground"}`}>
                  {plan.description}
                </p>
              </div>

              {/* Credits Badge */}
              <div className={`mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                plan.highlighted ? "bg-primary/20 text-primary" : "bg-primary/10 text-primary"
              }`}>
                <span className="text-lg font-bold">{plan.credits}</span>
                <span className="text-sm">{plan.creditsLabel}</span>
              </div>

              {/* Features */}
              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature.text} className="flex items-start gap-3">
                    {feature.included ? (
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                        plan.highlighted ? "bg-success/20" : "bg-success/10"
                      }`}>
                        <Check className="w-3 h-3 text-success" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-muted">
                        <X className="w-3 h-3 text-muted-foreground" />
                      </div>
                    )}
                    <span className={`text-sm ${
                      feature.included
                        ? plan.highlighted ? "text-white" : "text-foreground"
                        : plan.highlighted ? "text-white/40" : "text-muted-foreground"
                    }`}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div className="mt-8">
                <Button
                  className={`w-full ${
                    plan.highlighted
                      ? "bg-primary hover:bg-primary-hover text-white"
                      : ""
                  }`}
                  variant={plan.highlighted ? "default" : "outline"}
                  size="lg"
                  asChild
                >
                  <Link href={plan.href}>{plan.cta}</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Note */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground">
            All paid plans include a <span className="text-foreground font-medium">7-day free trial</span>.
            Cancel anytime.{" "}
            <Link href="#faq" className="text-primary hover:underline font-medium">
              Questions?
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

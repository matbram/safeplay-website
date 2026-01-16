"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: 0,
    period: "forever",
    description: "Try SafePlay risk-free with limited credits each month.",
    credits: "30 credits/month",
    features: [
      { text: "30 minutes of filtering per month", included: true },
      { text: "Mute or bleep options", included: true },
      { text: "Cached video access", included: true },
      { text: "Custom word filters", included: false },
      { text: "Family profiles", included: false },
      { text: "Priority support", included: false },
    ],
    cta: "Get Started Free",
    href: "/signup?plan=free",
    popular: false,
  },
  {
    name: "Individual",
    price: 9.99,
    period: "month",
    description: "Perfect for personal use with generous monthly credits.",
    credits: "750 credits/month",
    features: [
      { text: "750 minutes of filtering per month", included: true },
      { text: "Mute or bleep options", included: true },
      { text: "Cached video access", included: true },
      { text: "Custom word filters", included: true },
      { text: "Up to 3 profiles", included: true },
      { text: "Email support", included: true },
    ],
    cta: "Start Free Trial",
    href: "/signup?plan=individual",
    popular: true,
  },
  {
    name: "Family",
    price: 19.99,
    period: "month",
    description: "Share with your whole family with parental controls.",
    credits: "1,500 credits/month",
    features: [
      { text: "1,500 minutes of filtering per month", included: true },
      { text: "Mute or bleep options", included: true },
      { text: "Cached video access", included: true },
      { text: "Custom word filters", included: true },
      { text: "Up to 10 profiles", included: true },
      { text: "Parental controls & history", included: true },
    ],
    cta: "Start Free Trial",
    href: "/signup?plan=family",
    popular: false,
  },
  {
    name: "Organization",
    price: 49.99,
    period: "month",
    description: "For schools, churches, and businesses with team features.",
    credits: "3,750 credits/month",
    features: [
      { text: "3,750 minutes of filtering per month", included: true },
      { text: "Mute or bleep options", included: true },
      { text: "Cached video access", included: true },
      { text: "Custom word filters", included: true },
      { text: "Unlimited team members", included: true },
      { text: "Admin dashboard & priority support", included: true },
    ],
    cta: "Contact Sales",
    href: "/contact?type=enterprise",
    popular: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-20 lg:py-32 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
              Simple, Transparent{" "}
              <span className="gradient-text">Pricing</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Choose the plan that fits your needs. All plans include access to our Chrome extension and core features.
            </p>
          </motion.div>
        </div>

        {/* Pricing Cards */}
        <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative rounded-2xl p-6 ${
                plan.popular
                  ? "bg-primary text-white ring-4 ring-primary/20 scale-105"
                  : "bg-card border"
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-secondary text-white">
                  Most Popular
                </Badge>
              )}

              {/* Plan Name */}
              <h3
                className={`text-lg font-semibold ${
                  plan.popular ? "text-white" : "text-foreground"
                }`}
              >
                {plan.name}
              </h3>

              {/* Price */}
              <div className="mt-4 flex items-baseline gap-1">
                <span
                  className={`text-4xl font-bold ${
                    plan.popular ? "text-white" : "text-foreground"
                  }`}
                >
                  ${plan.price}
                </span>
                <span
                  className={`text-sm ${
                    plan.popular ? "text-white/70" : "text-muted-foreground"
                  }`}
                >
                  /{plan.period}
                </span>
              </div>

              {/* Description */}
              <p
                className={`mt-2 text-sm ${
                  plan.popular ? "text-white/80" : "text-muted-foreground"
                }`}
              >
                {plan.description}
              </p>

              {/* Credits Badge */}
              <div
                className={`mt-4 inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  plan.popular
                    ? "bg-white/20 text-white"
                    : "bg-primary-light text-primary"
                }`}
              >
                {plan.credits}
              </div>

              {/* Features */}
              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature.text} className="flex items-start gap-3">
                    {feature.included ? (
                      <Check
                        className={`w-5 h-5 flex-shrink-0 ${
                          plan.popular ? "text-white" : "text-success"
                        }`}
                      />
                    ) : (
                      <X
                        className={`w-5 h-5 flex-shrink-0 ${
                          plan.popular ? "text-white/40" : "text-muted-foreground/40"
                        }`}
                      />
                    )}
                    <span
                      className={`text-sm ${
                        feature.included
                          ? plan.popular
                            ? "text-white"
                            : "text-foreground"
                          : plan.popular
                          ? "text-white/40"
                          : "text-muted-foreground/60"
                      }`}
                    >
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div className="mt-8">
                <Button
                  className="w-full"
                  variant={plan.popular ? "secondary" : "default"}
                  asChild
                >
                  <Link href={plan.href}>{plan.cta}</Link>
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* FAQ Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-16 text-center"
        >
          <p className="text-muted-foreground">
            Have questions about pricing?{" "}
            <Link href="/faq" className="text-primary hover:underline font-medium">
              Check our FAQ
            </Link>{" "}
            or{" "}
            <Link href="/contact" className="text-primary hover:underline font-medium">
              contact us
            </Link>
            .
          </p>
        </motion.div>
      </div>
    </section>
  );
}

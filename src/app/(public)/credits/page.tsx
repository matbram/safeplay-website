"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Coins,
  Clock,
  Play,
  RefreshCw,
  TrendingUp,
  Zap,
  Users,
  Building,
  Check,
  ArrowRight,
  Calculator,
  Sparkles,
  Info,
  Gift,
  ShoppingCart,
} from "lucide-react";

// Plan data
const plans = [
  {
    id: "free",
    name: "Free",
    credits: 30,
    price: 0,
    pricePerCredit: 0,
    icon: Sparkles,
  },
  {
    id: "individual",
    name: "Individual",
    credits: 750,
    price: 9.99,
    pricePerCredit: 0.0133,
    icon: Zap,
    popular: true,
  },
  {
    id: "family",
    name: "Family",
    credits: 1500,
    price: 19.99,
    pricePerCredit: 0.0133,
    icon: Users,
  },
  {
    id: "organization",
    name: "Organization",
    credits: 3750,
    price: 49.99,
    pricePerCredit: 0.0133,
    icon: Building,
  },
];

// Top-up packs (priced higher than plan credits)
const topUpPacks = [
  { credits: 100, price: 2.99, pricePerCredit: 0.0299 },
  { credits: 250, price: 5.99, pricePerCredit: 0.024 },
  { credits: 500, price: 9.99, pricePerCredit: 0.02 },
  { credits: 1000, price: 17.99, pricePerCredit: 0.018 },
];

export default function CreditsPage() {
  // Calculator state
  const [videosPerWeek, setVideosPerWeek] = useState(5);
  const [avgVideoLength, setAvgVideoLength] = useState(20);
  const [rewatchPercent, setRewatchPercent] = useState(20);

  // Calculate monthly credit needs
  const monthlyNeeds = useMemo(() => {
    const videosPerMonth = videosPerWeek * 4.33; // avg weeks per month
    const newVideosPercent = (100 - rewatchPercent) / 100;
    const newVideosPerMonth = videosPerMonth * newVideosPercent;
    const creditsNeeded = Math.ceil(newVideosPerMonth * avgVideoLength);
    return creditsNeeded;
  }, [videosPerWeek, avgVideoLength, rewatchPercent]);

  // Recommend a plan
  const recommendedPlan = useMemo(() => {
    if (monthlyNeeds <= 30) return plans[0];
    if (monthlyNeeds <= 750) return plans[1];
    if (monthlyNeeds <= 1500) return plans[2];
    return plans[3];
  }, [monthlyNeeds]);

  return (
    <>
      <Header />
      <main className="pt-16">
        {/* Hero */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <Coins className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">Understanding Credits</span>
              </div>

              <h1 className="heading-display text-foreground">
                How <span className="gradient-text">Credits</span> Work
              </h1>

              <p className="mt-6 text-lg text-muted-foreground">
                Our simple credit system makes it easy to understand exactly what you&apos;re paying for.
                No hidden fees, no complicated math — just straightforward pricing.
              </p>
            </div>
          </div>
        </section>

        {/* Core Concept */}
        <section className="py-12 bg-background-secondary">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              {/* Big equation */}
              <div className="text-center p-8 lg:p-12 rounded-2xl bg-card border border-border">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Coins className="w-8 h-8 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="text-3xl font-bold text-foreground">1 Credit</p>
                      <p className="text-muted-foreground">Simple unit</p>
                    </div>
                  </div>

                  <span className="text-4xl font-bold text-primary">=</span>

                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Clock className="w-8 h-8 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="text-3xl font-bold text-foreground">1 Minute</p>
                      <p className="text-muted-foreground">of video audio</p>
                    </div>
                  </div>
                </div>

                <p className="mt-8 text-lg text-muted-foreground max-w-2xl mx-auto">
                  A 17-minute video costs 17 credits. A 92-minute movie costs 92 credits.
                  We show you the exact cost before you confirm.
                </p>
              </div>

              {/* Key Points */}
              <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl bg-card border border-border">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
                    <Play className="w-6 h-6 text-blue-500" />
                  </div>
                  <h3 className="font-semibold text-foreground">Know Before You Filter</h3>
                  <p className="mt-2 text-muted-foreground text-sm">
                    Before processing any video, we show you the exact credit cost based on video length.
                    No surprises.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-card border border-border">
                  <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-4">
                    <RefreshCw className="w-6 h-6 text-green-500" />
                  </div>
                  <h3 className="font-semibold text-foreground">Re-watch Free</h3>
                  <p className="mt-2 text-muted-foreground text-sm">
                    Once you&apos;ve filtered a video, watching it again is completely free.
                    Your credits are only used for new videos.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-card border border-border">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4">
                    <TrendingUp className="w-6 h-6 text-purple-500" />
                  </div>
                  <h3 className="font-semibold text-foreground">Credits Roll Over</h3>
                  <p className="mt-2 text-muted-foreground text-sm">
                    Unused credits automatically roll over each month for up to 12 months.
                    Use what you need, save the rest.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Calculator */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                  <Calculator className="w-4 h-4" />
                  Credit Calculator
                </div>
                <h2 className="heading-1 text-foreground">
                  Find Your <span className="gradient-text">Perfect Plan</span>
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Answer a few questions to see how many credits you&apos;ll need each month.
                </p>
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                {/* Calculator Inputs */}
                <div className="p-8 rounded-2xl bg-card border border-border">
                  <h3 className="text-lg font-semibold text-foreground mb-6">Your Viewing Habits</h3>

                  <div className="space-y-8">
                    {/* Videos per week */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <Label htmlFor="videosPerWeek" className="text-foreground">
                          Videos you filter per week
                        </Label>
                        <span className="text-2xl font-bold text-primary">{videosPerWeek}</span>
                      </div>
                      <input
                        id="videosPerWeek"
                        type="range"
                        min="1"
                        max="30"
                        value={videosPerWeek}
                        onChange={(e) => setVideosPerWeek(Number(e.target.value))}
                        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>1</span>
                        <span>30</span>
                      </div>
                    </div>

                    {/* Average video length */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <Label htmlFor="avgLength" className="text-foreground">
                          Average video length (minutes)
                        </Label>
                        <span className="text-2xl font-bold text-primary">{avgVideoLength}</span>
                      </div>
                      <input
                        id="avgLength"
                        type="range"
                        min="5"
                        max="120"
                        step="5"
                        value={avgVideoLength}
                        onChange={(e) => setAvgVideoLength(Number(e.target.value))}
                        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>5 min</span>
                        <span>2 hours</span>
                      </div>
                    </div>

                    {/* Rewatch percentage */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <Label htmlFor="rewatch" className="text-foreground">
                          Videos you re-watch (free!)
                        </Label>
                        <span className="text-2xl font-bold text-success">{rewatchPercent}%</span>
                      </div>
                      <input
                        id="rewatch"
                        type="range"
                        min="0"
                        max="80"
                        step="10"
                        value={rewatchPercent}
                        onChange={(e) => setRewatchPercent(Number(e.target.value))}
                        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-success"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>All new</span>
                        <span>Mostly rewatches</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Results */}
                <div className="p-8 rounded-2xl bg-[#0F0F0F] text-white">
                  <h3 className="text-lg font-semibold mb-6">Your Recommendation</h3>

                  {/* Monthly credits needed */}
                  <div className="text-center py-6 px-4 rounded-xl bg-white/5 mb-6">
                    <p className="text-white/60 text-sm mb-2">You&apos;ll need approximately</p>
                    <p className="text-5xl font-bold text-primary">{monthlyNeeds.toLocaleString()}</p>
                    <p className="text-white/60 text-sm mt-2">credits per month</p>
                  </div>

                  {/* Recommended plan */}
                  <div className="p-4 rounded-xl bg-primary/20 border border-primary/30 mb-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                        <recommendedPlan.icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold">{recommendedPlan.name} Plan</p>
                        <p className="text-sm text-white/60">
                          {recommendedPlan.credits.toLocaleString()} credits/month
                        </p>
                      </div>
                    </div>
                    <p className="text-2xl font-bold">
                      ${recommendedPlan.price}
                      <span className="text-sm font-normal text-white/60">/month</span>
                    </p>
                  </div>

                  {/* Buffer info */}
                  <div className="flex items-start gap-3 text-sm text-white/60 mb-6">
                    <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <p>
                      This plan gives you {Math.round(((recommendedPlan.credits - monthlyNeeds) / monthlyNeeds) * 100)}%
                      buffer. Unused credits roll over for up to 12 months.
                    </p>
                  </div>

                  <Button className="w-full bg-primary hover:bg-primary-hover" size="lg" asChild>
                    <Link href={`/signup?plan=${recommendedPlan.id}`}>
                      Get Started with {recommendedPlan.name}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Credit Rollover & Expiry */}
        <section className="py-20 bg-background-secondary">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="heading-1 text-foreground">
                  Credit <span className="gradient-text">Rollover</span>
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Your credits don&apos;t disappear at the end of each month.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="p-8 rounded-2xl bg-card border border-border">
                  <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center mb-4">
                    <Gift className="w-6 h-6 text-success" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">12-Month Rollover</h3>
                  <p className="text-muted-foreground mb-4">
                    Unused credits from your monthly allocation automatically roll over and remain usable
                    for up to 12 months from when they were granted.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-success" />
                      Current month credits used first
                    </li>
                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-success" />
                      Oldest credits used before newer ones
                    </li>
                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-success" />
                      We&apos;ll notify you before credits expire
                    </li>
                  </ul>
                </div>

                <div className="p-8 rounded-2xl bg-card border border-border">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <ShoppingCart className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">Top-Up Credits Never Expire</h3>
                  <p className="text-muted-foreground mb-4">
                    Credits purchased as top-up packs (outside your subscription) never expire.
                    They&apos;re used after your monthly allocation is depleted.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-success" />
                      Buy once, use anytime
                    </li>
                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-success" />
                      Perfect for occasional extra usage
                    </li>
                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-success" />
                      Carry over even if you cancel
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Top-Up Packs */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                  <ShoppingCart className="w-4 h-4" />
                  Need More Credits?
                </div>
                <h2 className="heading-1 text-foreground">
                  Credit <span className="gradient-text">Top-Up Packs</span>
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Run out of credits? Purchase a one-time top-up pack. These credits never expire.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {topUpPacks.map((pack) => (
                  <div
                    key={pack.credits}
                    className="p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all text-center"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Coins className="w-6 h-6 text-primary" />
                    </div>
                    <p className="text-3xl font-bold text-foreground">{pack.credits}</p>
                    <p className="text-muted-foreground text-sm">credits</p>
                    <div className="my-4 py-3 border-t border-b border-border">
                      <p className="text-2xl font-bold text-foreground">${pack.price}</p>
                      <p className="text-xs text-muted-foreground">
                        ${pack.pricePerCredit.toFixed(3)}/credit
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      Buy Now
                    </Button>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-4 rounded-xl bg-muted/50 text-center">
                <p className="text-sm text-muted-foreground">
                  <Info className="w-4 h-4 inline mr-1" />
                  Top-up credits are priced higher than plan credits. For regular usage, a subscription plan offers better value.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How Credits Are Used */}
        <section className="py-20 bg-background-secondary">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="heading-1 text-foreground">
                  Credit <span className="gradient-text">Priority</span>
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Here&apos;s the order in which your credits are used:
                </p>
              </div>

              <div className="space-y-4">
                {[
                  {
                    step: 1,
                    title: "Current Month's Allocation",
                    description: "Credits from your current billing cycle are used first.",
                    color: "bg-blue-500",
                  },
                  {
                    step: 2,
                    title: "Rollover Credits (Oldest First)",
                    description: "Unused credits from previous months, starting with the oldest to prevent expiration.",
                    color: "bg-purple-500",
                  },
                  {
                    step: 3,
                    title: "Top-Up Credits",
                    description: "One-time purchased credits are used last since they never expire.",
                    color: "bg-primary",
                  },
                ].map((item) => (
                  <div
                    key={item.step}
                    className="flex items-start gap-4 p-6 rounded-2xl bg-card border border-border"
                  >
                    <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center text-white font-bold flex-shrink-0`}>
                      {item.step}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{item.title}</h3>
                      <p className="mt-1 text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Compare Plans */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="heading-1 text-foreground">
                  Compare <span className="gradient-text">Plans</span>
                </h2>
                <p className="mt-4 text-muted-foreground">
                  See which plan gives you the best value for your needs.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-4 px-4 font-medium text-muted-foreground">Plan</th>
                      <th className="text-center py-4 px-4 font-medium text-muted-foreground">Credits</th>
                      <th className="text-center py-4 px-4 font-medium text-muted-foreground">Price</th>
                      <th className="text-center py-4 px-4 font-medium text-muted-foreground">Per Credit</th>
                      <th className="text-center py-4 px-4 font-medium text-muted-foreground">Video Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plans.map((plan) => (
                      <tr
                        key={plan.id}
                        className={`border-b border-border ${plan.popular ? "bg-primary/5" : ""}`}
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              plan.popular ? "bg-primary text-white" : "bg-muted"
                            }`}>
                              <plan.icon className="w-4 h-4" />
                            </div>
                            <span className="font-medium text-foreground">{plan.name}</span>
                            {plan.popular && (
                              <span className="px-2 py-0.5 rounded text-xs font-medium bg-primary text-white">
                                Popular
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="text-center py-4 px-4 font-semibold text-foreground">
                          {plan.credits.toLocaleString()}
                        </td>
                        <td className="text-center py-4 px-4 text-foreground">
                          ${plan.price}/mo
                        </td>
                        <td className="text-center py-4 px-4 text-muted-foreground">
                          {plan.price === 0 ? "Free" : `$${plan.pricePerCredit.toFixed(3)}`}
                        </td>
                        <td className="text-center py-4 px-4 text-muted-foreground">
                          {Math.round(plan.credits / 60)} hrs
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-8 text-center">
                <Button size="lg" asChild>
                  <Link href="/pricing">
                    View Full Pricing Details
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Dashboard Preview */}
        <section className="py-20 bg-background-secondary">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="heading-1 text-foreground mb-4">
                Track Your <span className="gradient-text">Usage</span>
              </h2>
              <p className="text-muted-foreground mb-8">
                Your dashboard shows everything you need to manage your credits.
              </p>

              {/* Mock Dashboard Card */}
              <div className="p-8 rounded-2xl bg-card border border-border text-left">
                <div className="grid sm:grid-cols-4 gap-6 mb-8">
                  <div className="p-4 rounded-xl bg-muted/50">
                    <p className="text-sm text-muted-foreground">Available Credits</p>
                    <p className="text-3xl font-bold text-foreground">523</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/50">
                    <p className="text-sm text-muted-foreground">Used This Cycle</p>
                    <p className="text-3xl font-bold text-foreground">227</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/50">
                    <p className="text-sm text-muted-foreground">Rollover Credits</p>
                    <p className="text-3xl font-bold text-foreground">156</p>
                  </div>
                  <div className="p-4 rounded-xl bg-warning/10">
                    <p className="text-sm text-muted-foreground">Expiring Soon</p>
                    <p className="text-3xl font-bold text-warning">42</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Play className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Last filtered: &quot;Nature Documentary - Ocean Life&quot;</p>
                      <p className="text-sm text-muted-foreground">45 credits used • 2 hours ago</p>
                    </div>
                  </div>
                  <span className="text-sm text-success font-medium">12 words filtered</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="heading-1 text-foreground">Ready to Get Started?</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Try SafePlay free with 30 credits. No credit card required.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="xl" asChild>
                <Link href="/signup">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button size="xl" variant="outline" asChild>
                <Link href="/pricing">View All Plans</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

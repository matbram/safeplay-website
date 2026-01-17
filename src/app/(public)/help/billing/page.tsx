import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { ArrowLeft, CreditCard, Coins, RefreshCw, ArrowUpCircle, XCircle, Wallet, Receipt, CheckCircle, Lightbulb, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Billing & Credits - SafePlay Help Center",
  description: "Understand credits, billing, payments, and subscription management.",
};

export default function HelpCategoryPage() {
  return (
    <>
      <Header />
      <main className="pt-16">
        <section className="py-12 lg:py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            {/* Back link */}
            <Link
              href="/help"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Help Center
            </Link>

            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <CreditCard className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Billing & Credits</h1>
                <p className="text-muted-foreground">Plans, payments, credits, and refunds</p>
              </div>
            </div>

            {/* Quick Links */}
            <div className="mb-12 p-4 rounded-xl bg-muted/50 border border-border">
              <p className="text-sm font-medium text-foreground mb-3">Quick Links</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "how-credits-work", title: "How Credits Work" },
                  { id: "credit-rollover", title: "Credit Rollover" },
                  { id: "top-up-credits", title: "Top-Up Credits" },
                  { id: "change-plan", title: "Change Plan" },
                  { id: "cancel-subscription", title: "Cancel" },
                  { id: "payment-methods", title: "Payment Methods" },
                  { id: "refunds", title: "Refunds" },
                ].map((article) => (
                  <a
                    key={article.id}
                    href={`#${article.id}`}
                    className="px-3 py-1.5 rounded-full bg-background text-sm text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  >
                    {article.title}
                  </a>
                ))}
              </div>
            </div>

            {/* Articles */}
            <div className="space-y-12">
              {/* Article 1 - How Credits Work */}
              <article id="how-credits-work" className="scroll-mt-24">
                <div className="p-8 rounded-2xl bg-card border border-border">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Coins className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">How Credits Work</h2>
                  </div>

                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 mb-6">
                    <p className="text-lg font-semibold text-foreground">
                      1 credit = 1 minute of video
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Simple and predictable. A 17-minute video costs 17 credits. A 92-minute movie costs 92 credits.
                    </p>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="p-4 rounded-xl bg-muted/50 border border-border">
                      <p className="font-semibold text-foreground">Re-watching is Free</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Once you&apos;ve filtered a video, you can watch it again anytime without using more credits.
                        Your filtered videos are saved to your account.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-muted/50 border border-border">
                      <p className="font-semibold text-foreground">Credit Priority</p>
                      <p className="text-sm text-muted-foreground mt-2 mb-3">
                        When you filter a video, credits are used in this order:
                      </p>
                      <ol className="space-y-2">
                        {[
                          "Current month's allocation (used first)",
                          "Rollover credits from previous months (oldest first)",
                          "Top-up credits you've purchased (used last, since they never expire)",
                        ].map((item, i) => (
                          <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="w-6 h-6 rounded bg-primary/10 text-primary text-xs flex items-center justify-center flex-shrink-0">
                              {i + 1}
                            </span>
                            {item}
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>

                  <Link
                    href="/credits"
                    className="inline-flex items-center gap-2 text-primary hover:underline"
                  >
                    Learn more on our Credits page
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </article>

              {/* Article 2 - Credit Rollover */}
              <article id="credit-rollover" className="scroll-mt-24">
                <div className="p-8 rounded-2xl bg-card border border-border">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <RefreshCw className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">Credit Rollover & Expiration</h2>
                  </div>

                  <p className="text-muted-foreground mb-6">
                    Don&apos;t worry about losing unused credits — they roll over automatically.
                  </p>

                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-muted/50 border border-border">
                      <p className="font-semibold text-foreground">12-Month Rollover</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Unused credits from your monthly allocation roll over and remain usable for up to 12 months
                        from when they were originally granted.
                      </p>
                    </div>

                    <div className="p-5 rounded-xl bg-[#0F0F0F] text-white">
                      <p className="font-semibold mb-3">Example</p>
                      <ul className="space-y-2 text-sm text-white/80">
                        <li>• January: You get 750 credits, use 500, so 250 roll over</li>
                        <li>• February: You get 750 + 250 rollover = 1,000 available</li>
                        <li>• Those 250 January credits expire the following January</li>
                      </ul>
                    </div>

                    <div className="p-4 rounded-xl bg-muted/50 border border-border flex items-start gap-4">
                      <Lightbulb className="w-6 h-6 text-warning flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-foreground">Expiration Notifications</p>
                        <p className="text-sm text-muted-foreground">
                          We&apos;ll email you before credits expire so you have time to use them.
                        </p>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                      <p className="font-semibold text-foreground">Top-Up Credits Never Expire</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Credits purchased as one-time top-ups don&apos;t have an expiration date. They remain in your account
                        until you use them, even if you cancel your subscription.
                      </p>
                    </div>
                  </div>
                </div>
              </article>

              {/* Article 3 - Top-Up Credits */}
              <article id="top-up-credits" className="scroll-mt-24">
                <div className="p-8 rounded-2xl bg-card border border-border">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">Purchasing Top-Up Credits</h2>
                  </div>

                  <p className="text-muted-foreground mb-6">
                    Need more credits? Purchase a one-time top-up pack anytime.
                  </p>

                  <div className="grid sm:grid-cols-2 gap-3 mb-6">
                    {[
                      { credits: "100", price: "$2.99", per: "$0.030/credit" },
                      { credits: "250", price: "$5.99", per: "$0.024/credit" },
                      { credits: "500", price: "$9.99", per: "$0.020/credit" },
                      { credits: "1,000", price: "$17.99", per: "$0.018/credit" },
                    ].map((pack) => (
                      <div key={pack.credits} className="p-4 rounded-xl bg-muted/50 border border-border">
                        <p className="font-semibold text-foreground">{pack.credits} credits</p>
                        <p className="text-lg font-bold text-primary">{pack.price}</p>
                        <p className="text-xs text-muted-foreground">{pack.per}</p>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 rounded-xl bg-muted/50 border border-border mb-4">
                    <p className="font-semibold text-foreground mb-3">How to Purchase</p>
                    <ol className="space-y-2">
                      {[
                        "Go to Billing in your dashboard",
                        "Click \"Buy Credits\" or \"Top Up\"",
                        "Select your pack size",
                        "Complete the purchase",
                      ].map((step, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="w-6 h-6 rounded bg-primary/10 text-primary text-xs flex items-center justify-center flex-shrink-0">
                            {i + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div className="p-4 rounded-xl bg-muted/50 border border-border flex items-start gap-4">
                    <Lightbulb className="w-6 h-6 text-warning flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Good to Know</p>
                      <p className="text-sm text-muted-foreground">
                        Top-up credits are priced higher than plan credits. Subscribing is better value for regular use.
                        However, top-up credits never expire and are used last.
                      </p>
                    </div>
                  </div>
                </div>
              </article>

              {/* Article 4 - Change Plan */}
              <article id="change-plan" className="scroll-mt-24">
                <div className="p-8 rounded-2xl bg-card border border-border">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <ArrowUpCircle className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">Upgrading or Downgrading Your Plan</h2>
                  </div>

                  <p className="text-muted-foreground mb-6">
                    You can change your subscription plan anytime.
                  </p>

                  <div className="grid sm:grid-cols-2 gap-4 mb-6">
                    <div className="p-5 rounded-xl bg-card border-2 border-green-500/30">
                      <p className="font-semibold text-foreground mb-3">Upgrading</p>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          New credits added immediately
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          Prorated charge for current cycle
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          Future billing at new rate
                        </li>
                      </ul>
                    </div>

                    <div className="p-5 rounded-xl bg-card border-2 border-amber-500/30">
                      <p className="font-semibold text-foreground mb-3">Downgrading</p>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                          Takes effect next billing date
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                          Keep current credits until then
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                          Rollover credits preserved
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-muted/50 border border-border">
                    <p className="font-semibold text-foreground mb-3">How to Change Plans</p>
                    <ol className="space-y-2">
                      {[
                        "Go to Billing in your dashboard",
                        "Click \"Change Plan\"",
                        "Select your new plan",
                        "Confirm the change",
                      ].map((step, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="w-6 h-6 rounded bg-primary/10 text-primary text-xs flex items-center justify-center flex-shrink-0">
                            {i + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </article>

              {/* Article 5 - Cancel Subscription */}
              <article id="cancel-subscription" className="scroll-mt-24">
                <div className="p-8 rounded-2xl bg-card border border-border">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <XCircle className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">Canceling Your Subscription</h2>
                  </div>

                  <p className="text-muted-foreground mb-6">
                    You can cancel your subscription anytime with no penalty.
                  </p>

                  <div className="p-5 rounded-xl bg-muted/50 border border-border mb-6">
                    <p className="font-semibold text-foreground mb-3">What Happens When You Cancel</p>
                    <ul className="space-y-2">
                      {[
                        "You keep access until the end of your current billing period",
                        "You won't be charged again",
                        "Your remaining credits stay usable until they expire",
                        "Top-up credits remain forever",
                        "Your filtered videos remain accessible",
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                          <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-muted/50 border border-border mb-4">
                    <p className="font-semibold text-foreground mb-3">How to Cancel</p>
                    <ol className="space-y-2">
                      {[
                        "Go to Billing in your dashboard",
                        "Click \"Cancel Subscription\"",
                        "Confirm your cancellation",
                        "Optionally, tell us why you're leaving",
                      ].map((step, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="w-6 h-6 rounded bg-primary/10 text-primary text-xs flex items-center justify-center flex-shrink-0">
                            {i + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                    <p className="font-semibold text-foreground">Changed your mind?</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      You can resubscribe anytime. If you do so before your current period ends, your subscription
                      simply continues without interruption.
                    </p>
                  </div>
                </div>
              </article>

              {/* Article 6 - Payment Methods */}
              <article id="payment-methods" className="scroll-mt-24">
                <div className="p-8 rounded-2xl bg-card border border-border">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">Payment Methods & Billing</h2>
                  </div>

                  <p className="text-muted-foreground mb-6">
                    SafePlay accepts major payment methods through our secure payment processor, Stripe.
                  </p>

                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-muted/50 border border-border">
                      <p className="font-semibold text-foreground mb-2">Accepted Payment Methods</p>
                      <div className="flex flex-wrap gap-2">
                        {["Visa", "Mastercard", "American Express", "Discover", "Debit Cards"].map((method) => (
                          <span key={method} className="px-3 py-1 rounded-full bg-background text-sm text-muted-foreground">
                            {method}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-muted/50 border border-border">
                      <p className="font-semibold text-foreground mb-3">Updating Payment Method</p>
                      <ol className="space-y-2">
                        {[
                          "Go to Billing in your dashboard",
                          "Click \"Payment Method\"",
                          "Click \"Update\" and enter new card details",
                          "Save changes",
                        ].map((step, i) => (
                          <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="w-6 h-6 rounded bg-primary/10 text-primary text-xs flex items-center justify-center flex-shrink-0">
                              {i + 1}
                            </span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>

                    <div className="p-4 rounded-xl bg-muted/50 border border-border">
                      <p className="font-semibold text-foreground">Billing Cycle</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Subscriptions are billed monthly on the same date you signed up.
                        All invoices are available in your Billing page for download.
                      </p>
                    </div>
                  </div>
                </div>
              </article>

              {/* Article 7 - Refunds */}
              <article id="refunds" className="scroll-mt-24">
                <div className="p-8 rounded-2xl bg-card border border-border">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Receipt className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">Refund Policy</h2>
                  </div>

                  <p className="text-muted-foreground mb-6">
                    We want you to be happy with SafePlay. Here&apos;s our refund policy:
                  </p>

                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-muted/50 border border-border">
                      <p className="font-semibold text-foreground">Subscription Refunds</p>
                      <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                        <li>• Full refund within 7 days of your first subscription payment</li>
                        <li>• Prorated refunds available on a case-by-case basis after 7 days</li>
                      </ul>
                    </div>

                    <div className="p-4 rounded-xl bg-muted/50 border border-border">
                      <p className="font-semibold text-foreground">Top-Up Credit Refunds</p>
                      <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                        <li>• Unused top-up credits can be refunded within 14 days of purchase</li>
                        <li>• Partially used top-up packs are refunded for the unused portion</li>
                      </ul>
                    </div>

                    <div className="p-5 rounded-xl bg-[#0F0F0F] text-white">
                      <p className="font-semibold mb-3">How to Request a Refund</p>
                      <p className="text-sm text-white/80 mb-3">Email support@safeplay.app with:</p>
                      <ul className="space-y-2 text-sm text-white/80">
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          Your account email
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          Reason for the refund request
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          Which purchase you&apos;d like refunded
                        </li>
                      </ul>
                      <p className="text-sm text-white/60 mt-3">We typically respond within 1-2 business days.</p>
                    </div>
                  </div>
                </div>
              </article>
            </div>

            {/* Help CTA */}
            <div className="mt-12 p-6 rounded-2xl bg-muted/50 border border-border text-center">
              <p className="text-foreground font-medium">Billing question not answered?</p>
              <p className="text-muted-foreground mt-1">
                <Link href="/contact" className="text-primary hover:underline">Contact our support team</Link>
                {" "}and we&apos;ll help you out.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { ArrowLeft, CreditCard, Coins, RefreshCw, AlertCircle } from "lucide-react";

export const metadata = {
  title: "Billing & Credits - SafePlay Help Center",
  description: "Understand credits, billing, payments, and subscription management.",
};

const articles = [
  {
    id: "how-credits-work",
    title: "How Credits Work",
    content: `SafePlay uses a simple credit system where 1 credit = 1 minute of video.

**The Basics**
- A 17-minute video costs 17 credits
- A 92-minute movie costs 92 credits
- We always show you the exact cost before filtering

**Re-watching is Free**
Once you've filtered a video, you can watch it again anytime without using more credits. Your filtered videos are saved to your account.

**Credit Priority**
When you filter a video, credits are used in this order:
1. Current month's allocation (used first)
2. Rollover credits from previous months (oldest first)
3. Top-up credits you've purchased (used last, since they never expire)

**Learn More**
Visit our [Credits page](/credits) for a detailed breakdown and interactive calculator to find the right plan for you.`,
  },
  {
    id: "credit-rollover",
    title: "Credit Rollover & Expiration",
    content: `Don't worry about losing unused credits — they roll over automatically.

**12-Month Rollover**
Unused credits from your monthly allocation roll over and remain usable for up to 12 months from when they were originally granted.

**Example:**
- January: You get 750 credits, use 500, so 250 roll over
- February: You get 750 + 250 rollover = 1,000 available
- Those 250 January credits expire in the following January

**Expiration Notifications**
We'll email you before credits expire so you have time to use them.

**Top-Up Credits Never Expire**
Credits purchased as one-time top-ups don't have an expiration date. They remain in your account until you use them, even if you cancel your subscription.`,
  },
  {
    id: "top-up-credits",
    title: "Purchasing Top-Up Credits",
    content: `Need more credits? Purchase a one-time top-up pack anytime.

**Available Packs**
- 100 credits — $2.99 ($0.030/credit)
- 250 credits — $5.99 ($0.024/credit)
- 500 credits — $9.99 ($0.020/credit)
- 1,000 credits — $17.99 ($0.018/credit)

**How to Purchase**
1. Go to Billing in your dashboard
2. Click "Buy Credits" or "Top Up"
3. Select your pack size
4. Complete the purchase

**Important Notes**
- Top-up credits are priced higher than plan credits (subscribing is better value for regular use)
- Top-up credits never expire
- Top-up credits are used last, after your monthly allocation and rollovers
- Top-up credits stay with your account even if you downgrade or cancel`,
  },
  {
    id: "change-plan",
    title: "Upgrading or Downgrading Your Plan",
    content: `You can change your subscription plan anytime.

**Upgrading**
When you upgrade to a higher plan:
- New credits are added immediately
- You're charged the prorated difference for the current billing cycle
- Future billing reflects your new plan price

**Downgrading**
When you downgrade to a lower plan:
- Change takes effect at your next billing date
- You keep your current credits until then
- Excess rollover credits stay in your account (subject to 12-month expiry)

**How to Change Plans**
1. Go to Billing in your dashboard
2. Click "Change Plan"
3. Select your new plan
4. Confirm the change

**Switching to Free**
If you switch to the Free plan, you'll keep any remaining credits (including rollovers and top-ups) but will only receive 30 new credits per month.`,
  },
  {
    id: "cancel-subscription",
    title: "Canceling Your Subscription",
    content: `You can cancel your subscription anytime with no penalty.

**What Happens When You Cancel**
- You keep access until the end of your current billing period
- You won't be charged again
- Your remaining credits stay usable until they expire
- Top-up credits remain forever
- Your filtered videos remain accessible

**How to Cancel**
1. Go to Billing in your dashboard
2. Click "Cancel Subscription"
3. Confirm your cancellation
4. Optionally, tell us why you're leaving (helps us improve!)

**Reactivating**
Changed your mind? You can resubscribe anytime. If you do so before your current period ends, your subscription simply continues without interruption.

**Data Retention**
After cancellation, we keep your account data for 90 days in case you return. After that, you can request permanent deletion.`,
  },
  {
    id: "payment-methods",
    title: "Payment Methods & Billing",
    content: `SafePlay accepts major payment methods through our secure payment processor, Stripe.

**Accepted Payment Methods**
- Credit cards (Visa, Mastercard, American Express, Discover)
- Debit cards
- Some regional payment methods depending on your location

**Updating Payment Method**
1. Go to Billing in your dashboard
2. Click "Payment Method"
3. Click "Update" and enter your new card details
4. Save changes

**Billing Cycle**
- Subscriptions are billed monthly on the same date you signed up
- If that date doesn't exist (e.g., Feb 30), you're billed on the last day of the month

**Invoices**
All invoices are available in your Billing page. You can download them as PDFs for your records.

**Failed Payments**
If a payment fails, we'll:
1. Email you immediately
2. Retry the payment after a few days
3. If still failing, your account may be downgraded to Free until payment is resolved`,
  },
  {
    id: "refunds",
    title: "Refund Policy",
    content: `We want you to be happy with SafePlay. Here's our refund policy:

**Subscription Refunds**
- You can request a full refund within 7 days of your first subscription payment
- After 7 days, we offer prorated refunds on a case-by-case basis
- Contact support to request a refund

**Top-Up Credit Refunds**
- Unused top-up credits can be refunded within 14 days of purchase
- Partially used top-up packs are refunded for the unused portion
- Contact support with your purchase details

**When We Can't Refund**
- Credits that have already been used to filter videos
- Free plan users (nothing to refund!)
- Subscription renewals more than 30 days old

**How to Request a Refund**
Email support@safeplay.app with:
- Your account email
- Reason for the refund request
- Which purchase you'd like refunded

We typically respond within 1-2 business days.`,
  },
];

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
                {articles.map((article) => (
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
              {articles.map((article) => (
                <article
                  key={article.id}
                  id={article.id}
                  className="scroll-mt-24"
                >
                  <div className="p-8 rounded-2xl bg-card border border-border">
                    <h2 className="text-xl font-semibold text-foreground mb-4">
                      {article.title}
                    </h2>
                    <div className="prose prose-slate dark:prose-invert max-w-none text-muted-foreground">
                      {article.content.split('\n\n').map((paragraph, i) => {
                        if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                          return (
                            <h3 key={i} className="text-lg font-semibold text-foreground mt-6 mb-2 first:mt-0">
                              {paragraph.replace(/\*\*/g, '')}
                            </h3>
                          );
                        }
                        if (paragraph.startsWith('1.') || paragraph.startsWith('-')) {
                          const items = paragraph.split('\n').filter(Boolean);
                          const isNumbered = paragraph.startsWith('1.');
                          const ListTag = isNumbered ? 'ol' : 'ul';
                          return (
                            <ListTag key={i} className={`space-y-2 my-4 ${isNumbered ? 'list-decimal' : 'list-disc'} ml-5`}>
                              {items.map((item, j) => (
                                <li key={j}>
                                  {item.replace(/^\d+\.\s*/, '').replace(/^-\s*/, '').split('**').map((part, k) =>
                                    k % 2 === 1 ? <strong key={k} className="text-foreground">{part}</strong> : part
                                  )}
                                </li>
                              ))}
                            </ListTag>
                          );
                        }
                        return (
                          <p key={i} className="my-4">
                            {paragraph.split(/(\[.*?\]\(.*?\))/).map((part, k) => {
                              const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
                              if (linkMatch) {
                                return <Link key={k} href={linkMatch[2]} className="text-primary hover:underline">{linkMatch[1]}</Link>;
                              }
                              return part.split('**').map((p, l) =>
                                l % 2 === 1 ? <strong key={l} className="text-foreground">{p}</strong> : p
                              );
                            })}
                          </p>
                        );
                      })}
                    </div>
                  </div>
                </article>
              ))}
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

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { ArrowLeft, Chrome, Download, Play, Settings, User, Shield, CheckCircle } from "lucide-react";

export const metadata = {
  title: "Getting Started - SafePlay Help Center",
  description: "Learn how to install and set up SafePlay for the first time.",
};

const articles = [
  {
    id: "install-extension",
    title: "How to Install the Chrome Extension",
    content: `Installing SafePlay takes less than a minute:

1. **Visit the Chrome Web Store**
   - Go to the Chrome Web Store and search for "SafePlay" or use the direct link from our website.

2. **Click "Add to Chrome"**
   - Click the blue "Add to Chrome" button in the top right corner of the extension page.

3. **Confirm the Installation**
   - A popup will ask you to confirm. Click "Add extension" to proceed.

4. **Pin the Extension (Optional)**
   - Click the puzzle piece icon in your browser toolbar, find SafePlay, and click the pin icon to keep it visible.

5. **Sign In**
   - Click the SafePlay icon and sign in with your account credentials. If you don't have an account yet, you can create one for free.

That's it! You're ready to start filtering videos.`,
  },
  {
    id: "first-video",
    title: "Filtering Your First Video",
    content: `Ready to filter your first video? Here's how:

1. **Find a YouTube video** you want to watch with filtered language.

2. **Click the SafePlay icon** in your browser toolbar while on the YouTube video page.

3. **Review the credit cost** - SafePlay will show you how many credits this video will use (1 credit = 1 minute).

4. **Click "Filter Video"** to start the process.

5. **Wait for processing** - This usually takes 1-3 minutes depending on video length.

6. **Watch your filtered video** - Once complete, the video will play with profanity automatically muted or bleeped.

**Tip:** Once you've filtered a video, you can re-watch it anytime without using additional credits.`,
  },
  {
    id: "create-account",
    title: "Creating Your Account",
    content: `Getting started with SafePlay is free and easy:

1. **Visit safeplay.app/signup** or click "Get Started" on our homepage.

2. **Enter your email address** and create a secure password.

3. **Verify your email** - We'll send a confirmation link to your inbox. Click it to verify.

4. **Choose your plan** - Start with the Free plan (30 credits/month) or select a paid plan for more credits.

5. **Set up your profile** - Add your name and configure your initial preferences.

**What you get with a free account:**
- 30 credits per month (enough for 30 minutes of video)
- Access to mute and bleep filtering modes
- Basic viewing history

**Upgrading later:** You can upgrade to a paid plan anytime from your account settings.`,
  },
  {
    id: "dashboard-overview",
    title: "Understanding Your Dashboard",
    content: `Your SafePlay dashboard is your home base. Here's what you'll find:

**Credit Balance**
At the top, you'll see your available credits, including:
- Current month's allocation
- Rollover credits from previous months
- Any top-up credits you've purchased

**Quick Filter**
Enter a YouTube URL to quickly filter a new video without leaving the dashboard.

**Recent Activity**
See your recently filtered videos and quickly re-watch any of them.

**Usage Statistics**
Track how many credits you've used this month and your filtering history over time.

**Navigation**
Use the sidebar to access:
- **Filter** - Filter new videos
- **History** - View all filtered videos
- **Family** - Manage family profiles (paid plans)
- **Settings** - Configure preferences
- **Billing** - Manage subscription and credits`,
  },
  {
    id: "mute-vs-bleep",
    title: "Choosing Between Mute and Bleep",
    content: `SafePlay offers two filtering modes. Here's when to use each:

**Mute Mode**
- Detected words are silenced completely
- The video continues playing with no audio during filtered moments
- Best for: Subtle filtering where you want minimal disruption

**Bleep Mode**
- Detected words are replaced with a classic "bleep" sound
- Makes it clear when something has been filtered
- Best for: When you want to know content was filtered, or for a traditional TV-style experience

**How to Switch Modes**
1. Go to Settings → Filter Preferences
2. Select your preferred mode under "Filter Type"
3. Save your changes

**Note:** Your preference applies to all future videos. Previously filtered videos keep their original filter mode. You can re-filter a video if you want to change its mode.`,
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
                <Chrome className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Getting Started</h1>
                <p className="text-muted-foreground">Installation, setup, and your first filtered video</p>
              </div>
            </div>

            {/* Articles */}
            <div className="space-y-12">
              {articles.map((article, index) => (
                <article
                  key={article.id}
                  id={article.id}
                  className="scroll-mt-24"
                >
                  <div className="p-8 rounded-2xl bg-card border border-border">
                    <h2 className="text-xl font-semibold text-foreground mb-4">
                      {article.title}
                    </h2>
                    <div className="prose prose-slate dark:prose-invert max-w-none">
                      {article.content.split('\n\n').map((paragraph, i) => {
                        if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                          return (
                            <h3 key={i} className="text-lg font-semibold text-foreground mt-6 mb-2">
                              {paragraph.replace(/\*\*/g, '')}
                            </h3>
                          );
                        }
                        if (paragraph.startsWith('1.') || paragraph.startsWith('-')) {
                          const items = paragraph.split('\n').filter(Boolean);
                          const isNumbered = paragraph.startsWith('1.');
                          const ListTag = isNumbered ? 'ol' : 'ul';
                          return (
                            <ListTag key={i} className="space-y-2 my-4">
                              {items.map((item, j) => (
                                <li key={j} className="text-muted-foreground">
                                  {item.replace(/^\d+\.\s*/, '').replace(/^-\s*/, '').split('**').map((part, k) =>
                                    k % 2 === 1 ? <strong key={k} className="text-foreground">{part}</strong> : part
                                  )}
                                </li>
                              ))}
                            </ListTag>
                          );
                        }
                        return (
                          <p key={i} className="text-muted-foreground my-4">
                            {paragraph.split('**').map((part, k) =>
                              k % 2 === 1 ? <strong key={k} className="text-foreground">{part}</strong> : part
                            )}
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
              <p className="text-foreground font-medium">Still have questions?</p>
              <p className="text-muted-foreground mt-1">
                <Link href="/contact" className="text-primary hover:underline">Contact our support team</Link>
                {" "}and we&apos;ll get back to you within 24 hours.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

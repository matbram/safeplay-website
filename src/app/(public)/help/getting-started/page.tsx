import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { ArrowLeft, Chrome, Download, Play, Settings, User, CheckCircle, Lightbulb, Volume2, VolumeX } from "lucide-react";

export const metadata = {
  title: "Getting Started - SafePlay Help Center",
  description: "Learn how to install and set up SafePlay for the first time.",
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
                <Chrome className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Getting Started</h1>
                <p className="text-muted-foreground">Installation, setup, and your first filtered video</p>
              </div>
            </div>

            {/* Quick Links */}
            <div className="mb-12 p-4 rounded-xl bg-muted/50 border border-border">
              <p className="text-sm font-medium text-foreground mb-3">Quick Links</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "install-extension", title: "Install Extension" },
                  { id: "first-video", title: "First Video" },
                  { id: "create-account", title: "Create Account" },
                  { id: "dashboard-overview", title: "Dashboard Overview" },
                  { id: "mute-vs-bleep", title: "Mute vs Bleep" },
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
              {/* Article 1 - Install Extension */}
              <article id="install-extension" className="scroll-mt-24">
                <div className="p-8 rounded-2xl bg-card border border-border">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Download className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">
                      How to Install the Chrome Extension
                    </h2>
                  </div>

                  <p className="text-muted-foreground mb-6">
                    Installing SafePlay takes less than a minute:
                  </p>

                  <div className="space-y-4">
                    {[
                      { step: "1", title: "Visit the Chrome Web Store", desc: "Go to the Chrome Web Store and search for \"SafePlay\" or use the direct link from our website." },
                      { step: "2", title: "Click \"Add to Chrome\"", desc: "Click the blue \"Add to Chrome\" button in the top right corner of the extension page." },
                      { step: "3", title: "Confirm the Installation", desc: "A popup will ask you to confirm. Click \"Add extension\" to proceed." },
                      { step: "4", title: "Pin the Extension (Optional)", desc: "Click the puzzle piece icon in your browser toolbar, find SafePlay, and click the pin icon to keep it visible." },
                      { step: "5", title: "Sign In", desc: "Click the SafePlay icon and sign in with your account credentials. If you don't have an account yet, you can create one for free." },
                    ].map((item) => (
                      <div key={item.step} className="flex items-start gap-4 p-4 rounded-xl bg-muted/50">
                        <span className="w-8 h-8 rounded-full bg-primary text-white font-bold text-sm flex items-center justify-center flex-shrink-0">
                          {item.step}
                        </span>
                        <div>
                          <p className="font-semibold text-foreground">{item.title}</p>
                          <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 p-4 rounded-xl bg-primary/10 border border-primary/20">
                    <p className="text-foreground font-medium">That&apos;s it! You&apos;re ready to start filtering videos.</p>
                  </div>
                </div>
              </article>

              {/* Article 2 - First Video */}
              <article id="first-video" className="scroll-mt-24">
                <div className="p-8 rounded-2xl bg-card border border-border">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Play className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">
                      Filtering Your First Video
                    </h2>
                  </div>

                  <p className="text-muted-foreground mb-6">
                    Ready to filter your first video? Here&apos;s how:
                  </p>

                  <div className="space-y-4">
                    {[
                      { step: "1", title: "Find a YouTube video", desc: "Navigate to any YouTube video you want to watch with filtered language." },
                      { step: "2", title: "Click the SafePlay icon", desc: "Click the SafePlay icon in your browser toolbar while on the YouTube video page." },
                      { step: "3", title: "Review the credit cost", desc: "SafePlay will show you how many credits this video will use (1 credit = 1 minute)." },
                      { step: "4", title: "Click \"Filter Video\"", desc: "Click the button to start the filtering process." },
                      { step: "5", title: "Wait for processing", desc: "This usually takes 1-3 minutes depending on video length." },
                      { step: "6", title: "Watch your filtered video", desc: "Once complete, the video will play with profanity automatically muted or bleeped." },
                    ].map((item) => (
                      <div key={item.step} className="flex items-start gap-4 p-4 rounded-xl bg-muted/50">
                        <span className="w-8 h-8 rounded-full bg-primary text-white font-bold text-sm flex items-center justify-center flex-shrink-0">
                          {item.step}
                        </span>
                        <div>
                          <p className="font-semibold text-foreground">{item.title}</p>
                          <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 p-4 rounded-xl bg-muted/50 border border-border flex items-start gap-4">
                    <Lightbulb className="w-6 h-6 text-warning flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Tip</p>
                      <p className="text-sm text-muted-foreground">
                        Once you&apos;ve filtered a video, you can re-watch it anytime without using additional credits.
                      </p>
                    </div>
                  </div>
                </div>
              </article>

              {/* Article 3 - Create Account */}
              <article id="create-account" className="scroll-mt-24">
                <div className="p-8 rounded-2xl bg-card border border-border">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">
                      Creating Your Account
                    </h2>
                  </div>

                  <p className="text-muted-foreground mb-6">
                    Getting started with SafePlay is free and easy:
                  </p>

                  <div className="space-y-4 mb-6">
                    {[
                      { step: "1", title: "Visit safeplay.app/signup", desc: "Or click \"Get Started\" on our homepage." },
                      { step: "2", title: "Enter your email address", desc: "Create a secure password for your account." },
                      { step: "3", title: "Verify your email", desc: "We'll send a confirmation link to your inbox. Click it to verify." },
                      { step: "4", title: "Choose your plan", desc: "Start with the Free plan (30 credits/month) or select a paid plan for more credits." },
                      { step: "5", title: "Set up your profile", desc: "Add your name and configure your initial preferences." },
                    ].map((item) => (
                      <div key={item.step} className="flex items-start gap-4 p-4 rounded-xl bg-muted/50">
                        <span className="w-8 h-8 rounded-full bg-primary text-white font-bold text-sm flex items-center justify-center flex-shrink-0">
                          {item.step}
                        </span>
                        <div>
                          <p className="font-semibold text-foreground">{item.title}</p>
                          <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-5 rounded-xl bg-[#0F0F0F] text-white">
                    <h3 className="font-semibold mb-3">What you get with a free account:</h3>
                    <ul className="space-y-2">
                      {[
                        "30 credits per month (enough for 30 minutes of video)",
                        "Access to mute and bleep filtering modes",
                        "Basic viewing history",
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-3">
                          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                          <span className="text-white/90">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <p className="mt-4 text-muted-foreground">
                    <strong className="text-foreground">Upgrading later:</strong> You can upgrade to a paid plan anytime from your account settings.
                  </p>
                </div>
              </article>

              {/* Article 4 - Dashboard Overview */}
              <article id="dashboard-overview" className="scroll-mt-24">
                <div className="p-8 rounded-2xl bg-card border border-border">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Settings className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">
                      Understanding Your Dashboard
                    </h2>
                  </div>

                  <p className="text-muted-foreground mb-6">
                    Your SafePlay dashboard is your home base. Here&apos;s what you&apos;ll find:
                  </p>

                  <div className="space-y-4">
                    {[
                      {
                        title: "Credit Balance",
                        desc: "At the top, you'll see your available credits, including current month's allocation, rollover credits from previous months, and any top-up credits you've purchased.",
                      },
                      {
                        title: "Quick Filter",
                        desc: "Enter a YouTube URL to quickly filter a new video without leaving the dashboard.",
                      },
                      {
                        title: "Recent Activity",
                        desc: "See your recently filtered videos and quickly re-watch any of them.",
                      },
                      {
                        title: "Usage Statistics",
                        desc: "Track how many credits you've used this month and your filtering history over time.",
                      },
                    ].map((item) => (
                      <div key={item.title} className="p-4 rounded-xl bg-muted/50 border border-border">
                        <p className="font-semibold text-foreground">{item.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 p-5 rounded-xl bg-muted/50 border border-border">
                    <h3 className="font-semibold text-foreground mb-3">Navigation</h3>
                    <p className="text-sm text-muted-foreground mb-3">Use the sidebar to access:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: "Filter", desc: "Filter new videos" },
                        { label: "History", desc: "View all filtered videos" },
                        { label: "Family", desc: "Manage family profiles" },
                        { label: "Settings", desc: "Configure preferences" },
                        { label: "Billing", desc: "Manage subscription" },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-foreground">{item.label}</span>
                          <span className="text-muted-foreground">— {item.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </article>

              {/* Article 5 - Mute vs Bleep */}
              <article id="mute-vs-bleep" className="scroll-mt-24">
                <div className="p-8 rounded-2xl bg-card border border-border">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Volume2 className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">
                      Choosing Between Mute and Bleep
                    </h2>
                  </div>

                  <p className="text-muted-foreground mb-6">
                    SafePlay offers two filtering modes. Here&apos;s when to use each:
                  </p>

                  <div className="grid sm:grid-cols-2 gap-4 mb-6">
                    <div className="p-5 rounded-xl bg-card border-2 border-blue-500/30">
                      <div className="flex items-center gap-3 mb-3">
                        <VolumeX className="w-6 h-6 text-blue-500" />
                        <h3 className="font-semibold text-foreground">Mute Mode</h3>
                      </div>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• Detected words are silenced completely</li>
                        <li>• Video continues with brief silence</li>
                        <li>• More subtle and natural-feeling</li>
                      </ul>
                      <p className="mt-3 text-sm">
                        <span className="font-medium text-foreground">Best for:</span>{" "}
                        <span className="text-muted-foreground">Subtle filtering with minimal disruption</span>
                      </p>
                    </div>

                    <div className="p-5 rounded-xl bg-card border-2 border-orange-500/30">
                      <div className="flex items-center gap-3 mb-3">
                        <Volume2 className="w-6 h-6 text-orange-500" />
                        <h3 className="font-semibold text-foreground">Bleep Mode</h3>
                      </div>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• Detected words replaced with &quot;bleep&quot;</li>
                        <li>• Classic TV-style censoring</li>
                        <li>• Clear indication of filtering</li>
                      </ul>
                      <p className="mt-3 text-sm">
                        <span className="font-medium text-foreground">Best for:</span>{" "}
                        <span className="text-muted-foreground">Families who want to know when content is filtered</span>
                      </p>
                    </div>
                  </div>

                  <div className="p-5 rounded-xl bg-muted/50 border border-border">
                    <h3 className="font-semibold text-foreground mb-3">How to Switch Modes</h3>
                    <ol className="space-y-2">
                      {[
                        "Go to Settings → Filter Preferences",
                        "Select your preferred mode under \"Filter Type\"",
                        "Save your changes",
                      ].map((step, i) => (
                        <li key={i} className="flex items-center gap-3 text-muted-foreground">
                          <span className="w-6 h-6 rounded bg-primary/10 text-primary text-xs flex items-center justify-center flex-shrink-0">
                            {i + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div className="mt-4 p-4 rounded-xl bg-muted/50 border border-border flex items-start gap-4">
                    <Lightbulb className="w-6 h-6 text-warning flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Note</p>
                      <p className="text-sm text-muted-foreground">
                        Your preference applies to all future videos. Previously filtered videos keep their original filter mode.
                        You can re-filter a video if you want to change its mode.
                      </p>
                    </div>
                  </div>
                </div>
              </article>
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

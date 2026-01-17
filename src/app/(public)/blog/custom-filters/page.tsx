import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock, User, Settings, ArrowRight, CheckCircle, Lightbulb } from "lucide-react";

export const metadata = {
  title: "New Feature: Custom Word Filters - SafePlay Blog",
  description: "We've launched the ability to add your own words to the filter list. Here's how to make the most of it.",
};

export default function BlogPost() {
  return (
    <>
      <Header />
      <main className="pt-16">
        <article className="py-12 lg:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            {/* Back link */}
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Blog
            </Link>

            {/* Header */}
            <header className="mb-12">
              <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                Product Updates
              </span>
              <h1 className="mt-4 text-3xl lg:text-4xl font-bold text-foreground">
                New Feature: Custom Word Filters
              </h1>
              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  SafePlay Team
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  January 5, 2026
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  3 min read
                </span>
              </div>
            </header>

            {/* Featured Image */}
            <div className="aspect-video rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 mb-12 flex items-center justify-center">
              <Settings className="w-24 h-24 text-primary/30" />
            </div>

            {/* Article Content */}
            <div className="space-y-8">
              {/* Intro */}
              <p className="text-xl text-muted-foreground leading-relaxed">
                We&apos;re excited to announce custom word filters — a highly requested feature that
                gives you complete control over what gets filtered in your videos. Available now
                for all paid plans.
              </p>

              {/* Section 1 */}
              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground pt-4 border-t border-border">
                  What Are Custom Filters?
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  SafePlay has always filtered standard profanity automatically. But every family
                  and organization has different standards. Maybe you want to filter crude words
                  that aren&apos;t technically profanity. Maybe there are specific terms you&apos;d
                  rather your children not hear. Maybe you&apos;re running a faith-based organization
                  with specific guidelines.
                </p>
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <p className="text-foreground">
                    <strong>Custom word filters</strong> let you add any words or phrases to your personal filter list.
                    When you filter a video, SafePlay will catch both the standard profanity and your
                    custom additions.
                  </p>
                </div>
              </section>

              {/* Section 2 - Setup Guide */}
              <section className="space-y-6">
                <h2 className="text-2xl font-bold text-foreground pt-4 border-t border-border">
                  How to Set Up Custom Filters
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Setting up your custom filter list takes just a few steps:
                </p>

                <div className="p-6 rounded-xl bg-[#0F0F0F] text-white">
                  <h3 className="text-lg font-semibold mb-6">Quick Setup Guide</h3>
                  <div className="space-y-4">
                    {[
                      { step: "1", title: "Open Settings → Filter Preferences", desc: "Find it in your dashboard sidebar" },
                      { step: "2", title: "Add your custom words", desc: "Enter one word or phrase per line" },
                      { step: "3", title: "Save and you're done!", desc: "Future videos will filter your custom words" }
                    ].map((item) => (
                      <div key={item.step} className="flex items-start gap-4">
                        <span className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-bold flex-shrink-0">
                          {item.step}
                        </span>
                        <div>
                          <p className="font-medium">{item.title}</p>
                          <p className="text-sm text-white/60">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Section 3 - Best Practices */}
              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground pt-4 border-t border-border">
                  Best Practices
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Here are some tips to get the most out of custom filters:
                </p>
                <div className="grid gap-3">
                  {[
                    { icon: "🎯", title: "Be specific", desc: "Add the exact word or phrase you want filtered. \"dang\" won't filter \"danger\"." },
                    { icon: "🔄", title: "Include variations", desc: "If you want to filter a word, consider adding common misspellings or variations." },
                    { icon: "🧪", title: "Test it out", desc: "After adding custom words, try filtering a video you know contains them." },
                    { icon: "📋", title: "Review periodically", desc: "As your needs change, revisit your custom list to add or remove words." }
                  ].map((item) => (
                    <div key={item.title} className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border">
                      <span className="text-2xl">{item.icon}</span>
                      <div>
                        <p className="font-semibold text-foreground">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Section 4 */}
              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground pt-4 border-t border-border">
                  Family Profiles & Custom Filters
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  If you&apos;re on the Family or Organization plan, each profile can have its own
                  custom filter list. This means:
                </p>
                <ul className="space-y-2">
                  {[
                    "Younger children can have stricter filtering than teenagers",
                    "Different family members can customize based on their preferences",
                    "Parents maintain control over what each profile filters"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-muted-foreground">
                      <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  To set profile-specific filters, go to Family Settings, select a profile, and
                  configure their Filter Preferences individually.
                </p>
              </section>

              {/* Section 5 */}
              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground pt-4 border-t border-border">
                  What About Videos I&apos;ve Already Filtered?
                </h2>
                <div className="p-4 rounded-xl bg-muted/50 border border-border flex items-start gap-4">
                  <Lightbulb className="w-6 h-6 text-warning flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-foreground font-medium">Good to know</p>
                    <p className="text-sm text-muted-foreground">
                      Custom filters apply to videos you filter <em>after</em> adding the words. If you&apos;ve
                      already filtered a video and want it to include your new custom words, you&apos;ll need
                      to re-filter it. Don&apos;t worry — you won&apos;t be charged twice for the same video.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 6 - What's Next */}
              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground pt-4 border-t border-border">
                  What&apos;s Next?
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  We&apos;re already working on additional filtering customization options:
                </p>
                <div className="grid sm:grid-cols-3 gap-3">
                  {[
                    { title: "Sensitivity levels", desc: "Filter more or less aggressively" },
                    { title: "Category filtering", desc: "Violence, crude humor, etc." },
                    { title: "Shareable lists", desc: "For organizations" }
                  ].map((item) => (
                    <div key={item.title} className="p-4 rounded-xl bg-card border border-border text-center">
                      <p className="font-semibold text-foreground text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                    </div>
                  ))}
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Stay tuned for more updates, and as always, we love hearing your feedback!
                </p>
              </section>

              {/* CTA Box */}
              <div className="p-6 rounded-xl bg-primary/10 border border-primary/20">
                <h3 className="text-lg font-semibold text-foreground mb-2">Ready to try custom filters?</h3>
                <p className="text-muted-foreground mb-4">
                  Log in to your dashboard and set up your custom word list today.
                </p>
                <Link
                  href="/settings"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-hover transition-colors"
                >
                  Go to Settings
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Author Box */}
            <div className="mt-12 p-6 rounded-2xl bg-muted/50 border border-border">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xl">
                  SP
                </div>
                <div>
                  <p className="font-semibold text-foreground">SafePlay Team</p>
                  <p className="text-sm text-muted-foreground">
                    Tips and insights for families navigating the digital world safely.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}

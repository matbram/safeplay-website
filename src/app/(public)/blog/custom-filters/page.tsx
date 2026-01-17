import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock, User, Settings, Plus, Check } from "lucide-react";

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
              <span className="text-primary font-medium">Product Updates</span>
              <h1 className="mt-4 text-3xl lg:text-4xl font-bold text-foreground">
                New Feature: Custom Word Filters
              </h1>
              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  SafePlay Team
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  January 5, 2026
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  3 min read
                </span>
              </div>
            </header>

            {/* Featured Image Placeholder */}
            <div className="aspect-video rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 mb-12 flex items-center justify-center">
              <Settings className="w-24 h-24 text-primary/30" />
            </div>

            {/* Content */}
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <p className="lead text-xl text-muted-foreground">
                We&apos;re excited to announce custom word filters — a highly requested feature that
                gives you complete control over what gets filtered in your videos. Available now
                for all paid plans.
              </p>

              <h2>What Are Custom Filters?</h2>
              <p>
                SafePlay has always filtered standard profanity automatically. But every family
                and organization has different standards. Maybe you want to filter crude words
                that aren&apos;t technically profanity. Maybe there are specific terms you&apos;d
                rather your children not hear. Maybe you&apos;re running a faith-based organization
                with specific guidelines.
              </p>
              <p>
                Custom word filters let you add any words or phrases to your personal filter list.
                When you filter a video, SafePlay will catch both the standard profanity and your
                custom additions.
              </p>

              <h2>How to Set Up Custom Filters</h2>
              <p>
                Setting up your custom filter list takes just a few steps:
              </p>
              <ol>
                <li>Go to <strong>Settings</strong> in your SafePlay dashboard</li>
                <li>Click on <strong>Filter Preferences</strong></li>
                <li>Scroll to the <strong>Custom Words</strong> section</li>
                <li>Add words or phrases, one per line</li>
                <li>Click <strong>Save Changes</strong></li>
              </ol>
              <p>
                That&apos;s it! Your custom words will now be filtered in all future videos you process.
              </p>

              {/* Visual Guide */}
              <div className="not-prose my-8 p-6 rounded-2xl bg-muted/50 border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4">Quick Setup Guide</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-semibold">1</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Open Settings → Filter Preferences</p>
                      <p className="text-sm text-muted-foreground">Find it in your dashboard sidebar</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-semibold">2</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Add your custom words</p>
                      <p className="text-sm text-muted-foreground">Enter one word or phrase per line</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-semibold">3</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Save and you&apos;re done!</p>
                      <p className="text-sm text-muted-foreground">Future videos will filter your custom words</p>
                    </div>
                  </div>
                </div>
              </div>

              <h2>Best Practices</h2>
              <p>
                Here are some tips to get the most out of custom filters:
              </p>
              <ul>
                <li>
                  <strong>Be specific:</strong> Add the exact word or phrase you want filtered.
                  &quot;dang&quot; won&apos;t filter &quot;danger&quot;.
                </li>
                <li>
                  <strong>Include variations:</strong> If you want to filter a word, consider adding
                  common misspellings or variations.
                </li>
                <li>
                  <strong>Test it out:</strong> After adding custom words, try filtering a video
                  you know contains them to make sure it&apos;s working as expected.
                </li>
                <li>
                  <strong>Review periodically:</strong> As your needs change, revisit your custom
                  list to add or remove words.
                </li>
              </ul>

              <h2>Family Profiles & Custom Filters</h2>
              <p>
                If you&apos;re on the Family or Organization plan, each profile can have its own
                custom filter list. This means:
              </p>
              <ul>
                <li>Younger children can have stricter filtering than teenagers</li>
                <li>Different family members can customize based on their preferences</li>
                <li>Parents maintain control over what each profile filters</li>
              </ul>
              <p>
                To set profile-specific filters, go to Family Settings, select a profile, and
                configure their Filter Preferences individually.
              </p>

              <h2>What About Videos I&apos;ve Already Filtered?</h2>
              <p>
                Custom filters apply to videos you filter <em>after</em> adding the words. If you&apos;ve
                already filtered a video and want it to include your new custom words, you&apos;ll need
                to re-filter it. Don&apos;t worry — you won&apos;t be charged twice for the same video.
              </p>

              <h2>Available on All Paid Plans</h2>
              <p>
                Custom word filters are available to all Individual, Family, and Organization
                subscribers. Free plan users can upgrade to access this feature.
              </p>
              <p>
                We&apos;re committed to giving you the tools to create exactly the viewing experience
                you want. Custom filters are just one part of that commitment.
              </p>

              <h2>What&apos;s Next?</h2>
              <p>
                We&apos;re already working on additional filtering customization options, including:
              </p>
              <ul>
                <li>Sensitivity levels (filter more or less aggressively)</li>
                <li>Category-based filtering (violence, crude humor, etc.)</li>
                <li>Shareable filter lists for organizations</li>
              </ul>
              <p>
                Stay tuned for more updates, and as always, we love hearing your feedback.
                Let us know what features would be most valuable to you!
              </p>
            </div>

            {/* CTA Box */}
            <div className="mt-12 p-6 rounded-2xl bg-primary/10 border border-primary/20">
              <h3 className="text-lg font-semibold text-foreground mb-2">Ready to try custom filters?</h3>
              <p className="text-muted-foreground mb-4">
                Log in to your dashboard and set up your custom word list today.
              </p>
              <Link
                href="/settings"
                className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
              >
                Go to Settings
                <Plus className="w-4 h-4" />
              </Link>
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

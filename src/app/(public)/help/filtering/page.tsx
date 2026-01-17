import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { ArrowLeft, Shield, Sliders, Volume2, VolumeX, Target, CheckCircle, XCircle, Lightbulb, RefreshCw, Play } from "lucide-react";

export const metadata = {
  title: "Filtering & Detection - SafePlay Help Center",
  description: "Learn how SafePlay's filtering works, its accuracy, and customization options.",
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
                <Shield className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Filtering & Detection</h1>
                <p className="text-muted-foreground">How filtering works, accuracy, and customization</p>
              </div>
            </div>

            {/* Quick Links */}
            <div className="mb-12 p-4 rounded-xl bg-muted/50 border border-border">
              <p className="text-sm font-medium text-foreground mb-3">Quick Links</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "how-filtering-works", title: "How It Works" },
                  { id: "accuracy", title: "Accuracy" },
                  { id: "custom-filters", title: "Custom Filters" },
                  { id: "mute-vs-bleep", title: "Mute vs Bleep" },
                  { id: "video-compatibility", title: "Compatibility" },
                  { id: "refiltering", title: "Re-filtering" },
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
              {/* Article 1 - How Filtering Works */}
              <article id="how-filtering-works" className="scroll-mt-24">
                <div className="p-8 rounded-2xl bg-card border border-border">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">How Filtering Works</h2>
                  </div>

                  <p className="text-muted-foreground mb-6">
                    SafePlay uses advanced technology to identify and filter profanity in YouTube videos.
                  </p>

                  <div className="p-5 rounded-xl bg-[#0F0F0F] text-white mb-6">
                    <h3 className="font-semibold mb-4">The Process</h3>
                    <div className="space-y-3">
                      {[
                        "When you request to filter a video, we analyze the audio track",
                        "Our system identifies spoken words with precise timing",
                        "Profanity is detected based on our comprehensive word list plus your custom words",
                        "The video is prepared with those moments silenced (mute) or replaced with a bleep",
                      ].map((step, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded bg-primary flex items-center justify-center text-sm font-bold flex-shrink-0">
                            {i + 1}
                          </span>
                          <span className="text-white/90">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 mb-6">
                    <div className="p-4 rounded-xl bg-muted/50 border border-border">
                      <p className="font-semibold text-foreground flex items-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-success" />
                        What Gets Filtered
                      </p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Standard profanity and vulgar language</li>
                        <li>• Crude/offensive terms</li>
                        <li>• Your custom word list (paid plans)</li>
                      </ul>
                    </div>

                    <div className="p-4 rounded-xl bg-muted/50 border border-border">
                      <p className="font-semibold text-foreground flex items-center gap-2 mb-2">
                        <XCircle className="w-4 h-4 text-destructive" />
                        What Doesn&apos;t Get Filtered
                      </p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Visual content (audio only)</li>
                        <li>• Already bleeped content in original</li>
                        <li>• Similar-sounding non-profanity</li>
                        <li>• Foreign language (English only)</li>
                      </ul>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-muted/50 border border-border">
                    <p className="font-semibold text-foreground">Processing Time</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Most videos are processed in 1-3 minutes. Longer videos (like movies) may take up to 5-10 minutes.
                    </p>
                  </div>
                </div>
              </article>

              {/* Article 2 - Accuracy */}
              <article id="accuracy" className="scroll-mt-24">
                <div className="p-8 rounded-2xl bg-card border border-border">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Target className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">Detection Accuracy</h2>
                  </div>

                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 mb-6">
                    <p className="text-2xl font-bold text-foreground">99.5%</p>
                    <p className="text-sm text-muted-foreground">Detection accuracy rate</p>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="p-4 rounded-xl bg-muted/50 border border-border">
                      <p className="font-semibold text-foreground">What This Means</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        In a video with 100 instances of profanity, we typically catch 99-100 of them.
                        The occasional miss usually happens with:
                      </p>
                      <ul className="mt-2 text-sm text-muted-foreground space-y-1">
                        <li>• Heavily accented speech</li>
                        <li>• Very fast speech</li>
                        <li>• Background noise interference</li>
                        <li>• Mumbled or unclear words</li>
                      </ul>
                    </div>

                    <div className="p-4 rounded-xl bg-muted/50 border border-border">
                      <p className="font-semibold text-foreground">False Positives</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Sometimes we might filter a word that sounds like profanity but isn&apos;t.
                        This is rare, and we continuously improve our system to minimize these cases.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-muted/50 border border-border">
                    <p className="font-semibold text-foreground mb-2">Reporting Issues</p>
                    <p className="text-sm text-muted-foreground mb-3">
                      If you notice we missed something or incorrectly filtered a word:
                    </p>
                    <ol className="space-y-2">
                      {[
                        "Go to your filtered video in History",
                        "Click \"Report Issue\"",
                        "Note the approximate timestamp",
                        "We'll use this feedback to improve",
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

              {/* Article 3 - Custom Filters */}
              <article id="custom-filters" className="scroll-mt-24">
                <div className="p-8 rounded-2xl bg-card border border-border">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Sliders className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">Setting Up Custom Word Filters</h2>
                  </div>

                  <p className="text-muted-foreground mb-6">
                    Paid plans can add custom words to filter beyond the standard profanity list.
                  </p>

                  <div className="p-4 rounded-xl bg-muted/50 border border-border mb-4">
                    <p className="font-semibold text-foreground mb-3">Adding Custom Words</p>
                    <ol className="space-y-2">
                      {[
                        "Go to Settings → Filter Preferences",
                        "Scroll to \"Custom Words\"",
                        "Add words or phrases, one per line",
                        "Click \"Save Changes\"",
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

                  <div className="p-5 rounded-xl bg-[#0F0F0F] text-white mb-4">
                    <h3 className="font-semibold mb-3">Best Practices</h3>
                    <ul className="space-y-2 text-sm text-white/80">
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span><strong>Be specific</strong> — adding &quot;dang&quot; won&apos;t filter &quot;danger&quot;</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>Include common misspellings if needed</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>Add phrases exactly as spoken (e.g., &quot;oh my god&quot;)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>Test with a known video after adding</span>
                      </li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                    <p className="font-semibold text-foreground">Per-Profile Custom Words (Family Plans)</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Each family profile can have its own custom word list. Go to Family → Select a profile →
                      Edit Filter Preferences. This lets you filter more strictly for younger children while
                      being more relaxed for teens.
                    </p>
                  </div>
                </div>
              </article>

              {/* Article 4 - Mute vs Bleep */}
              <article id="mute-vs-bleep" className="scroll-mt-24">
                <div className="p-8 rounded-2xl bg-card border border-border">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Volume2 className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">Mute vs. Bleep: Which to Choose</h2>
                  </div>

                  <p className="text-muted-foreground mb-6">
                    SafePlay offers two filtering modes. Choose based on your preference:
                  </p>

                  <div className="grid sm:grid-cols-2 gap-4 mb-6">
                    <div className="p-5 rounded-xl bg-card border-2 border-blue-500/30">
                      <div className="flex items-center gap-3 mb-3">
                        <VolumeX className="w-6 h-6 text-blue-500" />
                        <h3 className="font-semibold text-foreground">Mute Mode</h3>
                      </div>
                      <ul className="space-y-2 text-sm text-muted-foreground mb-3">
                        <li>• Filtered words completely silenced</li>
                        <li>• Brief moment of no audio</li>
                        <li>• More subtle and natural-feeling</li>
                      </ul>
                      <p className="text-sm">
                        <span className="font-medium text-foreground">Best for:</span>{" "}
                        <span className="text-muted-foreground">Adults who want minimal disruption</span>
                      </p>
                    </div>

                    <div className="p-5 rounded-xl bg-card border-2 border-orange-500/30">
                      <div className="flex items-center gap-3 mb-3">
                        <Volume2 className="w-6 h-6 text-orange-500" />
                        <h3 className="font-semibold text-foreground">Bleep Mode</h3>
                      </div>
                      <ul className="space-y-2 text-sm text-muted-foreground mb-3">
                        <li>• Classic &quot;bleep&quot; sound replacement</li>
                        <li>• TV-style censoring</li>
                        <li>• Clear indication of filtering</li>
                      </ul>
                      <p className="text-sm">
                        <span className="font-medium text-foreground">Best for:</span>{" "}
                        <span className="text-muted-foreground">Families who want to know when content is filtered</span>
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-muted/50 border border-border flex items-start gap-4">
                    <Lightbulb className="w-6 h-6 text-warning flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Note</p>
                      <p className="text-sm text-muted-foreground">
                        Your choice applies to future videos. Previously filtered videos keep their original mode.
                        To change a video&apos;s mode, you&apos;ll need to re-filter it (no additional credits).
                      </p>
                    </div>
                  </div>
                </div>
              </article>

              {/* Article 5 - Video Compatibility */}
              <article id="video-compatibility" className="scroll-mt-24">
                <div className="p-8 rounded-2xl bg-card border border-border">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Play className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">What Videos Work with SafePlay</h2>
                  </div>

                  <p className="text-muted-foreground mb-6">
                    SafePlay works with most YouTube videos, but there are some limitations.
                  </p>

                  <div className="grid sm:grid-cols-2 gap-4 mb-6">
                    <div className="p-4 rounded-xl bg-muted/50 border border-border">
                      <p className="font-semibold text-foreground flex items-center gap-2 mb-3">
                        <CheckCircle className="w-4 h-4 text-success" />
                        Works Great
                      </p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Public YouTube videos</li>
                        <li>• Unlisted videos (with link)</li>
                        <li>• Educational content</li>
                        <li>• Movies and shows on YouTube</li>
                        <li>• Music videos</li>
                        <li>• Documentaries</li>
                      </ul>
                    </div>

                    <div className="p-4 rounded-xl bg-muted/50 border border-border">
                      <p className="font-semibold text-foreground flex items-center gap-2 mb-3">
                        <XCircle className="w-4 h-4 text-destructive" />
                        Limited or No Support
                      </p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• <strong>Private videos</strong> — can&apos;t access</li>
                        <li>• <strong>Age-restricted</strong> — may not work</li>
                        <li>• <strong>Live streams</strong> — not supported</li>
                        <li>• <strong>YouTube Shorts</strong> — not supported</li>
                        <li>• <strong>Premium-only</strong> — depends on access</li>
                      </ul>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                    <p className="font-semibold text-foreground">Checking Compatibility</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      The easiest way to check is to try filtering the video. If there&apos;s an issue,
                      we&apos;ll let you know before any credits are used.
                    </p>
                  </div>
                </div>
              </article>

              {/* Article 6 - Re-filtering */}
              <article id="refiltering" className="scroll-mt-24">
                <div className="p-8 rounded-2xl bg-card border border-border">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <RefreshCw className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">Re-filtering Videos</h2>
                  </div>

                  <p className="text-muted-foreground mb-6">
                    Sometimes you might want to re-filter a video you&apos;ve already processed.
                  </p>

                  <div className="space-y-4 mb-6">
                    <div className="p-4 rounded-xl bg-muted/50 border border-border">
                      <p className="font-semibold text-foreground mb-2">Reasons to Re-filter</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• You&apos;ve added new custom words and want them applied</li>
                        <li>• You want to switch between mute and bleep mode</li>
                        <li>• Our system has been updated with improved detection</li>
                      </ul>
                    </div>

                    <div className="p-4 rounded-xl bg-muted/50 border border-border">
                      <p className="font-semibold text-foreground mb-3">How to Re-filter</p>
                      <ol className="space-y-2">
                        {[
                          "Go to History",
                          "Find the video you want to re-filter",
                          "Click the menu (three dots)",
                          "Select \"Re-filter Video\"",
                          "Confirm",
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

                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                    <p className="font-semibold text-foreground">Credit Usage</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      <strong>Re-filtering the same video does NOT use additional credits.</strong> Your original
                      filtering &quot;paid for&quot; that video, and re-filtering is free.
                    </p>
                  </div>
                </div>
              </article>
            </div>

            {/* Help CTA */}
            <div className="mt-12 p-6 rounded-2xl bg-muted/50 border border-border text-center">
              <p className="text-foreground font-medium">Need more help with filtering?</p>
              <p className="text-muted-foreground mt-1">
                <Link href="/contact" className="text-primary hover:underline">Contact our support team</Link>
                {" "}for personalized assistance.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

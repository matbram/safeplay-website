import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { ArrowLeft, Shield, Sliders, Volume2, VolumeX } from "lucide-react";

export const metadata = {
  title: "Filtering & Detection - SafePlay Help Center",
  description: "Learn how SafePlay's filtering works, its accuracy, and customization options.",
};

const articles = [
  {
    id: "how-filtering-works",
    title: "How Filtering Works",
    content: `SafePlay uses advanced technology to identify and filter profanity in YouTube videos.

**The Process**
1. When you request to filter a video, we analyze the audio track
2. Our system identifies spoken words with precise timing
3. Profanity is detected based on our comprehensive word list plus any custom words you've added
4. The video is prepared with those moments silenced (mute) or replaced with a bleep sound

**What Gets Filtered**
- Standard profanity and vulgar language
- Crude/offensive terms
- Your custom word list (paid plans)

**What Doesn't Get Filtered**
- Visual content (we filter audio only)
- Implied or bleeped profanity in the original video
- Words that sound similar but aren't profanity
- Foreign language profanity (English only currently)

**Processing Time**
Most videos are processed in 1-3 minutes. Longer videos (like movies) may take up to 5-10 minutes.`,
  },
  {
    id: "accuracy",
    title: "Detection Accuracy",
    content: `SafePlay achieves 99.5% accuracy in detecting profanity. Here's what that means:

**What 99.5% Accuracy Means**
In a video with 100 instances of profanity, we typically catch 99-100 of them. The occasional miss usually happens with:
- Heavily accented speech
- Very fast speech
- Background noise interference
- Mumbled or unclear words

**False Positives**
Sometimes we might filter a word that sounds like profanity but isn't. This is rare, and we continuously improve our system to minimize these cases.

**Reporting Issues**
If you notice we missed something or incorrectly filtered a word:
1. Go to your filtered video in History
2. Click "Report Issue"
3. Note the approximate timestamp
4. We'll use this feedback to improve

**Continuous Improvement**
Our detection system learns and improves over time based on user feedback and new training data. We regularly release updates to improve accuracy.`,
  },
  {
    id: "custom-filters",
    title: "Setting Up Custom Word Filters",
    content: `Paid plans can add custom words to filter beyond the standard profanity list.

**Adding Custom Words**
1. Go to Settings → Filter Preferences
2. Scroll to "Custom Words"
3. Add words or phrases, one per line
4. Click "Save Changes"

**Best Practices**
- Be specific (adding "dang" won't filter "danger")
- Include common misspellings if needed
- Add phrases exactly as spoken (e.g., "oh my god")
- Test with a known video after adding

**Per-Profile Custom Words (Family Plans)**
Each family profile can have its own custom word list:
1. Go to Family → Select a profile
2. Edit their Filter Preferences
3. Add profile-specific custom words

This lets you filter more strictly for younger children while being more relaxed for teens.

**Removing Custom Words**
Simply delete the word from your list and save. Note: Previously filtered videos keep their original filtering. Re-filter the video if you want the change to apply.`,
  },
  {
    id: "mute-vs-bleep",
    title: "Mute vs. Bleep: Which to Choose",
    content: `SafePlay offers two filtering modes. Choose based on your preference:

**Mute Mode**
- Filtered words are completely silenced
- The video continues with a brief moment of no audio
- More subtle and natural-feeling
- Best for: Adults who want minimal disruption, or when you don't want to draw attention to filtered content

**Bleep Mode**
- Filtered words are replaced with a "bleep" sound
- Classic TV-style censoring
- Clear indication that something was filtered
- Best for: Families who want to know when filtering occurs, educational settings, traditional preference

**Changing Your Preference**
1. Go to Settings → Filter Preferences
2. Under "Filter Type," select Mute or Bleep
3. Save changes

**Note:** Your choice applies to future videos. Previously filtered videos keep their original mode. To change a video's mode, you'll need to re-filter it (this doesn't use additional credits for the same video).`,
  },
  {
    id: "video-compatibility",
    title: "What Videos Work with SafePlay",
    content: `SafePlay works with most YouTube videos, but there are some limitations.

**Works Great**
- Public YouTube videos
- Unlisted videos (if you have the link)
- Most educational content
- Movies and shows on YouTube
- Music videos
- Documentaries

**Limited or No Support**
- **Private videos** — We can't access these
- **Age-restricted content** — May not be accessible depending on restrictions
- **Live streams** — Not supported (we need the complete video)
- **YouTube Shorts** — Currently not supported
- **Premium-only content** — Depends on access restrictions

**Regional Restrictions**
Some videos are only available in certain countries. If a video isn't available in our processing region, we may not be able to filter it.

**Copyright-Protected Content**
Most copyright-protected videos work fine. However, some videos with aggressive DRM may not be filterable.

**Checking Compatibility**
The easiest way to check is to try filtering the video. If there's an issue, we'll let you know before any credits are used.`,
  },
  {
    id: "refiltering",
    title: "Re-filtering Videos",
    content: `Sometimes you might want to re-filter a video you've already processed.

**Reasons to Re-filter**
- You've added new custom words and want them applied
- You want to switch between mute and bleep mode
- Our system has been updated with improved detection

**How to Re-filter**
1. Go to History
2. Find the video you want to re-filter
3. Click the menu (three dots)
4. Select "Re-filter Video"
5. Confirm

**Credit Usage**
Re-filtering the same video does NOT use additional credits. Your original filtering "paid for" that video, and re-filtering is free.

**When Re-filtering Isn't Needed**
- Watching a filtered video again (always free)
- Minor setting changes that don't affect filtering
- Viewing on a different device (your filtered videos sync)`,
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

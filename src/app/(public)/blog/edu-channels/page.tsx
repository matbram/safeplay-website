import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock, User, Star, ExternalLink } from "lucide-react";

export const metadata = {
  title: "The Best Educational YouTube Channels for Kids - SafePlay Blog",
  description: "Our curated list of engaging, educational channels that parents and teachers love.",
};

const channels = [
  {
    name: "Crash Course Kids",
    category: "Science",
    ageRange: "8-12",
    description: "Bite-sized science videos covering earth science, biology, chemistry, and physics with fun animations.",
  },
  {
    name: "National Geographic Kids",
    category: "Nature & Geography",
    ageRange: "6-12",
    description: "Explore the natural world with videos about animals, habitats, and amazing places around the globe.",
  },
  {
    name: "SciShow Kids",
    category: "Science",
    ageRange: "5-9",
    description: "Answers kids' science questions with engaging explanations and hands-on experiments.",
  },
  {
    name: "Art for Kids Hub",
    category: "Art & Creativity",
    ageRange: "4-10",
    description: "Step-by-step drawing tutorials that the whole family can follow along with together.",
  },
  {
    name: "Numberblocks",
    category: "Math",
    ageRange: "3-6",
    description: "Makes early math concepts fun and visual with animated number characters.",
  },
  {
    name: "Free School",
    category: "History & Art",
    ageRange: "8-14",
    description: "Well-produced videos on history, art history, and classical music appreciation.",
  },
];

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
              <span className="text-primary font-medium">Recommendations</span>
              <h1 className="mt-4 text-3xl lg:text-4xl font-bold text-foreground">
                The Best Educational YouTube Channels for Kids
              </h1>
              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  SafePlay Team
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  December 28, 2025
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  6 min read
                </span>
              </div>
            </header>

            {/* Featured Image Placeholder */}
            <div className="aspect-video rounded-2xl bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 mb-12" />

            {/* Content */}
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <p className="lead text-xl text-muted-foreground">
                YouTube can be an incredible educational resource — if you know where to look.
                We&apos;ve compiled our favorite channels that combine learning with entertainment,
                perfect for curious kids of all ages.
              </p>

              <h2>Our Top Picks</h2>
              <p>
                These channels have been selected based on educational value, production quality,
                engagement, and overall appropriateness for young viewers. While we recommend using
                SafePlay with any YouTube content, these channels are known for being family-friendly.
              </p>
            </div>

            {/* Channel Cards */}
            <div className="not-prose my-12 space-y-4">
              {channels.map((channel) => (
                <div
                  key={channel.name}
                  className="p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-foreground">{channel.name}</h3>
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                          {channel.category}
                        </span>
                      </div>
                      <p className="text-muted-foreground">{channel.description}</p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        <strong>Best for ages:</strong> {channel.ageRange}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="flex items-center gap-1 text-yellow-500">
                        <Star className="w-4 h-4 fill-current" />
                        <Star className="w-4 h-4 fill-current" />
                        <Star className="w-4 h-4 fill-current" />
                        <Star className="w-4 h-4 fill-current" />
                        <Star className="w-4 h-4 fill-current" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Continue Content */}
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <h2>More Great Channels by Subject</h2>

              <h3>Science & Nature</h3>
              <ul>
                <li><strong>Brave Wilderness</strong> — Wildlife encounters and nature exploration (ages 8+)</li>
                <li><strong>MinutePhysics</strong> — Quick explanations of physics concepts (ages 10+)</li>
                <li><strong>The Brain Scoop</strong> — Behind-the-scenes at natural history museums (ages 10+)</li>
                <li><strong>Deep Look</strong> — Stunning macro videos of insects and small creatures (all ages)</li>
              </ul>

              <h3>History & Social Studies</h3>
              <ul>
                <li><strong>Extra History</strong> — Animated history lessons with engaging storytelling (ages 10+)</li>
                <li><strong>Simple History</strong> — Quick animated videos on historical events (ages 8+)</li>
                <li><strong>Liberty&apos;s Kids</strong> — American Revolution stories (ages 6-10)</li>
              </ul>

              <h3>Math & Logic</h3>
              <ul>
                <li><strong>Numberphile</strong> — Makes math fascinating for older kids (ages 12+)</li>
                <li><strong>Math Antics</strong> — Clear explanations of math concepts (ages 8-14)</li>
                <li><strong>Vi Hart</strong> — Creative math doodling and exploration (ages 10+)</li>
              </ul>

              <h3>Reading & Language</h3>
              <ul>
                <li><strong>Storyline Online</strong> — Celebrities reading children&apos;s books aloud (ages 3-8)</li>
                <li><strong>KidsLearningTube</strong> — Educational songs and phonics (ages 3-7)</li>
              </ul>

              <h3>Arts & Music</h3>
              <ul>
                <li><strong>Art for Kids Hub</strong> — Drawing tutorials for the whole family (ages 4-10)</li>
                <li><strong>The Piano Guys</strong> — Creative musical performances (all ages)</li>
                <li><strong>Music K-8</strong> — Music education and sing-alongs (ages 5-13)</li>
              </ul>

              <h2>Tips for Using Educational YouTube</h2>
              <ol>
                <li>
                  <strong>Watch together when possible:</strong> Some of the best learning happens
                  when you can discuss what you&apos;re watching.
                </li>
                <li>
                  <strong>Create playlists:</strong> Curate videos in advance so kids have approved
                  content ready to go.
                </li>
                <li>
                  <strong>Use SafePlay:</strong> Even educational channels can occasionally have
                  unexpected language. Filtering ensures peace of mind.
                </li>
                <li>
                  <strong>Balance screen time:</strong> Even educational content should be balanced
                  with offline activities.
                </li>
                <li>
                  <strong>Let kids explore their interests:</strong> If they&apos;re fascinated by
                  dinosaurs, lean into that with related channels.
                </li>
              </ol>

              <h2>A Note on YouTube Kids</h2>
              <p>
                YouTube Kids is a great option for younger children, but it has limitations. The
                content library is smaller, and older kids often want access to the &quot;regular&quot;
                YouTube. SafePlay bridges this gap by letting you use all of YouTube while maintaining
                language-appropriate viewing.
              </p>

              <h2>Share Your Favorites</h2>
              <p>
                We&apos;re always looking for new channels to recommend. If your family has discovered
                an amazing educational channel we haven&apos;t mentioned, we&apos;d love to hear about
                it! Reach out through our contact page or connect with us on social media.
              </p>
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

            {/* Related Posts */}
            <div className="mt-12 pt-12 border-t border-border">
              <h3 className="text-xl font-bold text-foreground mb-6">Related Articles</h3>
              <div className="grid sm:grid-cols-2 gap-6">
                <Link
                  href="/blog/screen-time-tips"
                  className="p-4 rounded-xl border border-border hover:border-primary/30 transition-colors"
                >
                  <span className="text-sm text-primary">Family Tips</span>
                  <h4 className="mt-2 font-semibold text-foreground">5 Tips for Managing Screen Time with Kids</h4>
                </Link>
                <Link
                  href="/blog/classroom-filtering"
                  className="p-4 rounded-xl border border-border hover:border-primary/30 transition-colors"
                >
                  <span className="text-sm text-primary">Education</span>
                  <h4 className="mt-2 font-semibold text-foreground">Why Content Filtering Matters for Classrooms</h4>
                </Link>
              </div>
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}

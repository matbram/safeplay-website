import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock, User, Star, Youtube, Beaker, Globe, Palette, Calculator, BookOpen, Lightbulb, CheckCircle } from "lucide-react";

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

const channelsBySubject = [
  {
    title: "Science & Nature",
    icon: Beaker,
    color: "bg-green-500",
    channels: [
      { name: "Brave Wilderness", desc: "Wildlife encounters and nature exploration", age: "8+" },
      { name: "MinutePhysics", desc: "Quick explanations of physics concepts", age: "10+" },
      { name: "The Brain Scoop", desc: "Behind-the-scenes at natural history museums", age: "10+" },
      { name: "Deep Look", desc: "Stunning macro videos of insects and small creatures", age: "All ages" },
    ],
  },
  {
    title: "History & Social Studies",
    icon: Globe,
    color: "bg-amber-500",
    channels: [
      { name: "Extra History", desc: "Animated history lessons with engaging storytelling", age: "10+" },
      { name: "Simple History", desc: "Quick animated videos on historical events", age: "8+" },
      { name: "Liberty's Kids", desc: "American Revolution stories", age: "6-10" },
    ],
  },
  {
    title: "Math & Logic",
    icon: Calculator,
    color: "bg-blue-500",
    channels: [
      { name: "Numberphile", desc: "Makes math fascinating for older kids", age: "12+" },
      { name: "Math Antics", desc: "Clear explanations of math concepts", age: "8-14" },
      { name: "Vi Hart", desc: "Creative math doodling and exploration", age: "10+" },
    ],
  },
  {
    title: "Reading & Language",
    icon: BookOpen,
    color: "bg-purple-500",
    channels: [
      { name: "Storyline Online", desc: "Celebrities reading children's books aloud", age: "3-8" },
      { name: "KidsLearningTube", desc: "Educational songs and phonics", age: "3-7" },
    ],
  },
  {
    title: "Arts & Music",
    icon: Palette,
    color: "bg-pink-500",
    channels: [
      { name: "Art for Kids Hub", desc: "Drawing tutorials for the whole family", age: "4-10" },
      { name: "The Piano Guys", desc: "Creative musical performances", age: "All ages" },
      { name: "Music K-8", desc: "Music education and sing-alongs", age: "5-13" },
    ],
  },
];

const tips = [
  {
    title: "Watch together when possible",
    desc: "Some of the best learning happens when you can discuss what you're watching.",
  },
  {
    title: "Create playlists",
    desc: "Curate videos in advance so kids have approved content ready to go.",
  },
  {
    title: "Use SafePlay",
    desc: "Even educational channels can occasionally have unexpected language. Filtering ensures peace of mind.",
  },
  {
    title: "Balance screen time",
    desc: "Even educational content should be balanced with offline activities.",
  },
  {
    title: "Let kids explore their interests",
    desc: "If they're fascinated by dinosaurs, lean into that with related channels.",
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
              <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                Recommendations
              </span>
              <h1 className="mt-4 text-3xl lg:text-4xl font-bold text-foreground">
                The Best Educational YouTube Channels for Kids
              </h1>
              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  SafePlay Team
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  December 28, 2025
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  6 min read
                </span>
              </div>
            </header>

            {/* Featured Image */}
            <div className="aspect-video rounded-2xl bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 mb-12 flex items-center justify-center">
              <Youtube className="w-24 h-24 text-primary/30" />
            </div>

            {/* Article Content */}
            <div className="space-y-8">
              {/* Intro */}
              <p className="text-xl text-muted-foreground leading-relaxed">
                YouTube can be an incredible educational resource — if you know where to look.
                We&apos;ve compiled our favorite channels that combine learning with entertainment,
                perfect for curious kids of all ages.
              </p>

              {/* Section 1 - Top Picks */}
              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground pt-4 border-t border-border">
                  Our Top Picks
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  These channels have been selected based on educational value, production quality,
                  engagement, and overall appropriateness for young viewers. While we recommend using
                  SafePlay with any YouTube content, these channels are known for being family-friendly.
                </p>

                <div className="space-y-4 mt-6">
                  {channels.map((channel) => (
                    <div
                      key={channel.name}
                      className="p-5 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-foreground">{channel.name}</h3>
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                              {channel.category}
                            </span>
                          </div>
                          <p className="text-muted-foreground">{channel.description}</p>
                          <p className="mt-2 text-sm">
                            <span className="text-muted-foreground">Best for ages: </span>
                            <span className="font-medium text-foreground">{channel.ageRange}</span>
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <div className="flex items-center gap-0.5 text-yellow-500">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className="w-4 h-4 fill-current" />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Section 2 - Channels by Subject */}
              <section className="space-y-6">
                <h2 className="text-2xl font-bold text-foreground pt-4 border-t border-border">
                  More Great Channels by Subject
                </h2>

                <div className="space-y-6">
                  {channelsBySubject.map((subject) => (
                    <div key={subject.title} className="p-5 rounded-xl bg-card border border-border">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-10 h-10 rounded-lg ${subject.color} flex items-center justify-center`}>
                          <subject.icon className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">{subject.title}</h3>
                      </div>
                      <div className="space-y-3">
                        {subject.channels.map((channel) => (
                          <div key={channel.name} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="font-medium text-foreground">{channel.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {channel.desc} <span className="text-primary">({channel.age})</span>
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Section 3 - Tips */}
              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground pt-4 border-t border-border">
                  Tips for Using Educational YouTube
                </h2>

                <div className="grid gap-3">
                  {tips.map((tip, index) => (
                    <div
                      key={tip.title}
                      className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border"
                    >
                      <span className="w-8 h-8 rounded-full bg-primary text-white font-bold text-sm flex items-center justify-center flex-shrink-0">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-foreground">{tip.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">{tip.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Section 4 - YouTube Kids Note */}
              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground pt-4 border-t border-border">
                  A Note on YouTube Kids
                </h2>
                <div className="p-4 rounded-xl bg-muted/50 border border-border flex items-start gap-4">
                  <Lightbulb className="w-6 h-6 text-warning flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-foreground leading-relaxed">
                      YouTube Kids is a great option for younger children, but it has limitations. The
                      content library is smaller, and older kids often want access to the &quot;regular&quot;
                      YouTube. <strong>SafePlay bridges this gap</strong> by letting you use all of YouTube
                      while maintaining language-appropriate viewing.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 5 - Share */}
              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground pt-4 border-t border-border">
                  Share Your Favorites
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  We&apos;re always looking for new channels to recommend. If your family has discovered
                  an amazing educational channel we haven&apos;t mentioned, we&apos;d love to hear about
                  it! Reach out through our contact page or connect with us on social media.
                </p>
              </section>

              {/* CTA Box */}
              <div className="p-6 rounded-xl bg-primary/10 border border-primary/20">
                <h3 className="text-lg font-semibold text-foreground mb-2">Ready to filter educational content?</h3>
                <p className="text-muted-foreground mb-4">
                  Even the best educational channels can occasionally have unexpected language.
                  Filter with confidence using SafePlay.
                </p>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-hover transition-colors"
                >
                  Get Started Free
                  <CheckCircle className="w-4 h-4" />
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

            {/* Related Posts */}
            <div className="mt-12 pt-12 border-t border-border">
              <h3 className="text-xl font-bold text-foreground mb-6">Related Articles</h3>
              <div className="grid sm:grid-cols-2 gap-6">
                <Link
                  href="/blog/screen-time-tips"
                  className="group p-4 rounded-xl border border-border hover:border-primary/30 transition-colors"
                >
                  <span className="text-sm text-primary">Family Tips</span>
                  <h4 className="mt-2 font-semibold text-foreground group-hover:text-primary transition-colors">
                    5 Tips for Managing Screen Time with Kids
                  </h4>
                </Link>
                <Link
                  href="/blog/classroom-filtering"
                  className="group p-4 rounded-xl border border-border hover:border-primary/30 transition-colors"
                >
                  <span className="text-sm text-primary">Education</span>
                  <h4 className="mt-2 font-semibold text-foreground group-hover:text-primary transition-colors">
                    Why Content Filtering Matters for Classrooms
                  </h4>
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

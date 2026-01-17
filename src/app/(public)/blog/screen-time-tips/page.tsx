import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock, User } from "lucide-react";

export const metadata = {
  title: "5 Tips for Managing Screen Time with Kids - SafePlay Blog",
  description: "Learn practical strategies for creating healthy digital habits for your family without constant battles.",
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
              <span className="text-primary font-medium">Family Tips</span>
              <h1 className="mt-4 text-3xl lg:text-4xl font-bold text-foreground">
                5 Tips for Managing Screen Time with Kids
              </h1>
              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  SafePlay Team
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  January 15, 2026
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  5 min read
                </span>
              </div>
            </header>

            {/* Featured Image Placeholder */}
            <div className="aspect-video rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 mb-12" />

            {/* Content */}
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <p className="lead text-xl text-muted-foreground">
                In today&apos;s digital world, managing your children&apos;s screen time can feel like
                a constant battle. But it doesn&apos;t have to be. With the right strategies, you can
                create healthy digital habits that work for your whole family.
              </p>

              <h2>1. Set Clear, Consistent Boundaries</h2>
              <p>
                Children thrive with structure. Rather than making screen time decisions on the fly,
                establish clear rules that everyone understands. This might include:
              </p>
              <ul>
                <li>No screens during meals</li>
                <li>A specific &quot;screens off&quot; time before bed (experts recommend at least 1 hour)</li>
                <li>Weekend vs. weekday allowances</li>
                <li>Screens only in common areas, not bedrooms</li>
              </ul>
              <p>
                The key is consistency. When children know what to expect, there&apos;s less room
                for negotiation and fewer daily battles.
              </p>

              <h2>2. Focus on Quality, Not Just Quantity</h2>
              <p>
                Not all screen time is created equal. An hour spent watching educational content
                or creating digital art is very different from an hour of passive scrolling.
                Consider categorizing screen activities:
              </p>
              <ul>
                <li><strong>Creative:</strong> Drawing apps, coding games, music creation</li>
                <li><strong>Educational:</strong> Learning apps, educational videos, research</li>
                <li><strong>Social:</strong> Video calls with family, supervised messaging with friends</li>
                <li><strong>Entertainment:</strong> Games, streaming, social media</li>
              </ul>
              <p>
                You might allow more time for creative and educational activities while limiting
                pure entertainment. This teaches children to be mindful about how they spend their
                digital time.
              </p>

              <h2>3. Make Screen Time a Shared Activity</h2>
              <p>
                Some of the best screen time is time spent together. Watch a movie as a family,
                play a video game together, or explore educational content side by side. This:
              </p>
              <ul>
                <li>Gives you insight into what your children are watching</li>
                <li>Creates opportunities for conversation and bonding</li>
                <li>Helps you guide them toward appropriate content</li>
                <li>Makes media consumption a social activity rather than an isolating one</li>
              </ul>
              <p>
                This is where tools like SafePlay become invaluable. When you&apos;re watching
                content together, you can relax knowing that any unexpected language will be
                automatically filtered, letting you focus on enjoying the experience.
              </p>

              <h2>4. Model the Behavior You Want to See</h2>
              <p>
                Children learn by watching. If you&apos;re constantly on your phone during dinner
                or first thing in the morning, they&apos;ll pick up those habits. Consider:
              </p>
              <ul>
                <li>Designating phone-free times for the whole family</li>
                <li>Keeping your own phone out of sight during family activities</li>
                <li>Showing enthusiasm for non-screen activities</li>
                <li>Talking about your own screen time choices and why you make them</li>
              </ul>
              <p>
                When children see that adults also have boundaries around technology, it normalizes
                the concept of mindful device usage.
              </p>

              <h2>5. Create Compelling Alternatives</h2>
              <p>
                Often, children reach for screens out of boredom. Make sure there are plenty of
                engaging alternatives available:
              </p>
              <ul>
                <li>Keep art supplies, books, and games easily accessible</li>
                <li>Schedule regular outdoor time and physical activities</li>
                <li>Encourage hobbies that don&apos;t involve screens</li>
                <li>Plan family activities that everyone looks forward to</li>
              </ul>
              <p>
                The goal isn&apos;t to eliminate screens entirely—they&apos;re an important part
                of modern life. Instead, it&apos;s about ensuring screens are one option among many,
                not the default activity.
              </p>

              <h2>The Bottom Line</h2>
              <p>
                Managing screen time isn&apos;t about being the &quot;bad guy&quot; who takes away
                devices. It&apos;s about helping your children develop a healthy relationship with
                technology that will serve them throughout their lives.
              </p>
              <p>
                Start with one or two of these strategies and build from there. Every family is
                different, and what works for one might not work for another. The important thing
                is to keep the conversation going and adjust as needed.
              </p>
              <p>
                And when it is screen time? SafePlay helps ensure the content is appropriate,
                so you can worry less about what they might hear and focus more on enjoying
                quality time together.
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
                  href="/blog/movie-night"
                  className="p-4 rounded-xl border border-border hover:border-primary/30 transition-colors"
                >
                  <span className="text-sm text-primary">Family Tips</span>
                  <h4 className="mt-2 font-semibold text-foreground">Family Movie Night Made Easy</h4>
                </Link>
                <Link
                  href="/blog/edu-channels"
                  className="p-4 rounded-xl border border-border hover:border-primary/30 transition-colors"
                >
                  <span className="text-sm text-primary">Recommendations</span>
                  <h4 className="mt-2 font-semibold text-foreground">Best Educational YouTube Channels for Kids</h4>
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

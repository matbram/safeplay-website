import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock, User, Smartphone } from "lucide-react";

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
              <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                Family Tips
              </span>
              <h1 className="mt-4 text-3xl lg:text-4xl font-bold text-foreground">
                5 Tips for Managing Screen Time with Kids
              </h1>
              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  SafePlay Team
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  January 15, 2026
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  5 min read
                </span>
              </div>
            </header>

            {/* Featured Image */}
            <div className="aspect-video rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 mb-12 flex items-center justify-center">
              <Smartphone className="w-24 h-24 text-primary/30" />
            </div>

            {/* Article Content */}
            <div className="space-y-8">
              {/* Intro */}
              <p className="text-xl text-muted-foreground leading-relaxed">
                In today&apos;s digital world, managing your children&apos;s screen time can feel like
                a constant battle. But it doesn&apos;t have to be. With the right strategies, you can
                create healthy digital habits that work for your whole family.
              </p>

              {/* Tip 1 */}
              <section className="space-y-4">
                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  <span className="w-10 h-10 rounded-full bg-primary text-white font-bold flex items-center justify-center">1</span>
                  <h2 className="text-2xl font-bold text-foreground">Set Clear, Consistent Boundaries</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Children thrive with structure. Rather than making screen time decisions on the fly,
                  establish clear rules that everyone understands. This might include:
                </p>
                <ul className="space-y-3 pl-4">
                  {[
                    "No screens during meals",
                    "A specific \"screens off\" time before bed (experts recommend at least 1 hour)",
                    "Weekend vs. weekday allowances",
                    "Screens only in common areas, not bedrooms"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <p className="text-sm text-foreground">
                    <strong>Key insight:</strong> The key is consistency. When children know what to expect, there&apos;s less room
                    for negotiation and fewer daily battles.
                  </p>
                </div>
              </section>

              {/* Tip 2 */}
              <section className="space-y-4">
                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  <span className="w-10 h-10 rounded-full bg-primary text-white font-bold flex items-center justify-center">2</span>
                  <h2 className="text-2xl font-bold text-foreground">Focus on Quality, Not Just Quantity</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Not all screen time is created equal. An hour spent watching educational content
                  or creating digital art is very different from an hour of passive scrolling.
                  Consider categorizing screen activities:
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { type: "Creative", desc: "Drawing apps, coding games, music creation", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
                    { type: "Educational", desc: "Learning apps, educational videos, research", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
                    { type: "Social", desc: "Video calls with family, supervised messaging", color: "bg-green-500/10 text-green-600 dark:text-green-400" },
                    { type: "Entertainment", desc: "Games, streaming, social media", color: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
                  ].map((cat) => (
                    <div key={cat.type} className={`p-4 rounded-xl ${cat.color}`}>
                      <p className="font-semibold">{cat.type}</p>
                      <p className="text-sm opacity-80">{cat.desc}</p>
                    </div>
                  ))}
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  You might allow more time for creative and educational activities while limiting
                  pure entertainment. This teaches children to be mindful about how they spend their
                  digital time.
                </p>
              </section>

              {/* Tip 3 */}
              <section className="space-y-4">
                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  <span className="w-10 h-10 rounded-full bg-primary text-white font-bold flex items-center justify-center">3</span>
                  <h2 className="text-2xl font-bold text-foreground">Make Screen Time a Shared Activity</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Some of the best screen time is time spent together. Watch a movie as a family,
                  play a video game together, or explore educational content side by side.
                </p>
                <div className="p-6 rounded-xl bg-muted/50 border border-border">
                  <h3 className="font-semibold text-foreground mb-3">Benefits of watching together:</h3>
                  <ul className="space-y-2">
                    {[
                      "Gives you insight into what your children are watching",
                      "Creates opportunities for conversation and bonding",
                      "Helps you guide them toward appropriate content",
                      "Makes media consumption a social activity rather than an isolating one"
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-success mt-2 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  This is where tools like SafePlay become invaluable. When you&apos;re watching
                  content together, you can relax knowing that any unexpected language will be
                  automatically filtered, letting you focus on enjoying the experience.
                </p>
              </section>

              {/* Tip 4 */}
              <section className="space-y-4">
                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  <span className="w-10 h-10 rounded-full bg-primary text-white font-bold flex items-center justify-center">4</span>
                  <h2 className="text-2xl font-bold text-foreground">Model the Behavior You Want to See</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Children learn by watching. If you&apos;re constantly on your phone during dinner
                  or first thing in the morning, they&apos;ll pick up those habits. Consider:
                </p>
                <ul className="space-y-3 pl-4">
                  {[
                    "Designating phone-free times for the whole family",
                    "Keeping your own phone out of sight during family activities",
                    "Showing enthusiasm for non-screen activities",
                    "Talking about your own screen time choices and why you make them"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  When children see that adults also have boundaries around technology, it normalizes
                  the concept of mindful device usage.
                </p>
              </section>

              {/* Tip 5 */}
              <section className="space-y-4">
                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  <span className="w-10 h-10 rounded-full bg-primary text-white font-bold flex items-center justify-center">5</span>
                  <h2 className="text-2xl font-bold text-foreground">Create Compelling Alternatives</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Often, children reach for screens out of boredom. Make sure there are plenty of
                  engaging alternatives available:
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    "Keep art supplies, books, and games easily accessible",
                    "Schedule regular outdoor time and physical activities",
                    "Encourage hobbies that don't involve screens",
                    "Plan family activities that everyone looks forward to"
                  ].map((item, i) => (
                    <div key={i} className="p-4 rounded-xl bg-card border border-border">
                      <p className="text-muted-foreground text-sm">{item}</p>
                    </div>
                  ))}
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  The goal isn&apos;t to eliminate screens entirely—they&apos;re an important part
                  of modern life. Instead, it&apos;s about ensuring screens are one option among many,
                  not the default activity.
                </p>
              </section>

              {/* Conclusion */}
              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground pt-4 border-t border-border">
                  The Bottom Line
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Managing screen time isn&apos;t about being the &quot;bad guy&quot; who takes away
                  devices. It&apos;s about helping your children develop a healthy relationship with
                  technology that will serve them throughout their lives.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Start with one or two of these strategies and build from there. Every family is
                  different, and what works for one might not work for another. The important thing
                  is to keep the conversation going and adjust as needed.
                </p>
                <div className="p-6 rounded-xl bg-primary/10 border border-primary/20">
                  <p className="text-foreground">
                    <strong>And when it is screen time?</strong> SafePlay helps ensure the content is appropriate,
                    so you can worry less about what they might hear and focus more on enjoying
                    quality time together.
                  </p>
                </div>
              </section>
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
                  className="group p-4 rounded-xl border border-border hover:border-primary/30 transition-colors"
                >
                  <span className="text-sm text-primary">Family Tips</span>
                  <h4 className="mt-2 font-semibold text-foreground group-hover:text-primary transition-colors">
                    Family Movie Night Made Easy
                  </h4>
                </Link>
                <Link
                  href="/blog/edu-channels"
                  className="group p-4 rounded-xl border border-border hover:border-primary/30 transition-colors"
                >
                  <span className="text-sm text-primary">Recommendations</span>
                  <h4 className="mt-2 font-semibold text-foreground group-hover:text-primary transition-colors">
                    Best Educational YouTube Channels for Kids
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

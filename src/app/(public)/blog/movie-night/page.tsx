import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock, User, Film } from "lucide-react";

export const metadata = {
  title: "Family Movie Night Made Easy - SafePlay Blog",
  description: "Tips for picking the perfect movie and using SafePlay to ensure it's appropriate for everyone.",
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
                Family Movie Night Made Easy
              </h1>
              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  SafePlay Team
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  December 15, 2025
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  5 min read
                </span>
              </div>
            </header>

            {/* Featured Image */}
            <div className="aspect-video rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 mb-12 flex items-center justify-center">
              <Film className="w-24 h-24 text-primary/30" />
            </div>

            {/* Article Content */}
            <div className="space-y-8">
              {/* Intro */}
              <p className="text-xl text-muted-foreground leading-relaxed">
                There&apos;s something special about gathering the family for movie night. But finding
                content everyone can enjoy — and that won&apos;t have you diving for the remote —
                can be a challenge. Here&apos;s how to make movie night stress-free.
              </p>

              {/* Section 1 */}
              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground pt-4 border-t border-border">
                  The Movie Night Challenge
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Sound familiar? You&apos;ve found what looks like the perfect family movie. Great reviews,
                  interesting plot, something for everyone. You make the popcorn, gather the kids, and
                  settle in. Twenty minutes later, a character drops an unexpected word and suddenly
                  you&apos;re fielding questions you weren&apos;t prepared for.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  The ratings system helps, but it&apos;s not perfect. A PG-13 movie might have one or two
                  words, or it might have a lot more. You won&apos;t know until you&apos;re watching together.
                </p>
              </section>

              {/* Section 2 */}
              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground pt-4 border-t border-border">
                  Enter SafePlay
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  This is exactly why we built SafePlay. Before movie night, take five minutes to filter
                  your chosen film. When you watch together, any problematic language is automatically
                  muted or bleeped. You enjoy the movie, the kids enjoy the movie, and nobody has to
                  hit pause.
                </p>
              </section>

              {/* Section 3 */}
              <section className="space-y-6">
                <h2 className="text-2xl font-bold text-foreground pt-4 border-t border-border">
                  Planning the Perfect Movie Night
                </h2>

                {/* Step 1 */}
                <div className="p-6 rounded-xl bg-muted/50 border border-border">
                  <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-primary text-white text-sm flex items-center justify-center">1</span>
                    Choose Your Movie
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Finding the right movie is half the battle. Here are some resources:
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span className="text-muted-foreground">
                        <strong className="text-foreground">Common Sense Media:</strong> Detailed reviews with age ratings and content breakdowns for thousands of movies.
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span className="text-muted-foreground">
                        <strong className="text-foreground">IMDB Parents Guide:</strong> User-contributed content warnings organized by category (violence, language, etc.).
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span className="text-muted-foreground">
                        <strong className="text-foreground">Age-appropriate streaming categories:</strong> Most streaming services have family or kids sections.
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Step 2 */}
                <div className="p-6 rounded-xl bg-muted/50 border border-border">
                  <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-primary text-white text-sm flex items-center justify-center">2</span>
                    Filter It
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Once you&apos;ve picked a movie on YouTube, run it through SafePlay:
                  </p>
                  <ol className="space-y-2">
                    {[
                      "Copy the YouTube URL",
                      "Paste it into SafePlay",
                      "Confirm the credit cost (a 90-minute movie = 90 credits)",
                      "Wait a few minutes for filtering to complete",
                      "You're ready for movie night!"
                    ].map((step, i) => (
                      <li key={i} className="flex items-start gap-3 text-muted-foreground">
                        <span className="w-5 h-5 rounded bg-primary/10 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Step 3 */}
                <div className="p-6 rounded-xl bg-muted/50 border border-border">
                  <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-primary text-white text-sm flex items-center justify-center">3</span>
                    Set the Scene
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Make it special! Movie night isn&apos;t just about the movie — it&apos;s about the experience:
                  </p>
                  <ul className="space-y-2">
                    {[
                      "Make (or order) everyone's favorite movie snacks",
                      "Dim the lights and close the curtains",
                      "Gather blankets and pillows for a cozy setup",
                      "Put phones away — this is quality family time"
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              {/* Section 4 - Movie Recommendations */}
              <section className="space-y-6">
                <h2 className="text-2xl font-bold text-foreground pt-4 border-t border-border">
                  Movie Recommendations by Age
                </h2>

                <div className="grid gap-4">
                  {/* Ages 4-7 */}
                  <div className="p-6 rounded-xl bg-card border border-border">
                    <h3 className="text-lg font-semibold text-foreground mb-2">Ages 4-7</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Animated classics and gentle adventures that captivate young viewers.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {["Finding Nemo", "Toy Story", "Paddington", "Moana", "Frozen"].map((movie) => (
                        <span key={movie} className="px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-medium">
                          {movie}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Ages 8-12 */}
                  <div className="p-6 rounded-xl bg-card border border-border">
                    <h3 className="text-lg font-semibold text-foreground mb-2">Ages 8-12</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Adventure, humor, and stories with more complexity that still stay appropriate.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {["The Incredibles", "Harry Potter (early)", "Jumanji", "Night at the Museum", "Hugo"].map((movie) => (
                        <span key={movie} className="px-3 py-1.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-sm font-medium">
                          {movie}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Teens */}
                  <div className="p-6 rounded-xl bg-card border border-border">
                    <h3 className="text-lg font-semibold text-foreground mb-2">Teens & Up (with SafePlay)</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      PG-13 films that might have occasional language — perfect candidates for filtering.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {["Marvel films", "Star Wars", "Indiana Jones", "Back to the Future", "The Princess Bride"].map((movie) => (
                        <span key={movie} className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                          {movie}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 5 */}
              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground pt-4 border-t border-border">
                  Making It a Tradition
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  The best family movie nights become traditions. Consider:
                </p>
                <ul className="space-y-3">
                  {[
                    { title: "Same night each week", desc: "Make it predictable so everyone looks forward to it." },
                    { title: "Rotating chooser", desc: "Let each family member take turns picking the movie." },
                    { title: "Theme nights", desc: "Decade night (80s movies!), genre night (only comedies), or franchise marathons." },
                    { title: "Discussion time", desc: "After the movie, spend a few minutes talking about favorite moments." },
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span className="text-muted-foreground">
                        <strong className="text-foreground">{item.title}:</strong> {item.desc}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Section 6 */}
              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground pt-4 border-t border-border">
                  Beyond Movies: Documentary Night
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  YouTube is packed with amazing documentaries — nature, history, science, travel. These
                  make great family viewing too, and filtering ensures that even documentaries with
                  occasional language stay appropriate.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Some great documentary series for families:
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Planet Earth / Blue Planet", "Cosmos", "Free Solo", "Won't You Be My Neighbor"].map((doc) => (
                    <span key={doc} className="px-3 py-1.5 rounded-full bg-muted text-foreground text-sm">
                      {doc}
                    </span>
                  ))}
                </div>
              </section>

              {/* Conclusion */}
              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground pt-4 border-t border-border">
                  The Bottom Line
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Movie night should be fun, not stressful. With a little planning and SafePlay in your
                  toolkit, you can watch confidently with your family, knowing the content is appropriate
                  for everyone. No more hovering over the remote, no more awkward moments — just quality
                  time together.
                </p>
                <p className="text-xl text-foreground font-medium">
                  Now go make some popcorn. 🍿
                </p>
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
                  href="/blog/screen-time-tips"
                  className="group p-4 rounded-xl border border-border hover:border-primary/30 transition-colors"
                >
                  <span className="text-sm text-primary">Family Tips</span>
                  <h4 className="mt-2 font-semibold text-foreground group-hover:text-primary transition-colors">
                    5 Tips for Managing Screen Time with Kids
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

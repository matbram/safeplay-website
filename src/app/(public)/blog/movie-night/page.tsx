import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock, User, Film, Popcorn, Star } from "lucide-react";

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
              <span className="text-primary font-medium">Family Tips</span>
              <h1 className="mt-4 text-3xl lg:text-4xl font-bold text-foreground">
                Family Movie Night Made Easy
              </h1>
              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  SafePlay Team
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  December 15, 2025
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  5 min read
                </span>
              </div>
            </header>

            {/* Featured Image Placeholder */}
            <div className="aspect-video rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 mb-12 flex items-center justify-center">
              <Film className="w-24 h-24 text-primary/30" />
            </div>

            {/* Content */}
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <p className="lead text-xl text-muted-foreground">
                There&apos;s something special about gathering the family for movie night. But finding
                content everyone can enjoy — and that won&apos;t have you diving for the remote —
                can be a challenge. Here&apos;s how to make movie night stress-free.
              </p>

              <h2>The Movie Night Challenge</h2>
              <p>
                Sound familiar? You&apos;ve found what looks like the perfect family movie. Great reviews,
                interesting plot, something for everyone. You make the popcorn, gather the kids, and
                settle in. Twenty minutes later, a character drops an unexpected word and suddenly
                you&apos;re fielding questions you weren&apos;t prepared for.
              </p>
              <p>
                The ratings system helps, but it&apos;s not perfect. A PG-13 movie might have one or two
                words, or it might have a lot more. You won&apos;t know until you&apos;re watching together.
              </p>

              <h2>Enter SafePlay</h2>
              <p>
                This is exactly why we built SafePlay. Before movie night, take five minutes to filter
                your chosen film. When you watch together, any problematic language is automatically
                muted or bleeped. You enjoy the movie, the kids enjoy the movie, and nobody has to
                hit pause.
              </p>

              <h2>Planning the Perfect Movie Night</h2>

              <h3>Step 1: Choose Your Movie</h3>
              <p>
                Finding the right movie is half the battle. Here are some resources:
              </p>
              <ul>
                <li>
                  <strong>Common Sense Media:</strong> Detailed reviews with age ratings and content
                  breakdowns for thousands of movies.
                </li>
                <li>
                  <strong>IMDB Parents Guide:</strong> User-contributed content warnings organized
                  by category (violence, language, etc.).
                </li>
                <li>
                  <strong>Age-appropriate streaming categories:</strong> Most streaming services have
                  family or kids sections.
                </li>
              </ul>

              <h3>Step 2: Filter It</h3>
              <p>
                Once you&apos;ve picked a movie on YouTube (many classic films, documentaries, and
                family-friendly content is available), run it through SafePlay:
              </p>
              <ol>
                <li>Copy the YouTube URL</li>
                <li>Paste it into SafePlay</li>
                <li>Confirm the credit cost (a 90-minute movie = 90 credits)</li>
                <li>Wait a few minutes for filtering to complete</li>
                <li>You&apos;re ready for movie night!</li>
              </ol>

              <h3>Step 3: Set the Scene</h3>
              <p>
                Make it special! Movie night isn&apos;t just about the movie — it&apos;s about the experience:
              </p>
              <ul>
                <li>Make (or order) everyone&apos;s favorite movie snacks</li>
                <li>Dim the lights and close the curtains</li>
                <li>Gather blankets and pillows for a cozy setup</li>
                <li>Put phones away — this is quality family time</li>
              </ul>

              <h2>Movie Recommendations by Age</h2>
            </div>

            {/* Age Group Cards */}
            <div className="not-prose my-12 space-y-6">
              <div className="p-6 rounded-2xl bg-card border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-3">Ages 4-7</h3>
                <p className="text-muted-foreground mb-4">
                  Animated classics and gentle adventures that captivate young viewers.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Finding Nemo", "Toy Story", "Paddington", "Moana", "Frozen"].map((movie) => (
                    <span key={movie} className="px-3 py-1 rounded-full bg-muted text-sm">
                      {movie}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-card border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-3">Ages 8-12</h3>
                <p className="text-muted-foreground mb-4">
                  Adventure, humor, and stories with more complexity that still stay appropriate.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["The Incredibles", "Harry Potter (early)", "Jumanji", "Night at the Museum", "Hugo"].map((movie) => (
                    <span key={movie} className="px-3 py-1 rounded-full bg-muted text-sm">
                      {movie}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-card border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-3">Teens & Up (with SafePlay)</h3>
                <p className="text-muted-foreground mb-4">
                  PG-13 films that might have occasional language — perfect candidates for filtering.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Marvel films", "Star Wars", "Indiana Jones", "Back to the Future", "The Princess Bride"].map((movie) => (
                    <span key={movie} className="px-3 py-1 rounded-full bg-muted text-sm">
                      {movie}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="prose prose-slate dark:prose-invert max-w-none">
              <h2>Making It a Tradition</h2>
              <p>
                The best family movie nights become traditions. Consider:
              </p>
              <ul>
                <li>
                  <strong>Same night each week:</strong> Make it predictable so everyone looks forward
                  to it.
                </li>
                <li>
                  <strong>Rotating chooser:</strong> Let each family member take turns picking the movie.
                </li>
                <li>
                  <strong>Theme nights:</strong> Decade night (80s movies!), genre night (only comedies),
                  or franchise marathons.
                </li>
                <li>
                  <strong>Discussion time:</strong> After the movie, spend a few minutes talking about
                  favorite moments, what everyone learned, or what they&apos;d change about the ending.
                </li>
              </ul>

              <h2>Beyond Movies: Documentary Night</h2>
              <p>
                YouTube is packed with amazing documentaries — nature, history, science, travel. These
                make great family viewing too, and filtering ensures that even documentaries with
                occasional language (like news footage or interviews) stay appropriate.
              </p>
              <p>
                Some great documentary series for families:
              </p>
              <ul>
                <li>Planet Earth / Blue Planet (nature)</li>
                <li>Cosmos (space and science)</li>
                <li>Free Solo (adventure — though check content first!)</li>
                <li>Won&apos;t You Be My Neighbor (heartwarming)</li>
              </ul>

              <h2>The Bottom Line</h2>
              <p>
                Movie night should be fun, not stressful. With a little planning and SafePlay in your
                toolkit, you can watch confidently with your family, knowing the content is appropriate
                for everyone. No more hovering over the remote, no more awkward moments — just quality
                time together.
              </p>
              <p>
                Now go make some popcorn. 🍿
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

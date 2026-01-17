import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock, User } from "lucide-react";

export const metadata = {
  title: "Why Content Filtering Matters for Classrooms - SafePlay Blog",
  description: "Discover how educators are using SafePlay to bring educational YouTube content safely into their teaching.",
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
              <span className="text-primary font-medium">Education</span>
              <h1 className="mt-4 text-3xl lg:text-4xl font-bold text-foreground">
                Why Content Filtering Matters for Classrooms
              </h1>
              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  SafePlay Team
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  January 10, 2026
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  4 min read
                </span>
              </div>
            </header>

            {/* Featured Image Placeholder */}
            <div className="aspect-video rounded-2xl bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30 mb-12" />

            {/* Content */}
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <p className="lead text-xl text-muted-foreground">
                YouTube has become an invaluable teaching tool, with millions of educational videos
                covering every subject imaginable. But for educators, there&apos;s always that nagging
                worry: what if there&apos;s inappropriate language I didn&apos;t catch when previewing?
              </p>

              <h2>The YouTube Classroom Dilemma</h2>
              <p>
                Teachers across the country rely on YouTube to enhance their lessons. Whether it&apos;s
                a documentary about the Civil War, a science experiment demonstration, or a TED talk
                on literature, video content brings subjects to life in ways textbooks simply can&apos;t.
              </p>
              <p>
                But here&apos;s the challenge: even &quot;educational&quot; content can contain unexpected
                language. A passionate lecturer might let a word slip. A documentary might include
                historically accurate but inappropriate terms. A clip from a news broadcast might
                have uncensored interviews.
              </p>
              <p>
                The traditional solution? Teachers spend hours pre-screening every video, sometimes
                multiple times. Even then, something might slip through. One teacher we spoke with
                described the anxiety of pressing play in front of 30 students, never quite sure
                what might come next.
              </p>

              <h2>How Educators Are Using SafePlay</h2>
              <p>
                Increasingly, schools and individual teachers are turning to content filtering tools
                like SafePlay to solve this problem. Here&apos;s how it works in practice:
              </p>

              <h3>Before Class</h3>
              <p>
                Teachers find a video they want to use and run it through SafePlay. The filtering
                process identifies any profanity and automatically creates a clean version that
                mutes or bleeps those moments. This takes minutes, not the hours of manual preview.
              </p>

              <h3>During Class</h3>
              <p>
                When it&apos;s time to show the video, teachers can play it confidently. If there&apos;s
                a word that would be inappropriate for students, it&apos;s already been handled. The
                flow of the video remains intact—students might not even notice anything was filtered.
              </p>

              <h3>Repeat Use</h3>
              <p>
                Once a video has been filtered, that clean version is saved. Teachers can reuse it
                year after year, or share it with colleagues who teach the same material. No need
                to filter the same content twice.
              </p>

              <h2>Real Teachers, Real Results</h2>
              <blockquote>
                <p>
                  &quot;I used to spend my Sunday nights previewing videos for the week. Now I can
                  find a video, filter it in minutes, and know it&apos;s safe for my classroom.
                  It&apos;s given me hours of my life back.&quot;
                </p>
                <cite>— Michael T., High School History Teacher</cite>
              </blockquote>

              <blockquote>
                <p>
                  &quot;There&apos;s so much great content on YouTube that I was afraid to use because
                  I couldn&apos;t be 100% sure about the language. SafePlay has opened up a whole
                  library of resources I can now confidently share with my students.&quot;
                </p>
                <cite>— Jennifer L., Middle School Science Teacher</cite>
              </blockquote>

              <h2>Beyond Individual Classrooms</h2>
              <p>
                Some schools are implementing SafePlay at an institutional level. This allows:
              </p>
              <ul>
                <li>Centralized management of filtered content libraries</li>
                <li>Consistent standards across all classrooms</li>
                <li>Shared resources that any teacher can access</li>
                <li>Administrative oversight and reporting</li>
              </ul>
              <p>
                Our Organization plan is specifically designed for schools and districts that want
                to provide safe video content across their entire institution.
              </p>

              <h2>Getting Started in Your Classroom</h2>
              <p>
                If you&apos;re an educator interested in using SafePlay, here&apos;s how to begin:
              </p>
              <ol>
                <li>
                  <strong>Start with the free plan</strong> — Get 30 credits per month to try it out
                  with no commitment.
                </li>
                <li>
                  <strong>Filter your most-used videos first</strong> — Begin with the content you
                  show most frequently. Once filtered, you can reuse it indefinitely.
                </li>
                <li>
                  <strong>Talk to your administration</strong> — If you find it valuable, discuss
                  whether your school might benefit from an institutional account.
                </li>
              </ol>

              <h2>The Bottom Line</h2>
              <p>
                YouTube is too valuable an educational resource to avoid because of language concerns.
                With proper filtering tools, educators can confidently leverage the platform&apos;s
                vast library of content while maintaining appropriate classroom standards.
              </p>
              <p>
                The goal isn&apos;t to sanitize education—it&apos;s to ensure that when you show a
                video about scientific discoveries or historical events, the focus stays on the
                learning, not on an unexpected word that derails the entire lesson.
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
                  href="/blog/edu-channels"
                  className="p-4 rounded-xl border border-border hover:border-primary/30 transition-colors"
                >
                  <span className="text-sm text-primary">Recommendations</span>
                  <h4 className="mt-2 font-semibold text-foreground">Best Educational YouTube Channels for Kids</h4>
                </Link>
                <Link
                  href="/blog/custom-filters"
                  className="p-4 rounded-xl border border-border hover:border-primary/30 transition-colors"
                >
                  <span className="text-sm text-primary">Product Updates</span>
                  <h4 className="mt-2 font-semibold text-foreground">New Feature: Custom Word Filters</h4>
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

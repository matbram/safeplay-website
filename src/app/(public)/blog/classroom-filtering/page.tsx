import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock, User, GraduationCap, CheckCircle, Quote } from "lucide-react";

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
              <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                Education
              </span>
              <h1 className="mt-4 text-3xl lg:text-4xl font-bold text-foreground">
                Why Content Filtering Matters for Classrooms
              </h1>
              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  SafePlay Team
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  January 10, 2026
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  4 min read
                </span>
              </div>
            </header>

            {/* Featured Image */}
            <div className="aspect-video rounded-2xl bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30 mb-12 flex items-center justify-center">
              <GraduationCap className="w-24 h-24 text-primary/30" />
            </div>

            {/* Article Content */}
            <div className="space-y-8">
              {/* Intro */}
              <p className="text-xl text-muted-foreground leading-relaxed">
                YouTube has become an invaluable teaching tool, with millions of educational videos
                covering every subject imaginable. But for educators, there&apos;s always that nagging
                worry: what if there&apos;s inappropriate language I didn&apos;t catch when previewing?
              </p>

              {/* Section 1 */}
              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground pt-4 border-t border-border">
                  The YouTube Classroom Dilemma
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Teachers across the country rely on YouTube to enhance their lessons. Whether it&apos;s
                  a documentary about the Civil War, a science experiment demonstration, or a TED talk
                  on literature, video content brings subjects to life in ways textbooks simply can&apos;t.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  But here&apos;s the challenge: even &quot;educational&quot; content can contain unexpected
                  language. A passionate lecturer might let a word slip. A documentary might include
                  historically accurate but inappropriate terms. A clip from a news broadcast might
                  have uncensored interviews.
                </p>
                <div className="p-4 rounded-xl bg-warning/10 border border-warning/20">
                  <p className="text-sm text-foreground">
                    <strong>The traditional solution?</strong> Teachers spend hours pre-screening every video, sometimes
                    multiple times. Even then, something might slip through.
                  </p>
                </div>
              </section>

              {/* Section 2 */}
              <section className="space-y-6">
                <h2 className="text-2xl font-bold text-foreground pt-4 border-t border-border">
                  How Educators Are Using SafePlay
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Increasingly, schools and individual teachers are turning to content filtering tools
                  like SafePlay to solve this problem. Here&apos;s how it works in practice:
                </p>

                <div className="grid gap-4">
                  {[
                    {
                      title: "Before Class",
                      desc: "Teachers find a video they want to use and run it through SafePlay. The filtering process identifies any profanity and automatically creates a clean version. This takes minutes, not hours of manual preview.",
                      color: "bg-blue-500"
                    },
                    {
                      title: "During Class",
                      desc: "When it's time to show the video, teachers can play it confidently. If there's a word that would be inappropriate, it's already been handled. The flow remains intact—students might not even notice.",
                      color: "bg-green-500"
                    },
                    {
                      title: "Repeat Use",
                      desc: "Once a video has been filtered, that clean version is saved. Teachers can reuse it year after year, or share it with colleagues. No need to filter the same content twice.",
                      color: "bg-purple-500"
                    }
                  ].map((item) => (
                    <div key={item.title} className="p-5 rounded-xl bg-card border border-border">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-3 h-3 rounded-full ${item.color}`} />
                        <h3 className="font-semibold text-foreground">{item.title}</h3>
                      </div>
                      <p className="text-muted-foreground text-sm pl-6">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Section 3 - Testimonials */}
              <section className="space-y-6">
                <h2 className="text-2xl font-bold text-foreground pt-4 border-t border-border">
                  Real Teachers, Real Results
                </h2>

                <div className="space-y-4">
                  <div className="p-6 rounded-xl bg-muted/50 border border-border relative">
                    <Quote className="absolute top-4 right-4 w-8 h-8 text-primary/20" />
                    <p className="text-foreground italic leading-relaxed">
                      &quot;I used to spend my Sunday nights previewing videos for the week. Now I can
                      find a video, filter it in minutes, and know it&apos;s safe for my classroom.
                      It&apos;s given me hours of my life back.&quot;
                    </p>
                    <p className="mt-4 text-sm text-muted-foreground font-medium">
                      — Michael T., High School History Teacher
                    </p>
                  </div>

                  <div className="p-6 rounded-xl bg-muted/50 border border-border relative">
                    <Quote className="absolute top-4 right-4 w-8 h-8 text-primary/20" />
                    <p className="text-foreground italic leading-relaxed">
                      &quot;There&apos;s so much great content on YouTube that I was afraid to use because
                      I couldn&apos;t be 100% sure about the language. SafePlay has opened up a whole
                      library of resources I can now confidently share with my students.&quot;
                    </p>
                    <p className="mt-4 text-sm text-muted-foreground font-medium">
                      — Jennifer L., Middle School Science Teacher
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 4 */}
              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground pt-4 border-t border-border">
                  Beyond Individual Classrooms
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Some schools are implementing SafePlay at an institutional level. This allows:
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    "Centralized management of filtered content",
                    "Consistent standards across all classrooms",
                    "Shared resources any teacher can access",
                    "Administrative oversight and reporting"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
                      <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{item}</span>
                    </div>
                  ))}
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Our Organization plan is specifically designed for schools and districts that want
                  to provide safe video content across their entire institution.
                </p>
              </section>

              {/* Section 5 */}
              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground pt-4 border-t border-border">
                  Getting Started in Your Classroom
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  If you&apos;re an educator interested in using SafePlay, here&apos;s how to begin:
                </p>
                <div className="space-y-3">
                  {[
                    { step: "1", title: "Start with the free plan", desc: "Get 30 credits per month to try it out with no commitment." },
                    { step: "2", title: "Filter your most-used videos first", desc: "Begin with content you show most frequently. Once filtered, reuse it indefinitely." },
                    { step: "3", title: "Talk to your administration", desc: "If valuable, discuss whether your school might benefit from an institutional account." }
                  ].map((item) => (
                    <div key={item.step} className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border">
                      <span className="w-8 h-8 rounded-full bg-primary text-white font-bold flex items-center justify-center flex-shrink-0">
                        {item.step}
                      </span>
                      <div>
                        <p className="font-semibold text-foreground">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Conclusion */}
              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground pt-4 border-t border-border">
                  The Bottom Line
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  YouTube is too valuable an educational resource to avoid because of language concerns.
                  With proper filtering tools, educators can confidently leverage the platform&apos;s
                  vast library of content while maintaining appropriate classroom standards.
                </p>
                <div className="p-6 rounded-xl bg-primary/10 border border-primary/20">
                  <p className="text-foreground">
                    The goal isn&apos;t to sanitize education—it&apos;s to ensure that when you show a
                    video about scientific discoveries or historical events, <strong>the focus stays on the
                    learning</strong>, not on an unexpected word that derails the entire lesson.
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
                  href="/blog/edu-channels"
                  className="group p-4 rounded-xl border border-border hover:border-primary/30 transition-colors"
                >
                  <span className="text-sm text-primary">Recommendations</span>
                  <h4 className="mt-2 font-semibold text-foreground group-hover:text-primary transition-colors">
                    Best Educational YouTube Channels for Kids
                  </h4>
                </Link>
                <Link
                  href="/blog/custom-filters"
                  className="group p-4 rounded-xl border border-border hover:border-primary/30 transition-colors"
                >
                  <span className="text-sm text-primary">Product Updates</span>
                  <h4 className="mt-2 font-semibold text-foreground group-hover:text-primary transition-colors">
                    New Feature: Custom Word Filters
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

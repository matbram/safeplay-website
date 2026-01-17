import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BookOpen, ArrowRight, Calendar, Clock } from "lucide-react";

export const metadata = {
  title: "Blog - SafePlay",
  description: "Tips, updates, and insights about family-friendly content and digital wellness.",
};

const posts = [
  {
    title: "5 Tips for Managing Screen Time with Kids",
    excerpt: "Learn practical strategies for creating healthy digital habits for your family without constant battles.",
    category: "Family Tips",
    date: "Jan 15, 2026",
    readTime: "5 min read",
    image: "/blog/screen-time.jpg",
  },
  {
    title: "Why Content Filtering Matters for Classrooms",
    excerpt: "Discover how educators are using SafePlay to bring educational YouTube content safely into their teaching.",
    category: "Education",
    date: "Jan 10, 2026",
    readTime: "4 min read",
    image: "/blog/classroom.jpg",
  },
  {
    title: "New Feature: Custom Word Filters",
    excerpt: "We've launched the ability to add your own words to the filter list. Here's how to make the most of it.",
    category: "Product Updates",
    date: "Jan 5, 2026",
    readTime: "3 min read",
    image: "/blog/custom-filters.jpg",
  },
  {
    title: "The Best Educational YouTube Channels for Kids",
    excerpt: "Our curated list of engaging, educational channels that parents and teachers love.",
    category: "Recommendations",
    date: "Dec 28, 2025",
    readTime: "6 min read",
    image: "/blog/edu-channels.jpg",
  },
  {
    title: "How SafePlay Protects Your Privacy",
    excerpt: "An inside look at how we handle your data and why privacy is central to our mission.",
    category: "Company",
    date: "Dec 20, 2025",
    readTime: "4 min read",
    image: "/blog/privacy.jpg",
  },
  {
    title: "Family Movie Night Made Easy",
    excerpt: "Tips for picking the perfect movie and using SafePlay to ensure it's appropriate for everyone.",
    category: "Family Tips",
    date: "Dec 15, 2025",
    readTime: "5 min read",
    image: "/blog/movie-night.jpg",
  },
];

const categories = ["All", "Family Tips", "Education", "Product Updates", "Company", "Recommendations"];

export default function BlogPage() {
  return (
    <>
      <Header />
      <main className="pt-16">
        {/* Hero */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <BookOpen className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">SafePlay Blog</span>
              </div>

              <h1 className="heading-display text-foreground">
                Insights & <span className="gradient-text">Updates</span>
              </h1>

              <p className="mt-6 text-lg text-muted-foreground">
                Tips for families, product updates, and everything you need to know about
                creating a safer viewing experience.
              </p>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="pb-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map((category, index) => (
                <button
                  key={category}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    index === 0
                      ? "bg-primary text-white"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Posts Grid */}
        <section className="py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <article
                  key={post.title}
                  className="group rounded-2xl bg-card border border-border overflow-hidden hover:border-primary/30 transition-colors"
                >
                  <div className="aspect-video bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800" />
                  <div className="p-6">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                      <span className="text-primary font-medium">{post.category}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {post.date}
                      </span>
                    </div>
                    <h2 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                      {post.title}
                    </h2>
                    <p className="mt-2 text-muted-foreground text-sm line-clamp-2">
                      {post.excerpt}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {post.readTime}
                      </span>
                      <span className="text-primary text-sm font-medium group-hover:underline flex items-center gap-1">
                        Read more
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Button variant="outline" size="lg">
                Load More Posts
              </Button>
            </div>
          </div>
        </section>

        {/* Newsletter */}
        <section className="py-20 bg-background-secondary">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="heading-1 text-foreground">
              Stay <span className="gradient-text">Updated</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Get the latest tips and product updates delivered to your inbox.
            </p>
            <form className="mt-8 flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 rounded-lg border border-input bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button type="submit">Subscribe</Button>
            </form>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

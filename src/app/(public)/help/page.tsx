import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  HelpCircle,
  Search,
  Chrome,
  CreditCard,
  Users,
  Settings,
  Shield,
  MessageSquare,
  BookOpen,
  ArrowRight,
} from "lucide-react";

export const metadata = {
  title: "Help Center - SafePlay",
  description: "Find answers to common questions and learn how to get the most out of SafePlay.",
};

const categories = [
  {
    icon: Chrome,
    title: "Getting Started",
    description: "Installation, setup, and your first filtered video",
    articles: 8,
  },
  {
    icon: Shield,
    title: "Filtering & Detection",
    description: "How filtering works, accuracy, and customization",
    articles: 12,
  },
  {
    icon: CreditCard,
    title: "Billing & Credits",
    description: "Plans, payments, credits, and refunds",
    articles: 10,
  },
  {
    icon: Users,
    title: "Family & Profiles",
    description: "Managing family members and parental controls",
    articles: 7,
  },
  {
    icon: Settings,
    title: "Account Settings",
    description: "Profile, preferences, and security",
    articles: 9,
  },
  {
    icon: BookOpen,
    title: "Troubleshooting",
    description: "Common issues and how to fix them",
    articles: 15,
  },
];

const popularArticles = [
  "How to install the Chrome extension",
  "Understanding credits and billing",
  "Setting up family profiles",
  "Customizing your filter settings",
  "What videos does SafePlay work with?",
  "How to cancel or change your subscription",
];

export default function HelpPage() {
  return (
    <>
      <Header />
      <main className="pt-16">
        {/* Hero */}
        <section className="py-20 lg:py-28 bg-background-secondary">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <HelpCircle className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">Help Center</span>
              </div>

              <h1 className="heading-display text-foreground">
                How Can We <span className="gradient-text">Help?</span>
              </h1>

              <div className="mt-8 max-w-xl mx-auto">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="search"
                    placeholder="Search for answers..."
                    className="w-full rounded-xl border border-input bg-background pl-12 pr-4 py-4 text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="heading-1 text-foreground">
                Browse by <span className="gradient-text">Topic</span>
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => (
                <Link
                  key={category.title}
                  href="/faq"
                  className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <category.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {category.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">{category.description}</p>
                  <p className="mt-3 text-sm text-primary font-medium">
                    {category.articles} articles
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Popular Articles */}
        <section className="py-20 bg-background-secondary">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold text-foreground text-center mb-8">
                Popular Articles
              </h2>

              <div className="space-y-3">
                {popularArticles.map((article) => (
                  <Link
                    key={article}
                    href="/faq"
                    className="flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors group"
                  >
                    <span className="text-foreground group-hover:text-primary transition-colors">
                      {article}
                    </span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto">
              <MessageSquare className="w-12 h-12 text-primary mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-foreground">
                Still Need Help?
              </h2>
              <p className="mt-4 text-muted-foreground">
                Our support team is here to help you with any questions or issues.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link href="/contact">Contact Support</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/faq">View All FAQs</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

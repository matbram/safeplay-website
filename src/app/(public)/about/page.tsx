import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Shield, Heart, Users, Target, Sparkles } from "lucide-react";

export const metadata = {
  title: "About Us - SafePlay",
  description: "Learn about SafePlay's mission to make YouTube safe for families, educators, and workplaces everywhere.",
};

const values = [
  {
    icon: Shield,
    title: "Safety First",
    description: "We believe everyone deserves to enjoy content without worrying about inappropriate language.",
  },
  {
    icon: Heart,
    title: "Family Focused",
    description: "Our solutions are designed with families in mind, making screen time a positive experience.",
  },
  {
    icon: Users,
    title: "Community Driven",
    description: "We listen to our users and continuously improve based on their needs and feedback.",
  },
  {
    icon: Target,
    title: "Precision Matters",
    description: "We strive for the highest accuracy in filtering while preserving the viewing experience.",
  },
];

const stats = [
  { value: "10,000+", label: "Active Families" },
  { value: "1M+", label: "Videos Filtered" },
  { value: "99.5%", label: "Accuracy Rate" },
  { value: "2022", label: "Founded" },
];

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="pt-16">
        {/* Hero */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">Our Story</span>
              </div>

              <h1 className="heading-display text-foreground">
                Making YouTube Safe for <span className="gradient-text">Everyone</span>
              </h1>

              <p className="mt-6 text-lg text-muted-foreground">
                SafePlay was born from a simple idea: families should be able to enjoy YouTube content
                together without worrying about unexpected profanity. What started as a solution for
                our own family movie nights has grown into a trusted tool for thousands of families,
                educators, and organizations worldwide.
              </p>
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="py-20 bg-background-secondary">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="heading-1 text-foreground">
                  Our <span className="gradient-text">Mission</span>
                </h2>
                <p className="mt-6 text-lg text-muted-foreground">
                  We&apos;re on a mission to give everyone control over their viewing experience.
                  Whether you&apos;re a parent wanting to share educational content with your kids,
                  a teacher using videos in the classroom, or an office manager keeping the break
                  room appropriate — SafePlay is here for you.
                </p>
                <p className="mt-4 text-lg text-muted-foreground">
                  We believe that technology should adapt to your values, not the other way around.
                  That&apos;s why we&apos;ve built SafePlay to be powerful yet simple, giving you
                  sophisticated filtering without the complexity.
                </p>
                <div className="mt-8">
                  <Button size="lg" asChild>
                    <Link href="/signup">Join Our Community</Link>
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {stats.map((stat) => (
                  <div key={stat.label} className="p-6 rounded-2xl bg-card border border-border text-center">
                    <p className="text-3xl font-bold text-primary">{stat.value}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="heading-1 text-foreground">
                Our <span className="gradient-text">Values</span>
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                These principles guide everything we do at SafePlay.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value) => (
                <div key={value.title} className="p-6 rounded-2xl bg-card border border-border">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <value.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{value.title}</h3>
                  <p className="mt-2 text-muted-foreground">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-background-secondary">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="heading-1 text-foreground">
                Ready to Get Started?
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Join thousands of families enjoying cleaner content today.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="xl" asChild>
                  <Link href="/signup">Start Free Trial</Link>
                </Button>
                <Button size="xl" variant="outline" asChild>
                  <Link href="/contact">Contact Us</Link>
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

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Briefcase, MapPin, Clock, Heart, Zap, Users, Coffee } from "lucide-react";

export const metadata = {
  title: "Careers - SafePlay",
  description: "Join the SafePlay team and help make YouTube safe for families everywhere.",
};

const benefits = [
  { icon: Heart, title: "Health & Wellness", description: "Comprehensive health, dental, and vision coverage" },
  { icon: Coffee, title: "Remote First", description: "Work from anywhere in the world" },
  { icon: Zap, title: "Learning Budget", description: "$2,000 annual budget for courses and conferences" },
  { icon: Users, title: "Team Retreats", description: "Annual company gatherings in amazing locations" },
];

const openings = [
  {
    title: "Senior Full-Stack Engineer",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
  },
  {
    title: "Product Designer",
    department: "Design",
    location: "Remote",
    type: "Full-time",
  },
  {
    title: "Customer Success Manager",
    department: "Support",
    location: "Remote",
    type: "Full-time",
  },
  {
    title: "Growth Marketing Manager",
    department: "Marketing",
    location: "Remote",
    type: "Full-time",
  },
];

export default function CareersPage() {
  return (
    <>
      <Header />
      <main className="pt-16">
        {/* Hero */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <Briefcase className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">We&apos;re Hiring</span>
              </div>

              <h1 className="heading-display text-foreground">
                Join the <span className="gradient-text">SafePlay Team</span>
              </h1>

              <p className="mt-6 text-lg text-muted-foreground">
                Help us build the future of family-friendly content. We&apos;re looking for
                passionate people who want to make a real difference in how families experience YouTube.
              </p>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-20 bg-background-secondary">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="heading-1 text-foreground">
                Why Work at <span className="gradient-text">SafePlay?</span>
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit) => (
                <div key={benefit.title} className="p-6 rounded-2xl bg-card border border-border">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <benefit.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">{benefit.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Open Positions */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="heading-1 text-foreground">
                Open <span className="gradient-text">Positions</span>
              </h2>
            </div>

            <div className="max-w-3xl mx-auto space-y-4">
              {openings.map((job) => (
                <div
                  key={job.title}
                  className="p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{job.title}</h3>
                      <div className="flex flex-wrap gap-3 mt-2">
                        <span className="text-sm text-muted-foreground">{job.department}</span>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {job.location}
                        </span>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {job.type}
                        </span>
                      </div>
                    </div>
                    <Button variant="outline" asChild>
                      <Link href="/contact">Apply Now</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <p className="text-muted-foreground">
                Don&apos;t see a position that fits?{" "}
                <Link href="/contact" className="text-primary hover:underline">
                  Send us your resume anyway
                </Link>
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

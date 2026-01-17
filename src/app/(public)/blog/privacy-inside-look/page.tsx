import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock, User, Shield, Lock, Eye, Server, Users, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";

export const metadata = {
  title: "How SafePlay Protects Your Privacy - SafePlay Blog",
  description: "An inside look at how we handle your data and why privacy is central to our mission.",
};

const privacyPrinciples = [
  {
    icon: Eye,
    title: "Minimal Collection",
    desc: "We only collect what's essential to provide the service.",
  },
  {
    icon: Lock,
    title: "Strong Encryption",
    desc: "All data is encrypted in transit and at rest.",
  },
  {
    icon: Server,
    title: "No Data Selling",
    desc: "We never sell your data to advertisers or third parties.",
  },
  {
    icon: Shield,
    title: "Your Control",
    desc: "You can delete your data anytime you choose.",
  },
];

const whatWeDontDo = [
  {
    title: "We don't sell data to advertisers",
    desc: "Our business model is subscriptions, not advertising.",
  },
  {
    title: "We don't build profiles for targeting",
    desc: "We don't analyze your viewing patterns to serve you ads or recommendations.",
  },
  {
    title: "We don't store video content",
    desc: "We process audio to identify profanity, but we don't store the videos themselves.",
  },
  {
    title: "We don't share with third parties",
    desc: "Your data stays with us (and the service providers necessary to operate, like our hosting provider and payment processor).",
  },
];

const securityMeasures = [
  "All connections use HTTPS/TLS encryption",
  "Data at rest is encrypted using AES-256",
  "Regular security audits and penetration testing",
  "Limited employee access to user data",
  "Two-factor authentication available for all accounts",
];

const yourRights = [
  { title: "Access", desc: "Download a copy of all data we have about you" },
  { title: "Correction", desc: "Update your information anytime" },
  { title: "Deletion", desc: "Delete your account and all associated data" },
  { title: "Portability", desc: "Export your data in a standard format" },
];

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
                Company
              </span>
              <h1 className="mt-4 text-3xl lg:text-4xl font-bold text-foreground">
                How SafePlay Protects Your Privacy
              </h1>
              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  SafePlay Team
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  December 20, 2025
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  4 min read
                </span>
              </div>
            </header>

            {/* Featured Image */}
            <div className="aspect-video rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 mb-12 flex items-center justify-center">
              <Shield className="w-24 h-24 text-primary/30" />
            </div>

            {/* Article Content */}
            <div className="space-y-8">
              {/* Intro */}
              <p className="text-xl text-muted-foreground leading-relaxed">
                When you use SafePlay, you&apos;re trusting us with information about what you watch.
                We take that trust seriously. Here&apos;s an inside look at how we protect your privacy.
              </p>

              {/* Section 1 - Philosophy */}
              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground pt-4 border-t border-border">
                  Our Privacy Philosophy
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Our approach to privacy is simple: <strong className="text-foreground">collect only what we need,
                  protect everything we have, and never sell your data</strong>. We&apos;re in the business of
                  filtering content, not monetizing your viewing habits.
                </p>

                {/* Privacy Principles Grid */}
                <div className="grid sm:grid-cols-2 gap-4 mt-6">
                  {privacyPrinciples.map((principle) => (
                    <div key={principle.title} className="p-5 rounded-xl bg-card border border-border">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                        <principle.icon className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="font-semibold text-foreground">{principle.title}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">{principle.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Section 2 - What We Collect */}
              <section className="space-y-6">
                <h2 className="text-2xl font-bold text-foreground pt-4 border-t border-border">
                  What We Collect (And Why)
                </h2>

                {/* Account Info */}
                <div className="p-5 rounded-xl bg-card border border-border">
                  <h3 className="text-lg font-semibold text-foreground mb-3">Account Information</h3>
                  <p className="text-muted-foreground mb-3">
                    When you sign up, we collect your email address and name. That&apos;s it. We use this to:
                  </p>
                  <ul className="space-y-2">
                    {[
                      "Let you log in to your account",
                      "Send important service updates",
                      "Respond to support requests",
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-muted-foreground">
                        <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Payment Info */}
                <div className="p-5 rounded-xl bg-card border border-border">
                  <h3 className="text-lg font-semibold text-foreground mb-3">Payment Information</h3>
                  <p className="text-muted-foreground">
                    If you subscribe to a paid plan, we use Stripe to process payments.
                    <strong className="text-foreground"> We never see or store your full credit card number</strong> —
                    that&apos;s handled entirely by Stripe, which is certified to the highest security
                    standards (PCI-DSS Level 1).
                  </p>
                </div>

                {/* Filtering Activity */}
                <div className="p-5 rounded-xl bg-card border border-border">
                  <h3 className="text-lg font-semibold text-foreground mb-3">Filtering Activity</h3>
                  <p className="text-muted-foreground mb-3">
                    When you filter a video, we record which video was filtered and when. This allows us to:
                  </p>
                  <ul className="space-y-2 mb-4">
                    {[
                      "Let you re-watch filtered videos without using more credits",
                      "Show your filtering history in your dashboard",
                      "Provide usage statistics and credit tracking",
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-muted-foreground">
                        <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-sm text-foreground">
                      <strong>Important:</strong> We don&apos;t track what you watch — only what you actively
                      choose to filter through SafePlay. Regular YouTube viewing isn&apos;t tracked by us at all.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 3 - What We Don't Do */}
              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground pt-4 border-t border-border">
                  What We Don&apos;t Do
                </h2>

                <div className="space-y-3">
                  {whatWeDontDo.map((item) => (
                    <div key={item.title} className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border">
                      <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-destructive text-lg">✕</span>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{item.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Section 4 - Family Privacy */}
              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground pt-4 border-t border-border">
                  Family Privacy
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Family accounts have additional privacy considerations. Here&apos;s how we handle them:
                </p>

                <div className="p-5 rounded-xl bg-muted/50 border border-border">
                  <div className="flex items-center gap-3 mb-4">
                    <Users className="w-6 h-6 text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">Family Account Privacy</h3>
                  </div>
                  <ul className="space-y-3">
                    {[
                      {
                        title: "Parental visibility",
                        desc: "Parents on the account can see children's viewing history. This is by design for parental oversight.",
                      },
                      {
                        title: "Profile separation",
                        desc: "Siblings can't see each other's history — only parents have cross-profile visibility.",
                      },
                      {
                        title: "Children's privacy",
                        desc: "We comply with COPPA and don't collect personal information from children beyond what's necessary for the service.",
                      },
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                        <div>
                          <span className="font-medium text-foreground">{item.title}:</span>{" "}
                          <span className="text-muted-foreground">{item.desc}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              {/* Section 5 - Security */}
              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground pt-4 border-t border-border">
                  Security Measures
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  We implement industry-standard security practices:
                </p>

                <div className="p-6 rounded-xl bg-[#0F0F0F] text-white">
                  <h3 className="text-lg font-semibold mb-4">Our Security Stack</h3>
                  <div className="space-y-3">
                    {securityMeasures.map((measure, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                        <span className="text-white/90">{measure}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Section 6 - Your Rights */}
              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground pt-4 border-t border-border">
                  Your Rights
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  You have control over your data:
                </p>

                <div className="grid sm:grid-cols-2 gap-3">
                  {yourRights.map((right) => (
                    <div key={right.title} className="p-4 rounded-xl bg-card border border-border">
                      <p className="font-semibold text-foreground">{right.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">{right.desc}</p>
                    </div>
                  ))}
                </div>

                <p className="text-muted-foreground leading-relaxed">
                  To exercise any of these rights, visit your Account Settings or contact our support team.
                </p>
              </section>

              {/* Section 7 - Questions */}
              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground pt-4 border-t border-border">
                  Questions?
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  We believe in transparency. If you have questions about our privacy practices that
                  aren&apos;t answered here or in our full Privacy Policy, please reach out.
                  We&apos;re happy to explain how we handle any aspect of your data.
                </p>
              </section>

              {/* CTA Box */}
              <div className="p-6 rounded-xl bg-primary/10 border border-primary/20">
                <h3 className="text-lg font-semibold text-foreground mb-2">Read our full Privacy Policy</h3>
                <p className="text-muted-foreground mb-4">
                  For complete details on how we handle your data, including legal terms and definitions.
                </p>
                <Link
                  href="/privacy"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-hover transition-colors"
                >
                  View Privacy Policy
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
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
                  href="/blog/custom-filters"
                  className="group p-4 rounded-xl border border-border hover:border-primary/30 transition-colors"
                >
                  <span className="text-sm text-primary">Product Updates</span>
                  <h4 className="mt-2 font-semibold text-foreground group-hover:text-primary transition-colors">
                    New Feature: Custom Word Filters
                  </h4>
                </Link>
                <Link
                  href="/blog/screen-time-tips"
                  className="group p-4 rounded-xl border border-border hover:border-primary/30 transition-colors"
                >
                  <span className="text-sm text-primary">Family Tips</span>
                  <h4 className="mt-2 font-semibold text-foreground group-hover:text-primary transition-colors">
                    5 Tips for Managing Screen Time with Kids
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

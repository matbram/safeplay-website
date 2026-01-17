import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock, User, Shield, Lock, Eye, Server } from "lucide-react";

export const metadata = {
  title: "How SafePlay Protects Your Privacy - SafePlay Blog",
  description: "An inside look at how we handle your data and why privacy is central to our mission.",
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
              <span className="text-primary font-medium">Company</span>
              <h1 className="mt-4 text-3xl lg:text-4xl font-bold text-foreground">
                How SafePlay Protects Your Privacy
              </h1>
              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  SafePlay Team
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  December 20, 2025
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  4 min read
                </span>
              </div>
            </header>

            {/* Featured Image Placeholder */}
            <div className="aspect-video rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 mb-12 flex items-center justify-center">
              <Shield className="w-24 h-24 text-primary/30" />
            </div>

            {/* Content */}
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <p className="lead text-xl text-muted-foreground">
                When you use SafePlay, you&apos;re trusting us with information about what you watch.
                We take that trust seriously. Here&apos;s an inside look at how we protect your privacy.
              </p>

              <h2>Our Privacy Philosophy</h2>
              <p>
                Our approach to privacy is simple: collect only what we need, protect everything we
                have, and never sell your data. We&apos;re in the business of filtering content, not
                monetizing your viewing habits.
              </p>

              {/* Privacy Principles Cards */}
              <div className="not-prose my-12 grid sm:grid-cols-2 gap-4">
                <div className="p-6 rounded-2xl bg-card border border-border">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <Eye className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">Minimal Collection</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    We only collect what&apos;s essential to provide the service.
                  </p>
                </div>
                <div className="p-6 rounded-2xl bg-card border border-border">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <Lock className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">Strong Encryption</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    All data is encrypted in transit and at rest.
                  </p>
                </div>
                <div className="p-6 rounded-2xl bg-card border border-border">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <Server className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">No Data Selling</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    We never sell your data to advertisers or third parties.
                  </p>
                </div>
                <div className="p-6 rounded-2xl bg-card border border-border">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">Your Control</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    You can delete your data anytime you choose.
                  </p>
                </div>
              </div>

              <h2>What We Collect (And Why)</h2>

              <h3>Account Information</h3>
              <p>
                When you sign up, we collect your email address and name. That&apos;s it. We use this to:
              </p>
              <ul>
                <li>Let you log in to your account</li>
                <li>Send important service updates</li>
                <li>Respond to support requests</li>
              </ul>

              <h3>Payment Information</h3>
              <p>
                If you subscribe to a paid plan, we use Stripe to process payments. We never see or
                store your full credit card number — that&apos;s handled entirely by Stripe, which is
                certified to the highest security standards (PCI-DSS Level 1).
              </p>

              <h3>Filtering Activity</h3>
              <p>
                When you filter a video, we record which video was filtered and when. This allows us to:
              </p>
              <ul>
                <li>Let you re-watch filtered videos without using more credits</li>
                <li>Show your filtering history in your dashboard</li>
                <li>Provide usage statistics and credit tracking</li>
              </ul>
              <p>
                <strong>Important:</strong> We don&apos;t track what you watch — only what you actively
                choose to filter through SafePlay. Regular YouTube viewing isn&apos;t tracked by us at all.
              </p>

              <h2>What We Don&apos;t Do</h2>
              <ul>
                <li>
                  <strong>We don&apos;t sell data to advertisers.</strong> Our business model is
                  subscriptions, not advertising.
                </li>
                <li>
                  <strong>We don&apos;t build profiles for targeting.</strong> We don&apos;t analyze your
                  viewing patterns to serve you ads or recommendations.
                </li>
                <li>
                  <strong>We don&apos;t store video content.</strong> We process audio to identify
                  profanity, but we don&apos;t store the videos themselves.
                </li>
                <li>
                  <strong>We don&apos;t share with third parties</strong> for marketing purposes. Your
                  data stays with us (and the service providers necessary to operate, like our hosting
                  provider and payment processor).
                </li>
              </ul>

              <h2>Family Privacy</h2>
              <p>
                Family accounts have additional privacy considerations. Here&apos;s how we handle them:
              </p>
              <ul>
                <li>
                  <strong>Parental visibility:</strong> Parents on the account can see children&apos;s
                  viewing history. This is by design for parental oversight.
                </li>
                <li>
                  <strong>Profile separation:</strong> Siblings can&apos;t see each other&apos;s history —
                  only parents have cross-profile visibility.
                </li>
                <li>
                  <strong>Children&apos;s privacy:</strong> We comply with COPPA (Children&apos;s Online
                  Privacy Protection Act) and don&apos;t collect personal information from children
                  beyond what&apos;s necessary for the service.
                </li>
              </ul>

              <h2>Security Measures</h2>
              <p>
                We implement industry-standard security practices:
              </p>
              <ul>
                <li>All connections use HTTPS/TLS encryption</li>
                <li>Data at rest is encrypted using AES-256</li>
                <li>Regular security audits and penetration testing</li>
                <li>Limited employee access to user data</li>
                <li>Two-factor authentication available for all accounts</li>
              </ul>

              <h2>Your Rights</h2>
              <p>
                You have control over your data:
              </p>
              <ul>
                <li>
                  <strong>Access:</strong> Download a copy of all data we have about you
                </li>
                <li>
                  <strong>Correction:</strong> Update your information anytime
                </li>
                <li>
                  <strong>Deletion:</strong> Delete your account and all associated data
                </li>
                <li>
                  <strong>Portability:</strong> Export your data in a standard format
                </li>
              </ul>
              <p>
                To exercise any of these rights, visit your Account Settings or contact our support team.
              </p>

              <h2>Questions?</h2>
              <p>
                We believe in transparency. If you have questions about our privacy practices that
                aren&apos;t answered here or in our full <Link href="/privacy">Privacy Policy</Link>,
                please reach out. We&apos;re happy to explain how we handle any aspect of your data.
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
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}

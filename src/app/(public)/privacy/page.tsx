import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Shield } from "lucide-react";

export const metadata = {
  title: "Privacy Policy - SafePlay",
  description: "Learn how SafePlay collects, uses, and protects your personal information.",
};

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="pt-16">
        <section className="py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <Shield className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">Legal</span>
              </div>
              <h1 className="heading-display text-foreground">Privacy Policy</h1>
              <p className="mt-4 text-muted-foreground">Last updated: January 15, 2026</p>
            </div>

            <div className="prose prose-slate dark:prose-invert max-w-none">
              <h2>1. Introduction</h2>
              <p>
                SafePlay (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy.
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information
                when you use our website, Chrome extension, and services.
              </p>

              <h2>2. Information We Collect</h2>
              <h3>Information You Provide</h3>
              <ul>
                <li>Account information (email address, name, password)</li>
                <li>Payment information (processed securely through Stripe)</li>
                <li>Profile preferences and settings</li>
                <li>Communication with our support team</li>
              </ul>

              <h3>Information Collected Automatically</h3>
              <ul>
                <li>Usage data (videos filtered, credits used, features accessed)</li>
                <li>Device information (browser type, operating system)</li>
                <li>Log data (IP address, access times, pages viewed)</li>
              </ul>

              <h2>3. How We Use Your Information</h2>
              <p>We use the information we collect to:</p>
              <ul>
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and manage your account</li>
                <li>Send you updates, security alerts, and support messages</li>
                <li>Analyze usage patterns to improve user experience</li>
                <li>Detect and prevent fraud or abuse</li>
              </ul>

              <h2>4. Video Content and Privacy</h2>
              <p>
                SafePlay processes YouTube videos to identify and filter profanity. We want you to know:
              </p>
              <ul>
                <li>We do not store the content of videos you watch</li>
                <li>Filter results are cached to improve performance and reduce processing time</li>
                <li>Your viewing history is private and only visible to you (or parents in family accounts)</li>
                <li>We never share your viewing activity with third parties for advertising purposes</li>
              </ul>

              <h2>5. Data Sharing</h2>
              <p>We do not sell your personal information. We may share information with:</p>
              <ul>
                <li>Service providers who help us operate our business (payment processing, hosting)</li>
                <li>Legal authorities when required by law or to protect our rights</li>
                <li>Business partners in the event of a merger, acquisition, or sale of assets</li>
              </ul>

              <h2>6. Data Security</h2>
              <p>
                We implement industry-standard security measures to protect your data, including:
              </p>
              <ul>
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security audits and vulnerability testing</li>
                <li>Access controls and authentication measures</li>
                <li>Secure payment processing through PCI-compliant providers</li>
              </ul>

              <h2>7. Your Rights</h2>
              <p>You have the right to:</p>
              <ul>
                <li>Access and download your personal data</li>
                <li>Correct inaccurate information</li>
                <li>Delete your account and associated data</li>
                <li>Opt out of marketing communications</li>
                <li>Request data portability</li>
              </ul>

              <h2>8. Children&apos;s Privacy</h2>
              <p>
                SafePlay is designed to help families protect children from inappropriate content.
                We do not knowingly collect personal information from children under 13 without
                parental consent. Family accounts allow parents to manage children&apos;s profiles.
              </p>

              <h2>9. Cookies and Tracking</h2>
              <p>
                We use cookies and similar technologies to enhance your experience.
                See our <a href="/cookies" className="text-primary hover:underline">Cookie Policy</a> for details.
              </p>

              <h2>10. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any
                material changes by posting the new policy on this page and updating the
                &quot;Last updated&quot; date.
              </p>

              <h2>11. Contact Us</h2>
              <p>
                If you have questions about this Privacy Policy, please contact us at:
              </p>
              <ul>
                <li>Email: privacy@safeplay.app</li>
                <li>Address: SafePlay Inc., 123 Main Street, San Francisco, CA 94102</li>
              </ul>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

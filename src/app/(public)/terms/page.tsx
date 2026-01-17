import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { FileText } from "lucide-react";

export const metadata = {
  title: "Terms of Service - SafePlay",
  description: "Read the terms and conditions for using SafePlay's YouTube profanity filter service.",
};

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="pt-16">
        <section className="py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <FileText className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">Legal</span>
              </div>
              <h1 className="heading-display text-foreground">Terms of Service</h1>
              <p className="mt-4 text-muted-foreground">Last updated: January 15, 2026</p>
            </div>

            <div className="prose prose-slate dark:prose-invert max-w-none">
              <h2>1. Acceptance of Terms</h2>
              <p>
                By accessing or using SafePlay&apos;s website, Chrome extension, and services
                (collectively, the &quot;Service&quot;), you agree to be bound by these Terms of Service.
                If you do not agree to these terms, please do not use the Service.
              </p>

              <h2>2. Description of Service</h2>
              <p>
                SafePlay provides a profanity filtering service for YouTube videos. Our Service
                detects and mutes or bleeps profanity in real-time, allowing users to enjoy
                content without inappropriate language.
              </p>

              <h2>3. Account Registration</h2>
              <p>To use certain features, you must create an account. You agree to:</p>
              <ul>
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>Accept responsibility for all activities under your account</li>
              </ul>

              <h2>4. Credits and Billing</h2>
              <h3>Credit System</h3>
              <ul>
                <li>One credit equals one minute of video filtering</li>
                <li>Credits are deducted when you filter a new video</li>
                <li>Previously filtered videos can be re-watched without additional credits</li>
                <li>Unused credits expire at the end of each billing cycle</li>
              </ul>

              <h3>Payments</h3>
              <ul>
                <li>Paid subscriptions are billed monthly or annually</li>
                <li>Payments are processed securely through Stripe</li>
                <li>You may cancel your subscription at any time</li>
                <li>Refunds are provided in accordance with our refund policy</li>
              </ul>

              <h2>5. Acceptable Use</h2>
              <p>You agree not to:</p>
              <ul>
                <li>Use the Service for any illegal purpose</li>
                <li>Attempt to circumvent our credit system or billing</li>
                <li>Reverse engineer or attempt to extract source code</li>
                <li>Interfere with or disrupt the Service</li>
                <li>Use automated systems to access the Service without permission</li>
                <li>Resell or redistribute the Service without authorization</li>
              </ul>

              <h2>6. Intellectual Property</h2>
              <p>
                The Service, including its content, features, and functionality, is owned by
                SafePlay and protected by copyright, trademark, and other intellectual property laws.
              </p>

              <h2>7. Third-Party Content</h2>
              <p>
                SafePlay filters content from YouTube but does not host or control that content.
                We are not responsible for the content of videos you choose to watch. YouTube&apos;s
                terms of service and content policies apply to all YouTube content.
              </p>

              <h2>8. Disclaimer of Warranties</h2>
              <p>
                The Service is provided &quot;as is&quot; without warranties of any kind. While we strive
                for high accuracy, we cannot guarantee that all profanity will be detected or
                that no false positives will occur.
              </p>

              <h2>9. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, SafePlay shall not be liable for any
                indirect, incidental, special, consequential, or punitive damages arising from
                your use of the Service.
              </p>

              <h2>10. Indemnification</h2>
              <p>
                You agree to indemnify and hold harmless SafePlay and its officers, directors,
                employees, and agents from any claims arising from your use of the Service or
                violation of these Terms.
              </p>

              <h2>11. Modifications to Service</h2>
              <p>
                We reserve the right to modify, suspend, or discontinue the Service at any time.
                We will provide reasonable notice of any material changes.
              </p>

              <h2>12. Termination</h2>
              <p>
                We may terminate or suspend your account at our discretion if you violate these
                Terms. You may cancel your account at any time through your account settings.
              </p>

              <h2>13. Governing Law</h2>
              <p>
                These Terms shall be governed by the laws of the State of California, without
                regard to its conflict of law provisions.
              </p>

              <h2>14. Dispute Resolution</h2>
              <p>
                Any disputes arising from these Terms will be resolved through binding arbitration
                in accordance with the rules of the American Arbitration Association.
              </p>

              <h2>15. Contact Information</h2>
              <p>
                For questions about these Terms, please contact us at:
              </p>
              <ul>
                <li>Email: legal@safeplay.app</li>
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

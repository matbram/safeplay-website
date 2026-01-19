import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Cookie } from "lucide-react";

export const metadata = {
  title: "Cookie Policy - SafePlay",
  description: "Learn about how SafePlay uses cookies and similar technologies.",
};

export default function CookiesPage() {
  return (
    <>
      <Header />
      <main className="pt-16">
        <section className="py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <Cookie className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">Legal</span>
              </div>
              <h1 className="heading-display text-foreground">Cookie Policy</h1>
              <p className="mt-4 text-muted-foreground">Last updated: January 15, 2026</p>
            </div>

            <div className="prose prose-slate dark:prose-invert max-w-none">
              <h2>1. What Are Cookies?</h2>
              <p>
                Cookies are small text files that are placed on your device when you visit a website.
                They are widely used to make websites work more efficiently and provide information
                to the site owners.
              </p>

              <h2>2. How We Use Cookies</h2>
              <p>SafePlay uses cookies for the following purposes:</p>

              <h3>Essential Cookies</h3>
              <p>
                These cookies are necessary for the website to function and cannot be switched off.
                They are usually set in response to actions you take, such as logging in or
                filling out forms.
              </p>
              <table className="w-full">
                <thead>
                  <tr>
                    <th>Cookie Name</th>
                    <th>Purpose</th>
                    <th>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>session_id</td>
                    <td>Maintains your logged-in session</td>
                    <td>Session</td>
                  </tr>
                  <tr>
                    <td>csrf_token</td>
                    <td>Protects against cross-site request forgery</td>
                    <td>Session</td>
                  </tr>
                </tbody>
              </table>

              <h3>Functional Cookies</h3>
              <p>
                These cookies enable enhanced functionality and personalization, such as
                remembering your preferences and settings.
              </p>
              <table className="w-full">
                <thead>
                  <tr>
                    <th>Cookie Name</th>
                    <th>Purpose</th>
                    <th>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>preferences</td>
                    <td>Stores your filter preferences (mute/bleep)</td>
                    <td>1 year</td>
                  </tr>
                  <tr>
                    <td>theme</td>
                    <td>Remembers your dark/light mode preference</td>
                    <td>1 year</td>
                  </tr>
                </tbody>
              </table>

              <h3>Analytics Cookies</h3>
              <p>
                These cookies help us understand how visitors interact with our website by
                collecting and reporting information anonymously.
              </p>
              <table className="w-full">
                <thead>
                  <tr>
                    <th>Cookie Name</th>
                    <th>Purpose</th>
                    <th>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>_ga</td>
                    <td>Google Analytics - distinguishes users</td>
                    <td>2 years</td>
                  </tr>
                  <tr>
                    <td>_gid</td>
                    <td>Google Analytics - distinguishes users</td>
                    <td>24 hours</td>
                  </tr>
                </tbody>
              </table>

              <h2>3. Chrome Extension Cookies</h2>
              <p>
                Our Chrome extension uses local storage (similar to cookies) to:
              </p>
              <ul>
                <li>Store your authentication token</li>
                <li>Cache filter preferences</li>
                <li>Remember extension settings</li>
              </ul>
              <p>
                This data is stored locally on your device and is not sent to third parties.
              </p>

              <h2>4. Third-Party Cookies</h2>
              <p>
                We use services from third parties that may set their own cookies:
              </p>
              <ul>
                <li><strong>Stripe:</strong> Payment processing and fraud prevention</li>
                <li><strong>Google Analytics:</strong> Website analytics (can be disabled)</li>
              </ul>

              <h2>5. Managing Cookies</h2>
              <p>
                You can control and manage cookies in several ways:
              </p>
              <ul>
                <li>
                  <strong>Browser settings:</strong> Most browsers allow you to refuse or
                  delete cookies through their settings.
                </li>
                <li>
                  <strong>Our cookie banner:</strong> When you first visit our site, you can
                  choose which non-essential cookies to accept.
                </li>
                <li>
                  <strong>Opt-out links:</strong> You can opt out of Google Analytics by
                  installing the Google Analytics opt-out browser add-on.
                </li>
              </ul>

              <h2>6. Impact of Disabling Cookies</h2>
              <p>
                If you disable cookies, some features of our Service may not function properly:
              </p>
              <ul>
                <li>You may need to log in every time you visit</li>
                <li>Your preferences may not be remembered</li>
                <li>Some features may be unavailable</li>
              </ul>

              <h2>7. Updates to This Policy</h2>
              <p>
                We may update this Cookie Policy from time to time. Any changes will be posted
                on this page with an updated revision date.
              </p>

              <h2>8. Contact Us</h2>
              <p>
                If you have questions about our use of cookies, please contact us at:
              </p>
              <ul>
                <li>Email: privacy@safeplay.app</li>
              </ul>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

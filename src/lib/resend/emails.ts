/**
 * Email templates for SafePlay
 */

const baseStyles = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
  .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
  .card { background: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); }
  .logo { font-size: 28px; font-weight: 700; color: #6366f1; margin-bottom: 24px; }
  .logo span { color: #333; }
  h1 { font-size: 24px; font-weight: 600; color: #111; margin: 0 0 16px 0; }
  p { margin: 0 0 16px 0; color: #555; }
  .button { display: inline-block; background: #6366f1; color: #ffffff !important; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 8px 0; }
  .button:hover { background: #5558e3; }
  .footer { margin-top: 32px; padding-top: 24px; border-top: 1px solid #eee; font-size: 13px; color: #888; }
  .footer a { color: #6366f1; text-decoration: none; }
`;

function wrapEmail(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">Safe<span>Play</span></div>
      ${content}
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} SafePlay. All rights reserved.</p>
        <p><a href="https://trysafeplay.com">trysafeplay.com</a></p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Welcome email sent when someone joins the waitlist
 */
export function welcomeEmail(): { subject: string; html: string; text: string } {
  const subject = "You're on the SafePlay waitlist!";

  const html = wrapEmail(`
    <h1>Welcome to SafePlay!</h1>
    <p>Thanks for joining our waitlist. We're building something special for families who want to keep their kids safe online without compromising on fun.</p>
    <p>SafePlay uses AI to filter inappropriate content from podcasts, audiobooks, and more in real-time. Your kids get to enjoy their favorite content, and you get peace of mind.</p>
    <p><strong>What happens next?</strong></p>
    <ul style="color: #555; padding-left: 20px;">
      <li>We'll notify you as soon as SafePlay launches</li>
      <li>Early supporters like you will get exclusive early access</li>
      <li>Stay tuned for sneak peeks and updates</li>
    </ul>
    <p>Have questions? Just reply to this email - we'd love to hear from you.</p>
    <p style="margin-top: 24px;">— The SafePlay Team</p>
  `);

  const text = `
Welcome to SafePlay!

Thanks for joining our waitlist. We're building something special for families who want to keep their kids safe online without compromising on fun.

SafePlay uses AI to filter inappropriate content from podcasts, audiobooks, and more in real-time. Your kids get to enjoy their favorite content, and you get peace of mind.

What happens next?
- We'll notify you as soon as SafePlay launches
- Early supporters like you will get exclusive early access
- Stay tuned for sneak peeks and updates

Have questions? Just reply to this email - we'd love to hear from you.

— The SafePlay Team

© ${new Date().getFullYear()} SafePlay. All rights reserved.
https://trysafeplay.com
  `.trim();

  return { subject, html, text };
}

/**
 * Launch notification email
 */
export function launchEmail(ctaUrl: string = "https://trysafeplay.com"): { subject: string; html: string; text: string } {
  const subject = "SafePlay is LIVE! Your early access is ready";

  const html = wrapEmail(`
    <h1>The wait is over - SafePlay is live!</h1>
    <p>You signed up to be notified when SafePlay launches, and that day is finally here!</p>
    <p>As an early supporter, you're getting <strong>first access</strong> to SafePlay. Here's what you can do right now:</p>
    <ul style="color: #555; padding-left: 20px;">
      <li>Create your free account</li>
      <li>Set up profiles for your family</li>
      <li>Start filtering content immediately</li>
    </ul>
    <p style="text-align: center; margin: 32px 0;">
      <a href="${ctaUrl}" class="button">Get Started Free</a>
    </p>
    <p>Thank you for believing in us from the beginning. We built SafePlay for families like yours, and we can't wait to hear what you think.</p>
    <p style="margin-top: 24px;">— The SafePlay Team</p>
  `);

  const text = `
The wait is over - SafePlay is live!

You signed up to be notified when SafePlay launches, and that day is finally here!

As an early supporter, you're getting first access to SafePlay. Here's what you can do right now:
- Create your free account
- Set up profiles for your family
- Start filtering content immediately

Get started: ${ctaUrl}

Thank you for believing in us from the beginning. We built SafePlay for families like yours, and we can't wait to hear what you think.

— The SafePlay Team

© ${new Date().getFullYear()} SafePlay. All rights reserved.
https://trysafeplay.com
  `.trim();

  return { subject, html, text };
}

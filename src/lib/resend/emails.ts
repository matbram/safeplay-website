/**
 * Email templates for SafePlay
 * Design: YouTube-inspired dark theme with red accents
 */

// Brand colors
const colors = {
  primary: "#FF0000",
  primaryDark: "#CC0000",
  background: "#0F0F0F",
  card: "#181818",
  cardBorder: "#272727",
  text: "#F1F1F1",
  textMuted: "#AAAAAA",
  success: "#2BA640",
};

// Shield SVG icon (base64 encoded for email compatibility)
const shieldIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>`;

// Check icon for lists
const checkIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${colors.success}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

function wrapEmail(content: string, preheader: string = ""): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>SafePlay</title>
  <!--[if mso]>
  <style type="text/css">
    table { border-collapse: collapse; }
    .button { padding: 16px 32px !important; }
  </style>
  <![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;600;700&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    @media only screen and (max-width: 600px) {
      .container { padding: 16px !important; }
      .card { padding: 32px 24px !important; }
      .heading { font-size: 26px !important; }
      .button { padding: 14px 28px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${colors.background};">
  <!-- Preheader text (hidden) -->
  <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">
    ${preheader}
    ${"&nbsp;&zwnj;".repeat(30)}
  </div>

  <!-- Email wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: ${colors.background};">
    <tr>
      <td align="center" class="container" style="padding: 40px 20px;">
        <!-- Main card -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px;">
          <tr>
            <td class="card" style="background-color: ${colors.card}; border-radius: 16px; padding: 48px 40px; border: 1px solid ${colors.cardBorder};">

              <!-- Logo -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom: 32px;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background-color: ${colors.primary}; border-radius: 10px; padding: 10px; line-height: 0;">
                          ${shieldIcon}
                        </td>
                        <td style="padding-left: 12px;">
                          <span style="font-size: 24px; font-weight: 700; color: ${colors.text}; letter-spacing: -0.5px;">SafePlay</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Content -->
              ${content}

              <!-- Footer -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-top: 40px; border-top: 1px solid ${colors.cardBorder};">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding-bottom: 16px;">
                          <a href="https://trysafeplay.com" style="color: ${colors.textMuted}; text-decoration: none; font-size: 14px;">trysafeplay.com</a>
                        </td>
                      </tr>
                      <tr>
                        <td align="center">
                          <p style="color: ${colors.textMuted}; font-size: 12px; margin: 0;">
                            &copy; ${new Date().getFullYear()} SafePlay. All rights reserved.
                          </p>
                          <p style="color: ${colors.textMuted}; font-size: 12px; margin: 8px 0 0 0;">
                            Making YouTube safe for everyone.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function featureItem(text: string): string {
  return `
    <tr>
      <td style="padding: 8px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td style="vertical-align: top; padding-right: 12px; padding-top: 2px;">
              <div style="width: 20px; height: 20px; background-color: rgba(43, 166, 64, 0.15); border-radius: 50%; display: inline-block; text-align: center; line-height: 20px;">
                ${checkIcon}
              </div>
            </td>
            <td style="color: ${colors.textMuted}; font-size: 15px;">
              ${text}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

/**
 * Welcome email sent when someone joins the waitlist
 */
export function welcomeEmail(): { subject: string; html: string; text: string } {
  const subject = "You're on the SafePlay waitlist! 🎉";
  const preheader = "Thanks for joining - we'll notify you when SafePlay launches.";

  const html = wrapEmail(`
    <!-- Heading -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding-bottom: 24px;">
          <h1 class="heading" style="color: ${colors.text}; font-size: 28px; font-weight: 700; margin: 0; letter-spacing: -0.5px;">
            Welcome to SafePlay!
          </h1>
        </td>
      </tr>
    </table>

    <!-- Intro text -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding-bottom: 24px;">
          <p style="color: ${colors.textMuted}; font-size: 16px; margin: 0; text-align: center;">
            Thanks for joining our waitlist! We're building the ultimate profanity filter for YouTube - and you'll be among the first to try it.
          </p>
        </td>
      </tr>
    </table>

    <!-- Feature box -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="background-color: ${colors.background}; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <p style="color: ${colors.text}; font-size: 15px; font-weight: 600; margin: 0 0 16px 0;">
            What you'll get with SafePlay:
          </p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${featureItem("Real-time profanity filtering on any YouTube video")}
            ${featureItem("Chrome extension that works instantly")}
            ${featureItem("99.5% detection accuracy")}
            ${featureItem("Perfect for families, classrooms, and workplaces")}
          </table>
        </td>
      </tr>
    </table>

    <!-- What's next -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding: 24px 0;">
          <p style="color: ${colors.text}; font-size: 15px; font-weight: 600; margin: 0 0 12px 0;">
            What happens next?
          </p>
          <p style="color: ${colors.textMuted}; font-size: 15px; margin: 0;">
            We'll send you an email the moment SafePlay is ready. As an early supporter, you'll get exclusive first access before anyone else.
          </p>
        </td>
      </tr>
    </table>

    <!-- CTA -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding: 8px 0 24px 0;">
          <a href="https://trysafeplay.com#demo" class="button" style="display: inline-block; background-color: ${colors.primary}; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 14px 32px; border-radius: 8px;">
            Watch the Demo
          </a>
        </td>
      </tr>
    </table>

    <!-- Sign off -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td>
          <p style="color: ${colors.textMuted}; font-size: 15px; margin: 0;">
            Have questions? Just reply to this email - we'd love to hear from you.
          </p>
          <p style="color: ${colors.text}; font-size: 15px; margin: 24px 0 0 0; font-weight: 500;">
            — The SafePlay Team
          </p>
        </td>
      </tr>
    </table>
  `, preheader);

  const text = `
Welcome to SafePlay!

Thanks for joining our waitlist! We're building the ultimate profanity filter for YouTube - and you'll be among the first to try it.

What you'll get with SafePlay:
✓ Real-time profanity filtering on any YouTube video
✓ Chrome extension that works instantly
✓ 99.5% detection accuracy
✓ Perfect for families, classrooms, and workplaces

What happens next?
We'll send you an email the moment SafePlay is ready. As an early supporter, you'll get exclusive first access before anyone else.

Watch the demo: https://trysafeplay.com#demo

Have questions? Just reply to this email - we'd love to hear from you.

— The SafePlay Team

---
© ${new Date().getFullYear()} SafePlay. All rights reserved.
Making YouTube safe for everyone.
https://trysafeplay.com
  `.trim();

  return { subject, html, text };
}

/**
 * Launch notification email
 */
export function launchEmail(ctaUrl: string = "https://trysafeplay.com"): { subject: string; html: string; text: string } {
  const subject = "SafePlay is LIVE! 🚀 Your early access is ready";
  const preheader = "The wait is over - start filtering YouTube videos today.";

  const html = wrapEmail(`
    <!-- Celebration badge -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding-bottom: 24px;">
          <span style="display: inline-block; background-color: rgba(43, 166, 64, 0.15); color: ${colors.success}; font-size: 13px; font-weight: 600; padding: 8px 16px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px;">
            🎉 Now Live
          </span>
        </td>
      </tr>
    </table>

    <!-- Heading -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding-bottom: 24px;">
          <h1 class="heading" style="color: ${colors.text}; font-size: 28px; font-weight: 700; margin: 0; letter-spacing: -0.5px;">
            The wait is over!
          </h1>
        </td>
      </tr>
    </table>

    <!-- Intro text -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding-bottom: 24px;">
          <p style="color: ${colors.textMuted}; font-size: 16px; margin: 0; text-align: center;">
            SafePlay is officially live, and as an early supporter, you're getting <strong style="color: ${colors.text};">first access</strong>.
          </p>
        </td>
      </tr>
    </table>

    <!-- What you can do box -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="background-color: ${colors.background}; border-radius: 12px; padding: 24px;">
          <p style="color: ${colors.text}; font-size: 15px; font-weight: 600; margin: 0 0 16px 0;">
            Here's what you can do right now:
          </p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${featureItem("Install the Chrome extension in seconds")}
            ${featureItem("Start watching YouTube without profanity")}
            ${featureItem("Customize your filtering preferences")}
            ${featureItem("Enjoy family-friendly content instantly")}
          </table>
        </td>
      </tr>
    </table>

    <!-- CTA Button -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding: 32px 0;">
          <a href="${ctaUrl}" class="button" style="display: inline-block; background-color: ${colors.primary}; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 16px 40px; border-radius: 8px;">
            Get Started Free →
          </a>
        </td>
      </tr>
    </table>

    <!-- Thank you -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td>
          <p style="color: ${colors.textMuted}; font-size: 15px; margin: 0 0 24px 0;">
            Thank you for believing in us from the beginning. We built SafePlay for families like yours, and we can't wait to hear what you think.
          </p>
          <p style="color: ${colors.text}; font-size: 15px; margin: 0; font-weight: 500;">
            — The SafePlay Team
          </p>
        </td>
      </tr>
    </table>
  `, preheader);

  const text = `
🎉 SafePlay is LIVE!

The wait is over - SafePlay is officially live, and as an early supporter, you're getting first access.

Here's what you can do right now:
✓ Install the Chrome extension in seconds
✓ Start watching YouTube without profanity
✓ Customize your filtering preferences
✓ Enjoy family-friendly content instantly

Get started: ${ctaUrl}

Thank you for believing in us from the beginning. We built SafePlay for families like yours, and we can't wait to hear what you think.

— The SafePlay Team

---
© ${new Date().getFullYear()} SafePlay. All rights reserved.
Making YouTube safe for everyone.
https://trysafeplay.com
  `.trim();

  return { subject, html, text };
}

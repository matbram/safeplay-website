/**
 * Email templates for SafePlay
 * Design: Clean, personal, transactional style for better deliverability
 */

// Brand colors
const colors = {
  primary: "#FF0000",
  background: "#0F0F0F",
  card: "#181818",
  cardBorder: "#272727",
  text: "#F1F1F1",
  textMuted: "#AAAAAA",
};

function wrapEmail(content: string, preheader: string = ""): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <title>SafePlay</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${colors.background}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
  <!-- Preheader -->
  <div style="display: none; max-height: 0; overflow: hidden;">${preheader}</div>

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${colors.background};">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px;">
          <tr>
            <td style="background-color: ${colors.card}; border-radius: 12px; padding: 40px 32px; border: 1px solid ${colors.cardBorder};">

              <!-- Logo -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom: 24px; border-bottom: 1px solid ${colors.cardBorder};">
                    <span style="font-size: 20px; font-weight: 700; color: ${colors.text};">SafePlay</span>
                  </td>
                </tr>
              </table>

              <!-- Content -->
              ${content}

              <!-- Footer -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-top: 32px; border-top: 1px solid ${colors.cardBorder};">
                    <p style="color: ${colors.textMuted}; font-size: 13px; margin: 0; line-height: 1.5;">
                      SafePlay · Making YouTube safe for everyone<br>
                      <a href="https://trysafeplay.com" style="color: ${colors.textMuted};">trysafeplay.com</a>
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
</body>
</html>
  `.trim();
}

/**
 * Welcome email sent when someone joins the waitlist
 * Designed to feel personal and transactional, not promotional
 */
export function welcomeEmail(): { subject: string; html: string; text: string } {
  const subject = "You're on the list";
  const preheader = "Thanks for signing up for SafePlay";

  const html = wrapEmail(`
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding-top: 28px;">
          <p style="color: ${colors.text}; font-size: 15px; margin: 0 0 20px 0; line-height: 1.6;">
            Hey there,
          </p>
          <p style="color: ${colors.text}; font-size: 15px; margin: 0 0 20px 0; line-height: 1.6;">
            Thanks for signing up for SafePlay. You're now on our list and we'll email you when we launch.
          </p>
          <p style="color: ${colors.text}; font-size: 15px; margin: 0 0 20px 0; line-height: 1.6;">
            Quick recap of what we're building: a Chrome extension that automatically mutes profanity in YouTube videos. It works in real-time as you watch, so you can enjoy any video without the language you'd rather skip.
          </p>
          <p style="color: ${colors.text}; font-size: 15px; margin: 0 0 20px 0; line-height: 1.6;">
            We're finishing up a few things and expect to launch soon. As an early supporter, you'll get first access.
          </p>
          <p style="color: ${colors.text}; font-size: 15px; margin: 0 0 20px 0; line-height: 1.6;">
            If you have any questions in the meantime, just reply to this email.
          </p>
          <p style="color: ${colors.text}; font-size: 15px; margin: 0; line-height: 1.6;">
            — The SafePlay Team
          </p>
        </td>
      </tr>
    </table>
  `, preheader);

  const text = `
Hey there,

Thanks for signing up for SafePlay. You're now on our list and we'll email you when we launch.

Quick recap of what we're building: a Chrome extension that automatically mutes profanity in YouTube videos. It works in real-time as you watch, so you can enjoy any video without the language you'd rather skip.

We're finishing up a few things and expect to launch soon. As an early supporter, you'll get first access.

If you have any questions in the meantime, just reply to this email.

— The SafePlay Team

---
SafePlay · Making YouTube safe for everyone
https://trysafeplay.com
  `.trim();

  return { subject, html, text };
}

/**
 * Launch notification email
 * Designed to feel personal and transactional, not promotional
 */
export function launchEmail(ctaUrl: string = "https://trysafeplay.com"): { subject: string; html: string; text: string } {
  const subject = "SafePlay is ready";
  const preheader = "Your early access is here";

  const html = wrapEmail(`
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding-top: 28px;">
          <p style="color: ${colors.text}; font-size: 15px; margin: 0 0 20px 0; line-height: 1.6;">
            Hey,
          </p>
          <p style="color: ${colors.text}; font-size: 15px; margin: 0 0 20px 0; line-height: 1.6;">
            SafePlay is live. You signed up for early access, so here it is.
          </p>
          <p style="color: ${colors.text}; font-size: 15px; margin: 0 0 20px 0; line-height: 1.6;">
            You can get started here: <a href="${ctaUrl}" style="color: ${colors.primary};">${ctaUrl}</a>
          </p>
          <p style="color: ${colors.text}; font-size: 15px; margin: 0 0 20px 0; line-height: 1.6;">
            Install the Chrome extension, and it'll start filtering profanity from YouTube videos automatically. Takes about 30 seconds to set up.
          </p>
          <p style="color: ${colors.text}; font-size: 15px; margin: 0 0 20px 0; line-height: 1.6;">
            Let us know if you run into any issues or have feedback. We read every reply.
          </p>
          <p style="color: ${colors.text}; font-size: 15px; margin: 0; line-height: 1.6;">
            — The SafePlay Team
          </p>
        </td>
      </tr>
    </table>
  `, preheader);

  const text = `
Hey,

SafePlay is live. You signed up for early access, so here it is.

You can get started here: ${ctaUrl}

Install the Chrome extension, and it'll start filtering profanity from YouTube videos automatically. Takes about 30 seconds to set up.

Let us know if you run into any issues or have feedback. We read every reply.

— The SafePlay Team

---
SafePlay · Making YouTube safe for everyone
https://trysafeplay.com
  `.trim();

  return { subject, html, text };
}

/**
 * Contact form submission email sent to support
 * Contains the user's message and contact details
 */
export function contactFormEmail(data: {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
}): { subject: string; html: string; text: string } {
  const subject = `Contact Form: ${data.subject}`;
  const preheader = `New message from ${data.firstName} ${data.lastName}`;

  const html = wrapEmail(`
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding-top: 28px;">
          <p style="color: ${colors.text}; font-size: 15px; margin: 0 0 20px 0; line-height: 1.6;">
            New contact form submission:
          </p>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid ${colors.cardBorder};">
                <span style="color: ${colors.textMuted}; font-size: 13px;">From:</span><br>
                <span style="color: ${colors.text}; font-size: 15px;">${data.firstName} ${data.lastName}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid ${colors.cardBorder};">
                <span style="color: ${colors.textMuted}; font-size: 13px;">Email:</span><br>
                <a href="mailto:${data.email}" style="color: ${colors.primary}; font-size: 15px;">${data.email}</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid ${colors.cardBorder};">
                <span style="color: ${colors.textMuted}; font-size: 13px;">Subject:</span><br>
                <span style="color: ${colors.text}; font-size: 15px;">${data.subject}</span>
              </td>
            </tr>
          </table>

          <p style="color: ${colors.textMuted}; font-size: 13px; margin: 0 0 8px 0;">Message:</p>
          <div style="background-color: ${colors.background}; border-radius: 8px; padding: 16px; border: 1px solid ${colors.cardBorder};">
            <p style="color: ${colors.text}; font-size: 15px; margin: 0; line-height: 1.6; white-space: pre-wrap;">${data.message}</p>
          </div>
        </td>
      </tr>
    </table>
  `, preheader);

  const text = `
New contact form submission

From: ${data.firstName} ${data.lastName}
Email: ${data.email}
Subject: ${data.subject}

Message:
${data.message}

---
SafePlay · Making YouTube safe for everyone
https://trysafeplay.com
  `.trim();

  return { subject, html, text };
}

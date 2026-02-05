import { Resend } from "resend";

// Lazy initialization to avoid build-time errors when env vars aren't set
let _resend: Resend | null = null;

export function getResend(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

export function getFromEmail(): string {
  return process.env.RESEND_FROM_EMAIL || "SafePlay <support@trysafeplay.com>";
}

export function getAudienceId(): string | null {
  return process.env.RESEND_AUDIENCE_ID || null;
}

export type AddContactOptions = {
  email: string;
  firstName?: string;
  lastName?: string;
  unsubscribed?: boolean;
};

/**
 * Add a contact to the Resend audience
 * Returns the contact data if successful, null if audience is not configured
 */
export async function addContactToAudience(options: AddContactOptions) {
  const audienceId = getAudienceId();

  if (!audienceId) {
    console.warn("RESEND_AUDIENCE_ID is not configured, skipping audience contact creation");
    return null;
  }

  const resend = getResend();

  const { data, error } = await resend.contacts.create({
    audienceId,
    email: options.email,
    firstName: options.firstName,
    lastName: options.lastName,
    unsubscribed: options.unsubscribed ?? false,
  });

  if (error) {
    // Don't throw on duplicate contact - it's not an error condition
    if (error.message?.includes("already exists")) {
      console.log(`Contact ${options.email} already exists in audience`);
      return { alreadyExists: true };
    }
    console.error("Failed to add contact to audience:", error);
    throw new Error(`Failed to add contact to audience: ${error.message}`);
  }

  return data;
}

export type SendEmailOptions = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
};

export async function sendEmail(options: SendEmailOptions) {
  const resend = getResend();
  const from = getFromEmail();

  const { data, error } = await resend.emails.send({
    from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
    replyTo: options.replyTo,
    headers: {
      // List-Unsubscribe helps with deliverability - Gmail looks for this
      "List-Unsubscribe": "<mailto:support@trysafeplay.com?subject=Unsubscribe>",
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      // Precedence header signals this is a bulk/transactional email
      "X-Priority": "3",
    },
  });

  if (error) {
    console.error("Failed to send email:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return data;
}

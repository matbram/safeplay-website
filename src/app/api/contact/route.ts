import { sendEmail } from "@/lib/resend/server";
import { contactFormEmail } from "@/lib/resend/emails";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/contact
 * Public endpoint to submit contact form messages
 * Sends an email to support@trysafeplay.com
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, subject, message } = body;

    // Validate required fields
    if (!firstName || typeof firstName !== "string" || firstName.trim() === "") {
      return NextResponse.json(
        { error: "First name is required" },
        { status: 400 }
      );
    }

    if (!lastName || typeof lastName !== "string" || lastName.trim() === "") {
      return NextResponse.json(
        { error: "Last name is required" },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    if (!subject || typeof subject !== "string" || subject.trim() === "") {
      return NextResponse.json(
        { error: "Subject is required" },
        { status: 400 }
      );
    }

    if (!message || typeof message !== "string" || message.trim() === "") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Generate the email content
    const emailContent = contactFormEmail({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      subject: subject.trim(),
      message: message.trim(),
    });

    // Send email to support
    await sendEmail({
      to: "support@trysafeplay.com",
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
      replyTo: email.toLowerCase().trim(),
    });

    return NextResponse.json({
      success: true,
      message: "Your message has been sent. We'll get back to you soon.",
    });
  } catch (error) {
    console.error("Failed to send contact form email:", error);
    return NextResponse.json(
      { error: "Failed to send your message. Please try again." },
      { status: 500 }
    );
  }
}

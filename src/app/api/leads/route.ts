import { createServiceClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/resend/server";
import { welcomeEmail } from "@/lib/resend/emails";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/leads
 * Public endpoint to submit an email for launch notifications
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, source = "landing_page" } = body;

    // Validate email
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

    const supabase = createServiceClient();

    // Get referrer and other metadata
    const referrer = request.headers.get("referer") || null;
    const userAgent = request.headers.get("user-agent") || null;

    // Extract UTM parameters from URL if present
    const url = new URL(request.url);
    const utmParams: Record<string, string> = {};
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].forEach(param => {
      const value = url.searchParams.get(param);
      if (value) utmParams[param] = value;
    });

    // Insert or update the lead
    const { data, error } = await supabase
      .from("email_leads")
      .upsert(
        {
          email: email.toLowerCase().trim(),
          source,
          metadata: {
            referrer,
            user_agent: userAgent,
            ...utmParams,
          },
          subscribed_at: new Date().toISOString(),
        },
        {
          onConflict: "email",
          ignoreDuplicates: false, // Update if exists
        }
      )
      .select()
      .single();

    if (error) {
      // Check if it's a duplicate
      if (error.code === "23505") {
        return NextResponse.json({
          success: true,
          message: "You're already on the list! We'll notify you when we launch.",
          already_subscribed: true,
        });
      }
      throw error;
    }

    // Send welcome email to new subscribers (don't fail the request if email fails)
    try {
      const { subject, html, text } = welcomeEmail();
      await sendEmail({
        to: email.toLowerCase().trim(),
        subject,
        html,
        text,
        replyTo: "support@trysafeplay.com",
      });
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
      // Don't fail the request - the lead was saved successfully
    }

    return NextResponse.json({
      success: true,
      message: "Thanks for signing up! We'll notify you when we launch.",
      already_subscribed: false,
    });
  } catch (error) {
    console.error("Failed to save lead:", error);
    return NextResponse.json(
      { error: "Failed to save your email. Please try again." },
      { status: 500 }
    );
  }
}

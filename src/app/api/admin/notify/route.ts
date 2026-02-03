import { createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, logAdminAction } from "@/lib/admin-auth";
import { sendEmail } from "@/lib/resend/server";
import { launchEmail } from "@/lib/resend/emails";

/**
 * GET /api/admin/notify
 * Get notification stats (admin only)
 */
export async function GET() {
  try {
    const { admin, response } = await requireAdmin();
    if (!admin) return response;

    const supabase = createServiceClient();

    // Get counts
    const { count: totalLeads } = await supabase
      .from("email_leads")
      .select("*", { count: "exact", head: true });

    const { count: notifiedLeads } = await supabase
      .from("email_leads")
      .select("*", { count: "exact", head: true })
      .not("notified_at", "is", null);

    const { count: pendingLeads } = await supabase
      .from("email_leads")
      .select("*", { count: "exact", head: true })
      .is("notified_at", null);

    return NextResponse.json({
      total: totalLeads || 0,
      notified: notifiedLeads || 0,
      pending: pendingLeads || 0,
    });
  } catch (error) {
    console.error("Failed to fetch notification stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/notify
 * Send launch notification emails to leads (admin only)
 *
 * Body options:
 * - all: boolean - Send to all un-notified leads
 * - emails: string[] - Send to specific emails
 * - test: boolean - Just return what would be sent without actually sending
 */
export async function POST(request: NextRequest) {
  try {
    const { admin, response } = await requireAdmin();
    if (!admin) return response;

    const body = await request.json();
    const { all = false, emails = [], test = false } = body;

    if (!all && (!emails || emails.length === 0)) {
      return NextResponse.json(
        { error: "Specify 'all: true' or provide an 'emails' array" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Get leads to notify
    let query = supabase.from("email_leads").select("*");

    if (all) {
      // Get all leads that haven't been notified
      query = query.is("notified_at", null);
    } else {
      // Get specific emails (even if already notified, for re-sending)
      query = query.in("email", emails.map((e: string) => e.toLowerCase().trim()));
    }

    const { data: leads, error: fetchError } = await query;

    if (fetchError) throw fetchError;

    if (!leads || leads.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No leads to notify",
        sent: 0,
        failed: 0,
      });
    }

    // If test mode, just return what would be sent
    if (test) {
      return NextResponse.json({
        test: true,
        wouldSend: leads.length,
        emails: leads.map((l) => l.email),
      });
    }

    // Send emails
    const results = {
      sent: 0,
      failed: 0,
      errors: [] as { email: string; error: string }[],
    };

    const { subject, html, text } = launchEmail("https://trysafeplay.com");

    // Process in batches to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < leads.length; i += batchSize) {
      const batch = leads.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (lead) => {
          try {
            await sendEmail({
              to: lead.email,
              subject,
              html,
              text,
              replyTo: "support@trysafeplay.com",
            });

            // Update notified_at timestamp
            await supabase
              .from("email_leads")
              .update({ notified_at: new Date().toISOString() })
              .eq("id", lead.id);

            results.sent++;
          } catch (error) {
            results.failed++;
            results.errors.push({
              email: lead.email,
              error: error instanceof Error ? error.message : "Unknown error",
            });
          }
        })
      );

      // Small delay between batches to respect rate limits
      if (i + batchSize < leads.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // Log the action
    await logAdminAction(
      admin.id,
      "send_launch_notification",
      "email_leads",
      "batch",
      {
        total_leads: leads.length,
        sent: results.sent,
        failed: results.failed,
        all_mode: all,
      },
      request
    );

    return NextResponse.json({
      success: true,
      message: `Sent ${results.sent} notification emails`,
      ...results,
    });
  } catch (error) {
    console.error("Failed to send notifications:", error);
    return NextResponse.json(
      { error: "Failed to send notifications" },
      { status: 500 }
    );
  }
}

import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  try {
    const { admin, response } = await requireAdmin();
    if (!admin) return response;

    const supabase = createServiceClient();

    // Check all tables the admin system might use
    const tablesToCheck = [
      "profiles",
      "subscriptions",
      "credit_balances",
      "credit_transactions",
      "support_tickets",
      "ticket_messages",
      "invoices",
      "plans",
      "admin_roles",
      "admin_audit_log",
      "admin_notes",
      "account_flags",
      "filter_history",
      "videos",
    ];

    const results: Record<string, { exists: boolean; columns: string[]; sampleRow: unknown; error: string | null }> = {};

    for (const table of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select("*")
          .limit(1)
          .maybeSingle();

        if (error && error.code === "42P01") {
          // Table doesn't exist
          results[table] = { exists: false, columns: [], sampleRow: null, error: "Table does not exist" };
        } else if (error) {
          results[table] = { exists: true, columns: [], sampleRow: null, error: error.message };
        } else {
          results[table] = {
            exists: true,
            columns: data ? Object.keys(data) : [],
            sampleRow: data,
            error: null,
          };
        }
      } catch (e) {
        results[table] = { exists: false, columns: [], sampleRow: null, error: String(e) };
      }
    }

    return NextResponse.json({
      schema: results,
      summary: {
        existingTables: Object.entries(results).filter(([, v]) => v.exists).map(([k]) => k),
        missingTables: Object.entries(results).filter(([, v]) => !v.exists).map(([k]) => k),
      },
    });
  } catch (error) {
    console.error("Schema debug error:", error);
    return NextResponse.json(
      { error: "Failed to check schema" },
      { status: 500 }
    );
  }
}

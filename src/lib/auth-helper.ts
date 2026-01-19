import { createClient } from "@/lib/supabase/server";
import { createClient as createBrowserClient, SupabaseClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";

export interface AuthResult {
  user: {
    id: string;
    email?: string;
  } | null;
  error: string | null;
  supabase: SupabaseClient | null;
}

/**
 * Authenticate a request from either:
 * 1. Supabase session cookies (website)
 * 2. Bearer token in Authorization header (Chrome extension)
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  // Check for Bearer token first (extension auth)
  const authHeader = request.headers.get("Authorization");

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    return authenticateWithToken(token);
  }

  // Fall back to session-based auth (website)
  return authenticateWithSession();
}

/**
 * Authenticate using a Supabase JWT token (for Chrome extension)
 */
async function authenticateWithToken(token: string): Promise<AuthResult> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return { user: null, error: "Server configuration error", supabase: null };
    }

    // Create a client with the user's token
    const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // Verify the token by getting the user
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return { user: null, error: "Invalid or expired token", supabase: null };
    }

    return {
      user: {
        id: user.id,
        email: user.email,
      },
      error: null,
      supabase, // Return the authenticated client for RLS
    };
  } catch (error) {
    console.error("Token authentication error:", error);
    return { user: null, error: "Authentication failed", supabase: null };
  }
}

/**
 * Authenticate using Supabase session cookies (for website)
 */
async function authenticateWithSession(): Promise<AuthResult> {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return { user: null, error: "Not authenticated", supabase: null };
    }

    return {
      user: {
        id: user.id,
        email: user.email,
      },
      error: null,
      supabase, // Return the authenticated client for RLS
    };
  } catch (error) {
    console.error("Session authentication error:", error);
    return { user: null, error: "Authentication failed", supabase: null };
  }
}

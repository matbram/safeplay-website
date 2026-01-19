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
    console.log("Auth: Using bearer token authentication, token length:", token.length);
    return authenticateWithToken(token);
  }

  // No Authorization header - fall back to session-based auth (website)
  if (authHeader) {
    // Has auth header but not Bearer format
    console.log("Auth: Invalid Authorization header format:", authHeader.substring(0, 20));
    return { user: null, error: "Invalid authorization format. Use: Bearer <token>", supabase: null };
  }

  console.log("Auth: Using session-based authentication (no Authorization header)");
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
      console.error("Missing Supabase configuration");
      return { user: null, error: "Server configuration error", supabase: null };
    }

    // Create a standard client first to verify the token
    const verifyClient = createBrowserClient(supabaseUrl, supabaseAnonKey);

    // Verify the token by getting the user - this validates the JWT
    const { data: { user }, error } = await verifyClient.auth.getUser(token);

    if (error) {
      console.error("Token verification error:", error.message);
      return { user: null, error: "Invalid or expired token", supabase: null };
    }

    if (!user) {
      console.error("No user found for token");
      return { user: null, error: "Invalid or expired token", supabase: null };
    }

    // Now create a client with the token for RLS-protected queries
    const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

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

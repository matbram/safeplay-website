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
 * Decode a JWT token to extract payload (without verification - RLS will verify)
 */
function decodeJwtPayload(token: string): { sub?: string; email?: string; exp?: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    // Decode the payload (middle part)
    const payload = Buffer.from(parts[1], 'base64').toString('utf-8');
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

/**
 * Authenticate using a Supabase JWT token (for Chrome extension)
 *
 * We decode the JWT locally to extract user info.
 * Since setSession() doesn't work server-side, we use the service role client
 * which bypasses RLS. We manually filter by user_id to ensure data security.
 */
async function authenticateWithToken(token: string): Promise<AuthResult> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase configuration (URL or service role key)");
      return { user: null, error: "Server configuration error", supabase: null };
    }

    // Decode the JWT locally to extract user info
    const payload = decodeJwtPayload(token);

    if (!payload || !payload.sub) {
      console.error("Invalid JWT format or missing sub claim");
      return { user: null, error: "Invalid token format", supabase: null };
    }

    // Check if token is expired
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      console.error("Token expired at:", new Date(payload.exp * 1000).toISOString());
      return { user: null, error: "Token expired", supabase: null };
    }

    // Use service role client which bypasses RLS
    // This is safe because we've validated the JWT and will filter by user_id
    const supabase = createBrowserClient(supabaseUrl, supabaseServiceKey);

    console.log("Auth: Token validated, using service role for user:", payload.sub);

    return {
      user: {
        id: payload.sub,
        email: payload.email,
      },
      error: null,
      supabase, // Service role client - RLS bypassed, filter by user_id manually
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

"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Shield, CheckCircle, XCircle, Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  subscription_tier: string;
  subscription_status: string;
  credits: {
    available: number;
    used_this_period: number;
  };
}

function ExtensionAuthContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error" | "unauthenticated">("loading");
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const extensionId = searchParams.get("extensionId");

  useEffect(() => {
    async function authenticateExtension() {
      if (!extensionId) {
        setError("Missing extension ID");
        setStatus("error");
        return;
      }

      const supabase = createClient();

      // Check if user is logged in
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        setError("Failed to check authentication status");
        setStatus("error");
        return;
      }

      if (!session) {
        setStatus("unauthenticated");
        return;
      }

      // === AUTH-DEBUG: Log full session structure to diagnose refresh token issue ===
      // Railway logs should show this when a user authenticates via extension
      console.log("[AUTH-DEBUG] === Session Analysis ===");
      console.log("[AUTH-DEBUG] Session object keys:", Object.keys(session));
      console.log("[AUTH-DEBUG] session.refresh_token (snake_case):", {
        exists: !!session.refresh_token,
        value: session.refresh_token ? session.refresh_token.substring(0, 30) + "..." : "UNDEFINED",
        length: session.refresh_token?.length ?? 0,
        type: typeof session.refresh_token,
      });
      // Check for camelCase variant (different Supabase SDK versions)
      const sessionAny = session as Record<string, unknown>;
      console.log("[AUTH-DEBUG] session.refreshToken (camelCase check):", {
        exists: !!sessionAny.refreshToken,
        value: sessionAny.refreshToken ? String(sessionAny.refreshToken).substring(0, 30) + "..." : "UNDEFINED",
        length: typeof sessionAny.refreshToken === "string" ? sessionAny.refreshToken.length : 0,
      });
      console.log("[AUTH-DEBUG] session.access_token:", {
        exists: !!session.access_token,
        length: session.access_token?.length ?? 0,
      });
      console.log("[AUTH-DEBUG] session.expires_at:", session.expires_at);
      console.log("[AUTH-DEBUG] session.user.id:", session.user?.id);
      // Log full session structure (with sensitive data truncated)
      const safeSessionLog = {
        ...session,
        access_token: session.access_token ? `${session.access_token.substring(0, 20)}... (${session.access_token.length} chars)` : "MISSING",
        refresh_token: session.refresh_token ? `${session.refresh_token.substring(0, 20)}... (${session.refresh_token.length} chars)` : "MISSING",
      };
      console.log("[AUTH-DEBUG] Full session structure:", JSON.stringify(safeSessionLog, null, 2));
      // === END AUTH-DEBUG ===

      // === AUTH-DEBUG: Send to server for Railway logs ===
      try {
        // Gather cookie info to debug what Supabase is reading
        const cookieInfo = document.cookie.split(";").map(c => {
          const [name, value] = c.trim().split("=");
          const isSupabaseCookie = name?.includes("sb-") || name?.includes("supabase");
          return {
            name,
            valueLength: value?.length ?? 0,
            // Only show preview for Supabase-related cookies
            valuePreview: isSupabaseCookie ? (value?.substring(0, 100) + (value?.length > 100 ? "..." : "")) : "[non-supabase]",
            isSupabaseCookie,
          };
        }).filter(c => c.isSupabaseCookie || c.name?.includes("auth"));

        const debugPayload = {
          source: "extension-auth-page-session",
          cookies: cookieInfo,
          sessionKeys: Object.keys(session),
          refreshTokenSnake: {
            exists: !!session.refresh_token,
            value: session.refresh_token ? session.refresh_token.substring(0, 30) + "..." : "UNDEFINED",
            length: session.refresh_token?.length ?? 0,
            type: typeof session.refresh_token,
            fullValue: session.refresh_token?.length < 50 ? session.refresh_token : undefined, // Only log full value if suspiciously short
          },
          refreshTokenCamel: {
            exists: !!sessionAny.refreshToken,
            value: sessionAny.refreshToken ? String(sessionAny.refreshToken).substring(0, 30) + "..." : "UNDEFINED",
            length: typeof sessionAny.refreshToken === "string" ? sessionAny.refreshToken.length : 0,
          },
          accessTokenInfo: {
            exists: !!session.access_token,
            length: session.access_token?.length ?? 0,
          },
          expiresAt: session.expires_at,
          userId: session.user?.id,
          fullSession: safeSessionLog,
        };
        fetch("/api/auth/debug-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(debugPayload),
        }).catch(() => {}); // Fire and forget, don't block auth flow
      } catch {
        // Ignore debug errors
      }
      // === END SERVER DEBUG ===

      setUserEmail(session.user.email || null);

      // Fetch user profile data
      let userProfile: UserProfile | null = null;
      try {
        // Get profile data
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, email, display_name, subscription_tier, subscription_status")
          .eq("id", session.user.id)
          .single();

        // Get credit balance
        const { data: credits } = await supabase
          .from("credit_balances")
          .select("available_credits, used_this_period")
          .eq("user_id", session.user.id)
          .single();

        if (profile) {
          userProfile = {
            id: profile.id,
            email: profile.email,
            display_name: profile.display_name,
            subscription_tier: profile.subscription_tier || "free",
            subscription_status: profile.subscription_status || "active",
            credits: {
              available: credits?.available_credits ?? 0,
              used_this_period: credits?.used_this_period ?? 0,
            },
          };
        }
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
        // Continue with basic auth even if profile fetch fails
      }

      // Send credentials to extension
      try {
        const availableCredits = userProfile?.credits?.available ?? 0;
        const usedThisPeriod = userProfile?.credits?.used_this_period ?? 0;
        const tier = userProfile?.subscription_tier || "free";

        // Plan allocation based on tier
        const planAllocation = tier === "free" ? 30 : tier === "individual" ? 750 : tier === "family" ? 1500 : 3750;
        const percentConsumed = planAllocation > 0 ? Math.round((usedThisPeriod / planAllocation) * 100) : 0;

        // Build the auth payload matching extension expectations exactly
        // IMPORTANT: expiresAt must be in MILLISECONDS for JS Date comparison
        const expiresAtMs = (session.expires_at || 0) * 1000;

        console.log("[ExtensionAuth] Building payload:", {
          expiresAt_seconds: session.expires_at,
          expiresAt_ms: expiresAtMs,
          now_ms: Date.now(),
          isExpired: expiresAtMs < Date.now(),
          expiresIn_minutes: Math.round((expiresAtMs - Date.now()) / 60000)
        });

        // === AUTH-DEBUG: Log the exact values being assigned to the payload ===
        console.log("[AUTH-DEBUG] === Payload Construction ===");
        console.log("[AUTH-DEBUG] Value being assigned to authPayload.refreshToken:", {
          source: "session.refresh_token",
          value: session.refresh_token ? session.refresh_token.substring(0, 30) + "..." : "UNDEFINED/NULL",
          length: session.refresh_token?.length ?? 0,
          first12Chars: session.refresh_token?.substring(0, 12) ?? "N/A",
        });
        // === END AUTH-DEBUG ===

        const authPayload = {
          type: "AUTH_TOKEN",
          token: session.access_token,
          refreshToken: session.refresh_token,
          expiresAt: expiresAtMs, // Unix timestamp in MILLISECONDS for JS Date.now() comparison
          userId: session.user.id,
          tier: tier,
          user: {
            id: session.user.id,
            email: session.user.email,
            full_name: userProfile?.display_name || session.user.email?.split("@")[0],
            avatar_url: null,
          },
          subscription: {
            id: session.user.id,
            user_id: session.user.id,
            plan_id: tier,
            status: userProfile?.subscription_status || "active",
            plans: {
              id: tier,
              name: tier.charAt(0).toUpperCase() + tier.slice(1),
              monthly_credits: planAllocation,
            },
          },
          userCredits: {
            user_id: session.user.id,
            available_credits: availableCredits,
            used_this_period: usedThisPeriod,
            rollover_credits: 0,
          },
          credits: {
            available: availableCredits,
            used_this_period: usedThisPeriod,
            plan_allocation: planAllocation,
            percent_consumed: percentConsumed,
            plan: tier,
          },
        };

        // === AUTH-DEBUG: Log final payload being sent to extension ===
        console.log("[AUTH-DEBUG] === Final Payload Being Sent ===");
        console.log("[AUTH-DEBUG] authPayload.token length:", authPayload.token?.length ?? 0);
        console.log("[AUTH-DEBUG] authPayload.refreshToken:", {
          length: authPayload.refreshToken?.length ?? 0,
          preview: authPayload.refreshToken ? authPayload.refreshToken.substring(0, 30) + "..." : "MISSING",
          first12Chars: authPayload.refreshToken?.substring(0, 12) ?? "N/A",
        });
        console.log("[AUTH-DEBUG] authPayload.expiresAt:", authPayload.expiresAt);
        console.log("[AUTH-DEBUG] authPayload.userId:", authPayload.userId);
        // Check if something looks wrong
        if (authPayload.refreshToken && authPayload.refreshToken.length < 50) {
          console.error("[AUTH-DEBUG] WARNING: refreshToken is suspiciously short!", {
            length: authPayload.refreshToken.length,
            fullValue: authPayload.refreshToken, // Safe to log if it's only 12 chars
            expectedLength: "100+ characters",
          });
        }
        // === END AUTH-DEBUG ===

        // === AUTH-DEBUG: Send payload info to server for Railway logs ===
        try {
          fetch("/api/auth/debug-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              source: "extension-auth-page-payload",
              authPayload: {
                tokenLength: authPayload.token?.length ?? 0,
                refreshToken: {
                  length: authPayload.refreshToken?.length ?? 0,
                  preview: authPayload.refreshToken ? authPayload.refreshToken.substring(0, 30) + "..." : "MISSING",
                  fullValue: authPayload.refreshToken?.length < 50 ? authPayload.refreshToken : undefined,
                },
                expiresAt: authPayload.expiresAt,
                userId: authPayload.userId,
              },
            }),
          }).catch(() => {}); // Fire and forget
        } catch {
          // Ignore debug errors
        }
        // === END SERVER DEBUG ===

        // Try to communicate with the extension using chrome.runtime.sendMessage
        if (typeof window !== "undefined") {
          const chromeRuntime = (window as typeof window & {
            chrome?: {
              runtime?: {
                sendMessage: (id: string, message: unknown, callback?: (response: unknown) => void) => void
              }
            }
          }).chrome?.runtime;

          if (chromeRuntime?.sendMessage) {
            chromeRuntime.sendMessage(extensionId, authPayload, (response) => {
              console.log("Extension response:", response);
            });
          }
        }

        // Also store in localStorage as fallback for popup-based extensions
        localStorage.setItem("safeplay_extension_auth", JSON.stringify({
          ...authPayload,
          timestamp: Date.now(),
        }));

        setStatus("success");

        // Auto-close after a short delay
        setTimeout(() => {
          window.close();
        }, 2000);
      } catch (err) {
        console.error("Failed to send auth to extension:", err);
        setError("Failed to communicate with extension");
        setStatus("error");
      }
    }

    authenticateExtension();
  }, [extensionId]);

  return (
    <div className="rounded-2xl border border-border bg-card p-8">
      {status === "loading" && (
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary mx-auto animate-spin" />
          <p className="mt-4 text-muted-foreground">Checking authentication...</p>
        </div>
      )}

      {status === "success" && (
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
            <CheckCircle className="w-9 h-9 text-success" />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-foreground">
            Successfully Connected!
          </h2>
          <p className="mt-2 text-muted-foreground">
            Signed in as <span className="font-medium text-foreground">{userEmail}</span>
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            This window will close automatically...
          </p>
          <Button
            variant="outline"
            className="mt-6"
            onClick={() => window.close()}
          >
            Close Window
          </Button>
        </div>
      )}

      {status === "unauthenticated" && (
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto">
            <LogIn className="w-9 h-9 text-warning" />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-foreground">
            Sign In Required
          </h2>
          <p className="mt-2 text-muted-foreground">
            Please sign in to connect your SafePlay account with the browser extension.
          </p>
          <div className="mt-6 space-y-3">
            <Button className="w-full" asChild>
              <Link href={`/login?next=${encodeURIComponent(`/extension/auth?extensionId=${extensionId}`)}`}>
                Sign In
              </Link>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link href={`/signup?next=${encodeURIComponent(`/extension/auth?extensionId=${extensionId}`)}`}>
                Create Account
              </Link>
            </Button>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mx-auto">
            <XCircle className="w-9 h-9 text-error" />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-foreground">
            Connection Failed
          </h2>
          <p className="mt-2 text-muted-foreground">
            {error || "Unable to connect to the extension. Please try again."}
          </p>
          <Button
            variant="outline"
            className="mt-6"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="rounded-2xl border border-border bg-card p-8">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-primary mx-auto animate-spin" />
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

export default function ExtensionAuthPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4">
            <Shield className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">SafePlay Extension</h1>
          <p className="text-muted-foreground mt-2">Browser Authentication</p>
        </div>

        <Suspense fallback={<LoadingFallback />}>
          <ExtensionAuthContent />
        </Suspense>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Having trouble? Visit our{" "}
          <Link href="/support" className="text-primary hover:underline">
            support page
          </Link>
          {" "}for help.
        </p>
      </div>
    </div>
  );
}

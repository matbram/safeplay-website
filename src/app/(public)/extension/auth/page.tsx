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
        // Build the auth payload matching extension expectations
        const authPayload = {
          type: "AUTH_TOKEN",
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expiresAt: session.expires_at, // Unix timestamp in seconds
          user: {
            id: session.user.id,
            email: session.user.email,
            display_name: userProfile?.display_name || session.user.email?.split("@")[0],
          },
          subscription: {
            tier: userProfile?.subscription_tier || "free",
            status: userProfile?.subscription_status || "active",
          },
          credits: userProfile?.credits || {
            available: 0,
            used_this_period: 0,
          },
        };

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

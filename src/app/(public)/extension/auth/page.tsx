"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Shield, CheckCircle, XCircle, Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ExtensionAuthPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
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

      // Send credentials to extension
      try {
        // Try to communicate with the extension using chrome.runtime.sendMessage
        if (typeof window !== "undefined" && (window as typeof window & { chrome?: { runtime?: { sendMessage: (id: string, message: unknown) => void } } }).chrome?.runtime?.sendMessage) {
          const chrome = (window as typeof window & { chrome: { runtime: { sendMessage: (id: string, message: unknown) => void } } }).chrome;
          chrome.runtime.sendMessage(extensionId, {
            type: "AUTH_SUCCESS",
            payload: {
              accessToken: session.access_token,
              refreshToken: session.refresh_token,
              user: {
                id: session.user.id,
                email: session.user.email,
              },
              expiresAt: session.expires_at,
            },
          });
        }

        // Also store in localStorage as fallback for popup-based extensions
        localStorage.setItem("safeplay_extension_auth", JSON.stringify({
          accessToken: session.access_token,
          refreshToken: session.refresh_token,
          user: {
            id: session.user.id,
            email: session.user.email,
          },
          expiresAt: session.expires_at,
          timestamp: Date.now(),
        }));

        setStatus("success");

        // Auto-close after a short delay
        setTimeout(() => {
          window.close();
        }, 3000);
      } catch (err) {
        console.error("Failed to send auth to extension:", err);
        setError("Failed to communicate with extension");
        setStatus("error");
      }
    }

    authenticateExtension();
  }, [extensionId]);

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
                  <Link href={`/login?next=/extension/auth?extensionId=${extensionId}`}>
                    Sign In
                  </Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/signup?next=/extension/auth?extensionId=${extensionId}`}>
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

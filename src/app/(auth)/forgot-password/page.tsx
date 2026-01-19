"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Email is required");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email");
      return;
    }

    setIsLoading(true);

    try {
      if (!supabase) {
        setError("Unable to connect. Please refresh the page.");
        setIsLoading(false);
        return;
      }

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
        setIsLoading(false);
        return;
      }

      // Always show success to prevent email enumeration
      setIsSubmitted(true);
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 bg-muted/30">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-card border rounded-2xl p-8 shadow-sm">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-foreground">SafePlay</span>
            </Link>

            {isSubmitted ? (
              <>
                <div className="w-16 h-16 rounded-full bg-success-light flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-success" />
                </div>
                <h1 className="text-2xl font-bold text-foreground text-center">
                  Check your email
                </h1>
                <p className="mt-2 text-sm text-muted-foreground text-center">
                  We&apos;ve sent a password reset link to{" "}
                  <span className="font-medium text-foreground">{email}</span>
                </p>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-foreground">
                  Forgot your password?
                </h1>
                <p className="mt-2 text-sm text-muted-foreground text-center">
                  No worries! Enter your email and we&apos;ll send you a reset link.
                </p>
              </>
            )}
          </div>

          {isSubmitted ? (
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground text-center">
                Didn&apos;t receive the email?{" "}
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="text-primary font-medium hover:underline"
                >
                  Click to resend
                </button>
              </p>

              <Button asChild className="w-full" variant="outline">
                <Link href="/login">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to sign in
                </Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={error}
                  icon={<Mail className="w-5 h-5" />}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                size="lg"
                loading={isLoading}
              >
                Send reset link
              </Button>

              {/* Back to Login */}
              <Button asChild className="w-full" variant="ghost">
                <Link href="/login">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to sign in
                </Link>
              </Button>
            </form>
          )}
        </div>

        {/* Help Text */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Need help?{" "}
          <Link href="/contact" className="text-primary hover:underline">
            Contact support
          </Link>
        </p>
      </div>
    </div>
  );
}

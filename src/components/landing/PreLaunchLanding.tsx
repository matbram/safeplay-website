"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, Mail, Check, Loader2, Bell, Star, Users, Play, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DemoPlayer } from "./DemoPlayer";
import { cn } from "@/lib/utils";

interface PreLaunchLandingProps {
  className?: string;
}

function EmailSignupForm({
  variant = "default",
  onSuccess
}: {
  variant?: "default" | "large";
  onSuccess?: () => void;
}) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadySubscribed, setAlreadySubscribed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, source: "pre_launch_landing" }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit");
      }

      setIsSuccess(true);
      setAlreadySubscribed(data.already_subscribed);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className={cn(
        "flex flex-col items-center gap-4 rounded-2xl bg-success/10 border-2 border-success/30",
        variant === "large" ? "p-8" : "p-6"
      )}>
        <div className={cn(
          "rounded-full bg-success/20 flex items-center justify-center",
          variant === "large" ? "w-16 h-16" : "w-12 h-12"
        )}>
          <Check className={cn("text-success", variant === "large" ? "w-8 h-8" : "w-6 h-6")} />
        </div>
        <div className="text-center">
          <h3 className={cn(
            "font-semibold text-foreground",
            variant === "large" ? "text-2xl" : "text-lg"
          )}>
            {alreadySubscribed ? "You're already on the list!" : "You're on the list!"}
          </h3>
          <p className={cn(
            "text-muted-foreground mt-2",
            variant === "large" ? "text-base" : "text-sm"
          )}>
            We'll notify you as soon as SafePlay launches.
          </p>
        </div>
      </div>
    );
  }

  if (variant === "large") {
    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground" />
            <Input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="pl-12 h-14 text-lg bg-background border-2 border-border focus:border-primary"
              disabled={isSubmitting}
            />
          </div>
          <Button
            type="submit"
            size="lg"
            className="w-full h-14 text-lg font-semibold"
            disabled={isSubmitting || !email}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Joining waitlist...
              </>
            ) : (
              <>
                Get Early Access
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </div>
        {error && (
          <p className="text-sm text-error text-center">{error}</p>
        )}
        <p className="text-sm text-muted-foreground text-center">
          Join 10,000+ people waiting for launch. No spam, unsubscribe anytime.
        </p>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="pl-10 h-12 text-base bg-card border-border"
            disabled={isSubmitting}
          />
        </div>
        <Button
          type="submit"
          size="lg"
          className="h-12 px-6 text-base whitespace-nowrap"
          disabled={isSubmitting || !email}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Joining...
            </>
          ) : (
            <>
              <Bell className="w-4 h-4 mr-2" />
              Notify Me
            </>
          )}
        </Button>
      </div>
      {error && (
        <p className="text-sm text-error text-center">{error}</p>
      )}
    </form>
  );
}

export function PreLaunchLanding({ className }: PreLaunchLandingProps) {
  return (
    <div className={cn("min-h-screen bg-background", className)}>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">SafePlay</span>
            </Link>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Bell className="w-3.5 h-3.5" />
                Coming Soon
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="pt-24 pb-16 lg:pt-32 lg:pb-24">
        {/* Background gradient */}
        <div className="absolute inset-0 hero-gradient pointer-events-none" />

        {/* Animated background shapes */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-float pointer-events-none" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-float pointer-events-none" style={{ animationDelay: "1s" }} />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Main Content */}
          <div className="text-center max-w-4xl mx-auto">
            {/* Coming Soon Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-in-down">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-medium text-foreground">Launching Soon</span>
            </div>

            {/* Headline */}
            <h1 className="heading-display text-foreground animate-fade-in-up">
              Watch YouTube
              <br />
              <span className="gradient-text">Without the Profanity</span>
            </h1>

            {/* Subheadline */}
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in-up stagger-2">
              SafePlay automatically mutes or bleeps profanity in any YouTube video with incredible precision.
              Perfect for families, classrooms, and workplaces.
            </p>

            {/* Key Benefits */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 animate-fade-in-up stagger-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center">
                  <Check className="w-3 h-3 text-success" />
                </div>
                <span className="text-sm text-muted-foreground">Chrome Extension</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center">
                  <Check className="w-3 h-3 text-success" />
                </div>
                <span className="text-sm text-muted-foreground">Instant Filtering</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center">
                  <Check className="w-3 h-3 text-success" />
                </div>
                <span className="text-sm text-muted-foreground">99.5% Accuracy</span>
              </div>
            </div>
          </div>

          {/* PROMINENT EMAIL SIGNUP CARD */}
          <div className="mt-12 max-w-xl mx-auto animate-fade-in-up stagger-4">
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-primary via-primary/50 to-primary rounded-3xl blur-lg opacity-30 animate-pulse" />

              {/* Card */}
              <div className="relative p-8 rounded-2xl bg-card border-2 border-primary/30 shadow-2xl">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <span className="text-sm font-semibold text-primary uppercase tracking-wide">
                    Get Early Access
                  </span>
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>

                <h2 className="text-2xl font-bold text-foreground text-center mb-2">
                  Be First to Try SafePlay
                </h2>
                <p className="text-muted-foreground text-center mb-6">
                  Sign up now and get notified the moment we launch
                </p>

                <EmailSignupForm variant="large" />
              </div>
            </div>
          </div>

          {/* Interactive Demo Player */}
          <div id="demo" className="mt-16 lg:mt-20 max-w-5xl mx-auto animate-fade-in-up stagger-5">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">See It In Action</h2>
              <p className="text-muted-foreground">Try the demo below - toggle SafePlay on and off to hear the difference</p>
            </div>
            <DemoPlayer videoId="73_1biulkYk" />
          </div>

          {/* Second CTA after demo */}
          <div className="mt-16 max-w-lg mx-auto">
            <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 text-center">
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Impressed? Don't miss the launch!
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Join 10,000+ people who signed up for early access
              </p>
              <EmailSignupForm />
            </div>
          </div>

          {/* Social Proof */}
          <div className="mt-16 text-center">
            <div className="flex items-center justify-center gap-8">
              <div className="text-center">
                <div className="flex items-center gap-0.5 justify-center">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Early reviews</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <span className="text-xl font-bold text-foreground">10K+</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Waiting list</p>
              </div>
            </div>
          </div>

          {/* Features Preview */}
          <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="p-6 rounded-2xl bg-card border border-border">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Family Safe</h3>
              <p className="text-sm text-muted-foreground">
                Watch any YouTube video with your family without worrying about inappropriate language.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-card border border-border">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Play className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Real-time Filtering</h3>
              <p className="text-sm text-muted-foreground">
                Profanity is muted or bleeped instantly as you watch, with no buffering or delays.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-card border border-border">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Star className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">99.5% Accuracy</h3>
              <p className="text-sm text-muted-foreground">
                Our advanced AI detects profanity with incredible precision, catching words others miss.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">
                SafePlay - Making YouTube safe for everyone
              </span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Terms
              </Link>
              <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

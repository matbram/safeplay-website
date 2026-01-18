"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Shield,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Check,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const plans = [
  {
    id: "free",
    name: "Free",
    price: 0,
    credits: "30 credits/month",
    description: "Try SafePlay risk-free",
  },
  {
    id: "individual",
    name: "Individual",
    price: 9.99,
    credits: "750 credits/month",
    description: "Perfect for personal use",
    popular: true,
  },
  {
    id: "family",
    name: "Family",
    price: 19.99,
    credits: "1,500 credits/month",
    description: "Up to 10 profiles",
  },
  {
    id: "organization",
    name: "Organization",
    price: 49.99,
    credits: "3,750 credits/month",
    description: "For teams & businesses",
  },
];

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPlan = searchParams.get("plan");

  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    plan: preselectedPlan || "free",
    agreeToTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  const supabase = createClient();

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleGoogleSignup = async () => {
    setIsGoogleLoading(true);
    setGeneralError("");

    try {
      if (!supabase) {
        setGeneralError("Unable to connect. Please refresh the page.");
        setIsGoogleLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback?next=/dashboard`,
        },
      });

      if (error) {
        setGeneralError(error.message);
        setIsGoogleLoading(false);
      }
    } catch (error) {
      setGeneralError("Failed to connect to Google. Please try again.");
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.agreeToTerms) {
      setErrors({ terms: "You must agree to the terms and privacy policy" });
      return;
    }

    setIsLoading(true);
    setErrors({});
    setGeneralError("");

    try {
      if (!supabase) {
        setGeneralError("Unable to connect. Please refresh the page.");
        setIsLoading(false);
        return;
      }

      // Sign up with Supabase
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
          },
          emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/dashboard`,
        },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          setGeneralError("An account with this email already exists. Please sign in instead.");
        } else {
          setGeneralError(error.message);
        }
        setIsLoading(false);
        return;
      }

      // Check if email confirmation is required
      if (data.user && !data.session) {
        setEmailSent(true);
        setIsLoading(false);
        return;
      }

      // If signed in immediately, handle plan selection
      if (formData.plan !== "free" && data.session) {
        // Redirect to Stripe checkout for paid plans
        router.push(`/billing?upgrade=${formData.plan}`);
      } else {
        // Redirect to dashboard for free plan
        router.push("/dashboard?welcome=true");
        router.refresh();
      }
    } catch (error) {
      setGeneralError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  // Show email confirmation message
  if (emailSent) {
    return (
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center">
          <Link href="/" className="flex items-center gap-2 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-foreground">SafePlay</span>
          </Link>

          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Mail className="w-8 h-8 text-primary" />
          </div>

          <h1 className="text-2xl font-bold text-foreground text-center">
            Check your email
          </h1>
          <p className="mt-4 text-sm text-muted-foreground text-center max-w-sm">
            We&apos;ve sent a confirmation link to <strong className="text-foreground">{formData.email}</strong>.
            Click the link in the email to verify your account.
          </p>

          <div className="mt-8 p-4 rounded-xl bg-muted/50 border border-border w-full">
            <p className="text-sm text-muted-foreground">
              Didn&apos;t receive the email? Check your spam folder or{" "}
              <button
                onClick={() => setEmailSent(false)}
                className="text-primary hover:underline"
              >
                try again with a different email
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-8">
      {/* Logo */}
      <div className="flex flex-col items-center">
        <Link href="/" className="flex items-center gap-2 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-foreground">SafePlay</span>
        </Link>
        <h1 className="text-2xl font-bold text-foreground">
          {step === 1 ? "Create your account" : "Choose your plan"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {step === 1
            ? "Start filtering YouTube videos in minutes"
            : "Select the plan that works best for you"}
        </p>
      </div>

      {/* General Error */}
      {generalError && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {generalError}
        </div>
      )}

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2">
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
            step >= 1
              ? "bg-primary text-white"
              : "bg-muted text-muted-foreground"
          )}
        >
          {step > 1 ? <Check className="w-4 h-4" /> : "1"}
        </div>
        <div
          className={cn(
            "w-16 h-1 rounded-full transition-colors",
            step > 1 ? "bg-primary" : "bg-muted"
          )}
        />
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
            step >= 2
              ? "bg-primary text-white"
              : "bg-muted text-muted-foreground"
          )}
        >
          2
        </div>
      </div>

      {/* Step 1: Account Details */}
      {step === 1 && (
        <form onSubmit={(e) => { e.preventDefault(); handleNextStep(); }} className="mt-8 space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              error={errors.name}
              icon={<User className="w-5 h-5" />}
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              error={errors.email}
              icon={<Mail className="w-5 h-5" />}
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Min. 8 characters"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                error={errors.password}
                icon={<Lock className="w-5 h-5" />}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Continue Button */}
          <Button type="submit" className="w-full" size="lg">
            Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          {/* Social Login */}
          <Button
            variant="outline"
            className="w-full"
            size="lg"
            type="button"
            onClick={handleGoogleSignup}
            loading={isGoogleLoading}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>
        </form>
      )}

      {/* Step 2: Plan Selection */}
      {step === 2 && (
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {/* Back Button */}
          <button
            type="button"
            onClick={() => setStep(1)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to account details
          </button>

          {/* Plan Selection */}
          <div className="grid grid-cols-2 gap-4">
            {plans.map((plan) => (
              <button
                key={plan.id}
                type="button"
                onClick={() => setFormData({ ...formData, plan: plan.id })}
                className={cn(
                  "relative p-4 rounded-xl border-2 text-left transition-all",
                  formData.plan === plan.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                {plan.popular && (
                  <span className="absolute -top-2 -right-2 px-2 py-0.5 text-xs font-medium bg-primary text-white rounded-full">
                    Popular
                  </span>
                )}
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-foreground">
                    {plan.name}
                  </span>
                  {formData.plan === plan.id && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                <div className="text-2xl font-bold text-foreground">
                  ${plan.price}
                  <span className="text-sm font-normal text-muted-foreground">
                    /mo
                  </span>
                </div>
                <div className="mt-1 text-xs text-primary font-medium">
                  {plan.credits}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {plan.description}
                </p>
              </button>
            ))}
          </div>

          {/* Terms Agreement */}
          <div className="flex items-start gap-2">
            <Checkbox
              id="terms"
              checked={formData.agreeToTerms}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, agreeToTerms: checked as boolean })
              }
              className="mt-1"
            />
            <Label htmlFor="terms" className="text-sm font-normal leading-relaxed">
              I agree to the{" "}
              <Link href="/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </Label>
          </div>
          {errors.terms && (
            <p className="text-xs text-error">{errors.terms}</p>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            loading={isLoading}
          >
            {formData.plan === "free"
              ? "Create Free Account"
              : `Start 7-Day Free Trial`}
          </Button>

          {formData.plan !== "free" && (
            <p className="text-xs text-center text-muted-foreground">
              You won&apos;t be charged until your trial ends. Cancel anytime.
            </p>
          )}
        </form>
      )}

      {/* Sign In Link */}
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-primary font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

function SignupFormFallback() {
  return (
    <div className="w-full max-w-md space-y-8">
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-2 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-foreground">SafePlay</span>
        </div>
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-4 w-64 bg-muted rounded animate-pulse mt-2" />
      </div>
      <div className="space-y-4">
        <div className="h-10 bg-muted rounded animate-pulse" />
        <div className="h-10 bg-muted rounded animate-pulse" />
        <div className="h-10 bg-muted rounded animate-pulse" />
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <Suspense fallback={<SignupFormFallback />}>
          <SignupForm />
        </Suspense>
      </div>

      {/* Right Side - Branding */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-primary to-secondary items-center justify-center p-12">
        <div className="max-w-lg text-white">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-sm font-medium mb-6">
              <Shield className="w-4 h-4" />
              Join 10,000+ families
            </div>
            <h2 className="text-3xl font-bold mb-4">
              Start watching clean content today
            </h2>
            <p className="text-white/80 text-lg">
              Create your account and start filtering YouTube videos immediately. No credit card required for free plan.
            </p>
          </div>

          {/* Testimonial */}
          <div className="p-6 rounded-2xl bg-white/10 backdrop-blur">
            <p className="text-white/90 italic">
              &ldquo;SafePlay has been a game-changer for our family movie nights. We can finally watch YouTube together without worrying about inappropriate language.&rdquo;
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20" />
              <div>
                <p className="font-semibold">Sarah M.</p>
                <p className="text-sm text-white/70">Mother of 3</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

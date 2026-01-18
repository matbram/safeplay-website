"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  CreditCard,
  Check,
  Calendar,
  Download,
  AlertTriangle,
  ArrowRight,
  Zap,
  Users,
  Building,
  Star,
  Loader2,
  Plus,
  Sparkles,
  CheckCircle,
  XCircle,
  X,
} from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { useUser } from "@/contexts/user-context";

// Credit top-up packs - priced at 1.5x the subscription rate
// Subscription: $9.99 = 750 credits (~$0.0133/credit)
// Top-up: ~$0.02/credit (1.5x markup)
const creditPacks = [
  {
    id: "pack_250",
    credits: 250,
    price_cents: 499,
    popular: false,
    savings: null,
  },
  {
    id: "pack_500",
    credits: 500,
    price_cents: 999,
    popular: true,
    savings: null,
  },
  {
    id: "pack_1000",
    credits: 1000,
    price_cents: 1999,
    popular: false,
    savings: "Save $1",
  },
  {
    id: "pack_2500",
    credits: 2500,
    price_cents: 4999,
    popular: false,
    savings: "Save $2.50",
  },
];

const plans = [
  {
    id: "free",
    name: "Free",
    price_cents: 0,
    credits_per_month: 30,
    features: ["30 credits/month", "Mute or bleep", "Re-watch free"],
    icon: Star,
  },
  {
    id: "individual",
    name: "Individual",
    price_cents: 999,
    credits_per_month: 750,
    features: ["750 credits/month", "Custom word filters", "Up to 3 profiles", "Email support"],
    icon: Zap,
    popular: true,
  },
  {
    id: "family",
    name: "Family",
    price_cents: 1999,
    credits_per_month: 1500,
    features: ["1,500 credits/month", "Up to 10 profiles", "Parental controls", "Priority support"],
    icon: Users,
  },
  {
    id: "organization",
    name: "Organization",
    price_cents: 4999,
    credits_per_month: 3750,
    features: ["3,750 credits/month", "Unlimited members", "Admin dashboard", "Dedicated support"],
    icon: Building,
  },
];

const planQuotas: Record<string, number> = {
  free: 30,
  individual: 750,
  family: 1500,
  organization: 3750,
};

const planPrices: Record<string, number> = {
  free: 0,
  individual: 999,
  family: 1999,
  organization: 4999,
};

const planNames: Record<string, string> = {
  free: "Free",
  individual: "Individual",
  family: "Family",
  organization: "Organization",
};

function BillingContent() {
  const { user, credits, loading, refetch } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showCreditPackDialog, setShowCreditPackDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseMessage, setPurchaseMessage] = useState<{ type: "success" | "cancelled"; credits?: number } | null>(null);

  // Handle purchase result from URL params
  useEffect(() => {
    const purchase = searchParams.get("purchase");
    const creditsAdded = searchParams.get("credits");

    if (purchase === "success") {
      setPurchaseMessage({ type: "success", credits: creditsAdded ? parseInt(creditsAdded, 10) : undefined });
      // Refresh user data to show new credit balance
      refetch();
      // Clear URL params
      router.replace("/billing", { scroll: false });
    } else if (purchase === "cancelled") {
      setPurchaseMessage({ type: "cancelled" });
      router.replace("/billing", { scroll: false });
    }
  }, [searchParams, router, refetch]);

  // Auto-dismiss purchase message after 5 seconds
  useEffect(() => {
    if (purchaseMessage) {
      const timer = setTimeout(() => {
        setPurchaseMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [purchaseMessage]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentPlan = user?.subscription_tier || "free";
  const totalCredits = planQuotas[currentPlan] || 30;
  const usedCredits = credits?.used_this_period || 0;
  const availableCredits = credits?.available_credits || 0;
  const rolloverCredits = credits?.rollover_credits || 0;
  const topupCredits = credits?.topup_credits || 0;

  const periodEnd = credits?.period_end ? new Date(credits.period_end) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const daysRemaining = Math.max(0, Math.ceil((periodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  const usagePercentage = totalCredits > 0 ? Math.round((usedCredits / totalCredits) * 100) : 0;

  const handlePurchasePack = async (packId: string) => {
    setPurchasing(true);
    try {
      const response = await fetch("/api/credits/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ packId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Purchase error:", error);
      alert(error instanceof Error ? error.message : "Failed to initiate purchase");
      setPurchasing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Purchase Message */}
      {purchaseMessage && (
        <div
          className={cn(
            "flex items-center justify-between p-4 rounded-lg",
            purchaseMessage.type === "success"
              ? "bg-success/10 border border-success/20"
              : "bg-muted border border-border"
          )}
        >
          <div className="flex items-center gap-3">
            {purchaseMessage.type === "success" ? (
              <CheckCircle className="w-5 h-5 text-success" />
            ) : (
              <XCircle className="w-5 h-5 text-muted-foreground" />
            )}
            <p className="font-medium">
              {purchaseMessage.type === "success"
                ? `Successfully purchased ${purchaseMessage.credits || ""} credits! Your balance has been updated.`
                : "Purchase cancelled. No charges were made."}
            </p>
          </div>
          <button
            onClick={() => setPurchaseMessage(null)}
            className="p-1 rounded hover:bg-black/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Billing & Subscription</h1>
        <p className="text-muted-foreground">
          Manage your subscription, payment method, and view invoices.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Plan */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Current Plan</CardTitle>
                  <CardDescription>
                    Your subscription details and usage
                  </CardDescription>
                </div>
                <Badge variant={user?.subscription_status === "active" ? "success" : "warning"}>
                  {user?.subscription_status || "active"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Plan Info */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{planNames[currentPlan]} Plan</p>
                    <p className="text-sm text-muted-foreground">
                      {totalCredits} credits/month
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">
                    {formatCurrency(planPrices[currentPlan] || 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">per month</p>
                </div>
              </div>

              {/* Credit Usage */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Credits Available</span>
                  <span className="font-medium">
                    {availableCredits} credits ({usagePercentage}% of monthly used)
                  </span>
                </div>
                <Progress value={usagePercentage} className="h-2" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {rolloverCredits > 0 && `+${rolloverCredits} rollover`}
                    {rolloverCredits > 0 && topupCredits > 0 && " · "}
                    {topupCredits > 0 && `+${topupCredits} top-up`}
                    {rolloverCredits === 0 && topupCredits === 0 && "No bonus credits"}
                  </span>
                  <span>Resets in {daysRemaining} days</span>
                </div>
              </div>

              {/* Billing Cycle */}
              <div className="flex items-center gap-3 p-3 rounded-lg border">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Next billing date</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(periodEnd)} -{" "}
                    {formatCurrency(planPrices[currentPlan] || 0)}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button onClick={() => setShowUpgradeDialog(true)}>
                  Change Plan
                </Button>
                {currentPlan !== "free" && (
                  <Button
                    variant="outline"
                    className="text-error hover:text-error"
                    onClick={() => setShowCancelDialog(true)}
                  >
                    Cancel Subscription
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Credit Top-Up Packs */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Need More Credits?
                  </CardTitle>
                  <CardDescription>
                    Top up instantly - credits never expire
                  </CardDescription>
                </div>
                <Button onClick={() => setShowCreditPackDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Buy Credits
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {creditPacks.map((pack) => (
                  <button
                    key={pack.id}
                    onClick={() => {
                      setSelectedPack(pack.id);
                      setShowCreditPackDialog(true);
                    }}
                    className={cn(
                      "relative p-4 rounded-xl border-2 text-center transition-all hover:border-primary/50 hover:bg-primary/5",
                      pack.popular ? "border-primary bg-primary/5" : "border-border"
                    )}
                  >
                    {pack.popular && (
                      <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs">
                        Popular
                      </Badge>
                    )}
                    <p className="text-2xl font-bold text-primary">{pack.credits}</p>
                    <p className="text-xs text-muted-foreground">credits</p>
                    <p className="mt-2 font-semibold">{formatCurrency(pack.price_cents)}</p>
                    {pack.savings && (
                      <p className="text-xs text-success mt-1">{pack.savings}</p>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground text-center mt-4">
                Top-up credits never expire and are used after your monthly allocation
              </p>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
              <CardDescription>
                Your saved payment information
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentPlan === "free" ? (
                <div className="text-center py-6">
                  <CreditCard className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No payment method required for free plan</p>
                  <Button className="mt-4" onClick={() => setShowUpgradeDialog(true)}>
                    Upgrade to add payment method
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-8 rounded bg-gradient-to-r from-blue-600 to-blue-800 flex items-center justify-center text-white text-xs font-bold uppercase">
                      Card
                    </div>
                    <div>
                      <p className="font-medium">Payment method on file</p>
                      <p className="text-sm text-muted-foreground">
                        Managed through Stripe
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Update
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoices */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Invoice History</CardTitle>
                  <CardDescription>Download past invoices</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <Download className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No invoices yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Invoices will appear here after your first payment
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Plan Comparison */}
        <div>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Available Plans</CardTitle>
              <CardDescription>
                Compare plans and find the right fit
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {plans.map((plan) => {
                const isCurrent = plan.id === currentPlan;
                const PlanIcon = plan.icon;

                return (
                  <button
                    key={plan.id}
                    onClick={() => {
                      if (!isCurrent) {
                        setSelectedPlan(plan.id);
                        setShowUpgradeDialog(true);
                      }
                    }}
                    disabled={isCurrent}
                    className={cn(
                      "w-full p-4 rounded-xl border-2 text-left transition-all",
                      isCurrent
                        ? "border-primary bg-primary/5 cursor-default"
                        : "border-border hover:border-primary/50 cursor-pointer"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <PlanIcon className="w-4 h-4 text-primary" />
                        <span className="font-semibold">{plan.name}</span>
                      </div>
                      {isCurrent && (
                        <Badge variant="default" className="text-xs">
                          Current
                        </Badge>
                      )}
                      {plan.popular && !isCurrent && (
                        <Badge variant="secondary" className="text-xs">
                          Popular
                        </Badge>
                      )}
                    </div>
                    <p className="text-lg font-bold">
                      {formatCurrency(plan.price_cents)}
                      <span className="text-sm font-normal text-muted-foreground">
                        /mo
                      </span>
                    </p>
                    <p className="text-xs text-primary mt-1">
                      {plan.credits_per_month} credits/month
                    </p>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Upgrade Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Change Your Plan</DialogTitle>
            <DialogDescription>
              Select a new plan. Changes take effect immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {plans.map((plan) => {
              const isCurrent = plan.id === currentPlan;
              const isSelected = plan.id === selectedPlan;
              const PlanIcon = plan.icon;

              return (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  disabled={isCurrent}
                  className={cn(
                    "w-full p-4 rounded-xl border-2 text-left transition-all",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : isCurrent
                      ? "border-muted bg-muted/50 opacity-50 cursor-not-allowed"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        isSelected ? "bg-primary text-white" : "bg-muted"
                      )}
                    >
                      <PlanIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold">{plan.name}</p>
                        <p className="font-bold">
                          {formatCurrency(plan.price_cents)}
                          <span className="text-sm font-normal text-muted-foreground">
                            /mo
                          </span>
                        </p>
                      </div>
                      <p className="text-sm text-primary mt-1">
                        {plan.credits_per_month} credits/month
                      </p>
                      <ul className="mt-2 space-y-1">
                        {plan.features.slice(0, 3).map((feature) => (
                          <li
                            key={feature}
                            className="text-xs text-muted-foreground flex items-center gap-1"
                          >
                            <Check className="w-3 h-3 text-success" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>
              Cancel
            </Button>
            <Button
              disabled={!selectedPlan || selectedPlan === currentPlan}
            >
              {selectedPlan &&
              plans.find((p) => p.id === selectedPlan)!.price_cents >
                (planPrices[currentPlan] || 0)
                ? "Upgrade Plan"
                : "Downgrade Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Cancel Subscription
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel? You&apos;ll lose access to premium features.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="p-4 rounded-lg bg-warning-light">
              <p className="text-sm text-warning font-medium">
                If you cancel, your subscription will remain active until{" "}
                {formatDate(periodEnd)}, then you&apos;ll be
                downgraded to the Free plan.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">You&apos;ll lose:</p>
              <ul className="space-y-1">
                <li className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-error" />
                  {totalCredits} monthly credits (down to 30)
                </li>
                <li className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-error" />
                  Custom word filters
                </li>
                <li className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-error" />
                  Multiple profiles
                </li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Keep Subscription
            </Button>
            <Button variant="destructive">Cancel Subscription</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credit Pack Purchase Dialog */}
      <Dialog open={showCreditPackDialog} onOpenChange={setShowCreditPackDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Buy Credit Pack
            </DialogTitle>
            <DialogDescription>
              Top-up credits never expire and are used after your monthly allocation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {creditPacks.map((pack) => {
              const isSelected = pack.id === selectedPack;

              return (
                <button
                  key={pack.id}
                  onClick={() => setSelectedPack(pack.id)}
                  className={cn(
                    "w-full p-4 rounded-xl border-2 text-left transition-all",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center",
                          isSelected ? "bg-primary text-white" : "bg-muted"
                        )}
                      >
                        <Plus className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold">{pack.credits} Credits</p>
                        {pack.savings && (
                          <p className="text-xs text-success">{pack.savings}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{formatCurrency(pack.price_cents)}</p>
                      <p className="text-xs text-muted-foreground">
                        {(pack.price_cents / pack.credits).toFixed(1)}¢/credit
                      </p>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center ml-2">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
            <p>Your new balance will be: <strong className="text-foreground">{availableCredits + (selectedPack ? creditPacks.find(p => p.id === selectedPack)?.credits || 0 : 0)} credits</strong></p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreditPackDialog(false)}>
              Cancel
            </Button>
            <Button
              disabled={!selectedPack || purchasing}
              onClick={() => selectedPack && handlePurchasePack(selectedPack)}
            >
              {purchasing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Buy {selectedPack ? creditPacks.find(p => p.id === selectedPack)?.credits : ""} Credits
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <BillingContent />
    </Suspense>
  );
}

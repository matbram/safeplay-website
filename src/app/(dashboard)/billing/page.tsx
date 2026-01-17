"use client";

import { useState } from "react";
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
} from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

// Mock data
const subscription = {
  plan: {
    id: "individual",
    name: "Individual",
    price_cents: 999,
    credits_per_month: 750,
  },
  status: "active",
  current_period_start: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
  current_period_end: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
  cancel_at_period_end: false,
};

const paymentMethod = {
  brand: "visa",
  last4: "4242",
  exp_month: 12,
  exp_year: 2027,
};

const invoices = [
  {
    id: "inv_1",
    amount_cents: 999,
    status: "paid",
    created_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
    invoice_pdf_url: "#",
  },
  {
    id: "inv_2",
    amount_cents: 999,
    status: "paid",
    created_at: new Date(Date.now() - 48 * 24 * 60 * 60 * 1000),
    invoice_pdf_url: "#",
  },
  {
    id: "inv_3",
    amount_cents: 999,
    status: "paid",
    created_at: new Date(Date.now() - 78 * 24 * 60 * 60 * 1000),
    invoice_pdf_url: "#",
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

const creditUsage = {
  used: 45,
  total: 750,
  rollover: 320,
};

export default function BillingPage() {
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const daysRemaining = Math.ceil(
    (subscription.current_period_end.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  const usagePercentage = Math.round((creditUsage.used / creditUsage.total) * 100);

  return (
    <div className="space-y-8">
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
                <Badge variant={subscription.status === "active" ? "success" : "warning"}>
                  {subscription.status}
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
                    <p className="font-semibold text-lg">{subscription.plan.name} Plan</p>
                    <p className="text-sm text-muted-foreground">
                      {subscription.plan.credits_per_month} credits/month
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">
                    {formatCurrency(subscription.plan.price_cents)}
                  </p>
                  <p className="text-sm text-muted-foreground">per month</p>
                </div>
              </div>

              {/* Credit Usage */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Credit Usage</span>
                  <span className="font-medium">
                    {creditUsage.used} / {creditUsage.total} used ({usagePercentage}%)
                  </span>
                </div>
                <Progress value={usagePercentage} className="h-2" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>+ {creditUsage.rollover} rollover credits available</span>
                  <span>Resets in {daysRemaining} days</span>
                </div>
              </div>

              {/* Billing Cycle */}
              <div className="flex items-center gap-3 p-3 rounded-lg border">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Next billing date</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(subscription.current_period_end)} -{" "}
                    {formatCurrency(subscription.plan.price_cents)}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button onClick={() => setShowUpgradeDialog(true)}>
                  Change Plan
                </Button>
                <Button
                  variant="outline"
                  className="text-error hover:text-error"
                  onClick={() => setShowCancelDialog(true)}
                >
                  Cancel Subscription
                </Button>
              </div>
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
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-8 rounded bg-gradient-to-r from-blue-600 to-blue-800 flex items-center justify-center text-white text-xs font-bold uppercase">
                    {paymentMethod.brand}
                  </div>
                  <div>
                    <p className="font-medium">
                      {paymentMethod.brand.charAt(0).toUpperCase() +
                        paymentMethod.brand.slice(1)}{" "}
                      ending in {paymentMethod.last4}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Expires {paymentMethod.exp_month}/{paymentMethod.exp_year}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Update
                </Button>
              </div>
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
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {formatCurrency(invoice.amount_cents)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(invoice.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={
                          invoice.status === "paid" ? "success" : "warning"
                        }
                      >
                        {invoice.status}
                      </Badge>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={invoice.invoice_pdf_url} download>
                          <Download className="w-4 h-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
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
                const isCurrent = plan.id === subscription.plan.id;
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
              const isCurrent = plan.id === subscription.plan.id;
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
              disabled={!selectedPlan || selectedPlan === subscription.plan.id}
            >
              {selectedPlan &&
              plans.find((p) => p.id === selectedPlan)!.price_cents >
                subscription.plan.price_cents
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
                {formatDate(subscription.current_period_end)}, then you&apos;ll be
                downgraded to the Free plan.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">You&apos;ll lose:</p>
              <ul className="space-y-1">
                <li className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-error" />
                  750 monthly credits (down to 30)
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
    </div>
  );
}

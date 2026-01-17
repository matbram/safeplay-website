import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { ArrowLeft, Users, UserPlus, Shield, Eye, Coins, Archive, CreditCard, CheckCircle, Lightbulb } from "lucide-react";

export const metadata = {
  title: "Family & Profiles - SafePlay Help Center",
  description: "Learn how to set up and manage family profiles and parental controls.",
};

export default function HelpCategoryPage() {
  return (
    <>
      <Header />
      <main className="pt-16">
        <section className="py-12 lg:py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            {/* Back link */}
            <Link
              href="/help"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Help Center
            </Link>

            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Users className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Family & Profiles</h1>
                <p className="text-muted-foreground">Managing family members and parental controls</p>
              </div>
            </div>

            {/* Quick Links */}
            <div className="mb-12 p-4 rounded-xl bg-muted/50 border border-border">
              <p className="text-sm font-medium text-foreground mb-3">Quick Links</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "family-overview", title: "Overview" },
                  { id: "create-profiles", title: "Create Profiles" },
                  { id: "parental-controls", title: "Parental Controls" },
                  { id: "sharing-credits", title: "Credit Sharing" },
                  { id: "removing-profiles", title: "Remove Profiles" },
                  { id: "family-billing", title: "Family Billing" },
                ].map((article) => (
                  <a
                    key={article.id}
                    href={`#${article.id}`}
                    className="px-3 py-1.5 rounded-full bg-background text-sm text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  >
                    {article.title}
                  </a>
                ))}
              </div>
            </div>

            {/* Articles */}
            <div className="space-y-12">
              {/* Article 1 - Family Overview */}
              <article id="family-overview" className="scroll-mt-24">
                <div className="p-8 rounded-2xl bg-card border border-border">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">Family Profiles Overview</h2>
                  </div>

                  <p className="text-muted-foreground mb-6">
                    Family profiles let you share one SafePlay subscription with your whole household while giving
                    each person their own experience.
                  </p>

                  <div className="grid sm:grid-cols-2 gap-4 mb-6">
                    <div className="p-4 rounded-xl bg-muted/50 border border-border">
                      <p className="font-semibold text-foreground mb-3">What Each Profile Gets</p>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        {[
                          "Personal viewing history",
                          "Individual filter preferences",
                          "Custom word lists (configurable)",
                          "Separate watch progress",
                        ].map((item, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 rounded-xl bg-muted/50 border border-border">
                      <p className="font-semibold text-foreground mb-3">Shared Resources</p>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        {[
                          "Monthly credit pool (shared)",
                          "Filtered video library",
                          "Subscription management",
                        ].map((item, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="p-5 rounded-xl bg-[#0F0F0F] text-white">
                    <p className="font-semibold mb-3">Profile Limits by Plan</p>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      {[
                        { plan: "Individual", profiles: "3" },
                        { plan: "Family", profiles: "10" },
                        { plan: "Organization", profiles: "Unlimited" },
                      ].map((item) => (
                        <div key={item.plan}>
                          <p className="text-2xl font-bold text-primary">{item.profiles}</p>
                          <p className="text-sm text-white/60">{item.plan}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </article>

              {/* Article 2 - Create Profiles */}
              <article id="create-profiles" className="scroll-mt-24">
                <div className="p-8 rounded-2xl bg-card border border-border">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <UserPlus className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">Creating Family Profiles</h2>
                  </div>

                  <p className="text-muted-foreground mb-6">
                    Adding profiles for your family members is easy:
                  </p>

                  <div className="p-4 rounded-xl bg-muted/50 border border-border mb-6">
                    <p className="font-semibold text-foreground mb-3">Creating a New Profile</p>
                    <div className="space-y-3">
                      {[
                        { step: "1", title: "Go to Family", desc: "In your dashboard" },
                        { step: "2", title: "Click \"Add Profile\"", desc: "" },
                        { step: "3", title: "Enter the profile name", desc: "e.g., \"Emma\" or \"Kids TV\"" },
                        { step: "4", title: "Choose profile type", desc: "Child profiles enable parental oversight" },
                        { step: "5", title: "Set filter preferences", desc: "" },
                        { step: "6", title: "Click \"Create Profile\"", desc: "" },
                      ].map((item) => (
                        <div key={item.step} className="flex items-start gap-4">
                          <span className="w-7 h-7 rounded-full bg-primary text-white font-bold text-sm flex items-center justify-center flex-shrink-0">
                            {item.step}
                          </span>
                          <div>
                            <p className="font-medium text-foreground">{item.title}</p>
                            {item.desc && <p className="text-sm text-muted-foreground">{item.desc}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 mb-6">
                    <div className="p-4 rounded-xl bg-card border-2 border-blue-500/30">
                      <p className="font-semibold text-foreground mb-2">Adult Profiles</p>
                      <p className="text-sm text-muted-foreground">
                        Full access, can see their own history only
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-card border-2 border-purple-500/30">
                      <p className="font-semibold text-foreground mb-2">Child Profiles</p>
                      <p className="text-sm text-muted-foreground">
                        Parents can view their history and manage settings
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-muted/50 border border-border flex items-start gap-4">
                    <Lightbulb className="w-6 h-6 text-warning flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Profile Switching</p>
                      <p className="text-sm text-muted-foreground">
                        On the extension or web app, click your profile icon and select a different profile
                        to switch. Each profile&apos;s activity is tracked separately.
                      </p>
                    </div>
                  </div>
                </div>
              </article>

              {/* Article 3 - Parental Controls */}
              <article id="parental-controls" className="scroll-mt-24">
                <div className="p-8 rounded-2xl bg-card border border-border">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">Setting Up Parental Controls</h2>
                  </div>

                  <p className="text-muted-foreground mb-6">
                    Parental controls give you oversight of your children&apos;s viewing activity.
                  </p>

                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 mb-6">
                    <p className="font-semibold text-foreground">Enabling Parental Controls</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      When creating a profile, mark it as a &quot;Child&quot; profile. Or edit an existing profile
                      and change its type to Child.
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 mb-6">
                    <div className="p-4 rounded-xl bg-muted/50 border border-border">
                      <div className="flex items-center gap-2 mb-3">
                        <Eye className="w-5 h-5 text-primary" />
                        <p className="font-semibold text-foreground">What Parents Can See</p>
                      </div>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• Complete viewing history</li>
                        <li>• Videos filtered and watched</li>
                        <li>• Timestamps of activity</li>
                        <li>• Credits used by child</li>
                      </ul>
                    </div>

                    <div className="p-4 rounded-xl bg-muted/50 border border-border">
                      <div className="flex items-center gap-2 mb-3">
                        <Shield className="w-5 h-5 text-primary" />
                        <p className="font-semibold text-foreground">What Parents Can Control</p>
                      </div>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• Custom word list per child</li>
                        <li>• Filter mode (mute vs bleep)</li>
                        <li>• Remove videos from history</li>
                      </ul>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-muted/50 border border-border mb-4">
                    <p className="font-semibold text-foreground mb-3">Viewing Child Activity</p>
                    <ol className="space-y-2">
                      {[
                        "Go to Family",
                        "Click on a child profile",
                        "Select \"View Activity\"",
                        "See their complete viewing history",
                      ].map((step, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="w-6 h-6 rounded bg-primary/10 text-primary text-xs flex items-center justify-center flex-shrink-0">
                            {i + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div className="p-4 rounded-xl bg-muted/50 border border-border">
                    <p className="font-semibold text-foreground mb-2">Privacy Notes</p>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Child profiles cannot see other profiles&apos; activity</li>
                      <li>• Only account owners and designated parents can view child activity</li>
                      <li>• Children see their own history but not parental oversight activity</li>
                    </ul>
                  </div>
                </div>
              </article>

              {/* Article 4 - Credit Sharing */}
              <article id="sharing-credits" className="scroll-mt-24">
                <div className="p-8 rounded-2xl bg-card border border-border">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Coins className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">How Credit Sharing Works</h2>
                  </div>

                  <p className="text-muted-foreground mb-6">
                    All profiles on your account share the same credit pool.
                  </p>

                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 mb-6">
                    <p className="font-semibold text-foreground">The Shared Pool</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your monthly credits, rollover credits, and top-up credits are all combined into one
                      pool that any profile can use.
                    </p>
                  </div>

                  <div className="p-5 rounded-xl bg-[#0F0F0F] text-white mb-6">
                    <p className="font-semibold mb-3">Example</p>
                    <ul className="space-y-2 text-sm text-white/80">
                      <li>• You have a Family plan (1,500 credits/month)</li>
                      <li>• Mom filters a 90-minute movie (90 credits)</li>
                      <li>• Dad filters a 45-minute documentary (45 credits)</li>
                      <li>• Kids filter various videos (200 credits)</li>
                      <li className="text-primary font-medium">• Remaining: 1,165 credits available for anyone</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-muted/50 border border-border mb-4">
                    <p className="font-semibold text-foreground mb-3">Monitoring Usage</p>
                    <ol className="space-y-2">
                      {[
                        "Go to Family",
                        "View the \"Credit Usage\" section",
                        "See breakdown by profile",
                      ].map((step, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="w-6 h-6 rounded bg-primary/10 text-primary text-xs flex items-center justify-center flex-shrink-0">
                            {i + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div className="p-4 rounded-xl bg-muted/50 border border-border flex items-start gap-4">
                    <Lightbulb className="w-6 h-6 text-warning flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Tips for Managing Shared Credits</p>
                      <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                        <li>• Review usage periodically in the Family dashboard</li>
                        <li>• Remind family members that re-watching is free</li>
                        <li>• Consider upgrading if you consistently run out</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </article>

              {/* Article 5 - Removing Profiles */}
              <article id="removing-profiles" className="scroll-mt-24">
                <div className="p-8 rounded-2xl bg-card border border-border">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Archive className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">Removing or Archiving Profiles</h2>
                  </div>

                  <p className="text-muted-foreground mb-6">
                    Sometimes you need to remove a profile from your account.
                  </p>

                  <div className="p-4 rounded-xl bg-muted/50 border border-border mb-4">
                    <p className="font-semibold text-foreground mb-3">Removing a Profile</p>
                    <ol className="space-y-2">
                      {[
                        "Go to Family",
                        "Click on the profile to remove",
                        "Click \"Remove Profile\"",
                        "Confirm the removal",
                      ].map((step, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="w-6 h-6 rounded bg-primary/10 text-primary text-xs flex items-center justify-center flex-shrink-0">
                            {i + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 mb-6">
                    <p className="font-semibold text-foreground mb-2">What Happens When Removed</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• The profile&apos;s viewing history is deleted</li>
                      <li>• Their custom word list is deleted</li>
                      <li>• Filtered videos remain accessible to other profiles</li>
                      <li>• Credits used by that profile are not refunded</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                    <p className="font-semibold text-foreground">Archiving Instead</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      If you might want the profile back later (e.g., a child going to college):
                    </p>
                    <ol className="space-y-1 mt-2 text-sm text-muted-foreground">
                      <li>1. Edit the profile</li>
                      <li>2. Toggle &quot;Archive Profile&quot;</li>
                      <li>3. The profile becomes inactive but data is preserved</li>
                      <li>4. You can reactivate it anytime</li>
                    </ol>
                  </div>
                </div>
              </article>

              {/* Article 6 - Family Billing */}
              <article id="family-billing" className="scroll-mt-24">
                <div className="p-8 rounded-2xl bg-card border border-border">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">Family Plan Billing</h2>
                  </div>

                  <p className="text-muted-foreground mb-6">
                    The account owner manages all billing for the family.
                  </p>

                  <div className="space-y-4 mb-6">
                    <div className="p-4 rounded-xl bg-muted/50 border border-border">
                      <p className="font-semibold text-foreground">Who Pays</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Only the account owner is billed. Other family members don&apos;t need payment information.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-muted/50 border border-border">
                      <p className="font-semibold text-foreground">Inviting vs. Creating Profiles</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Currently, all profiles are created and managed by the account owner. Each profile
                        doesn&apos;t need its own SafePlay account or email address.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-muted/50 border border-border">
                      <p className="font-semibold text-foreground">What Family Members Need</p>
                      <ul className="mt-2 text-sm text-muted-foreground space-y-1">
                        <li>• Access to a device with the SafePlay extension</li>
                        <li>• Knowledge of which profile is theirs</li>
                        <li>• No separate login required</li>
                      </ul>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                    <p className="font-semibold text-foreground mb-2">Upgrading from Individual to Family</p>
                    <ol className="space-y-1 text-sm text-muted-foreground">
                      <li>1. Go to Billing</li>
                      <li>2. Click &quot;Change Plan&quot;</li>
                      <li>3. Select Family</li>
                      <li>4. Your existing profiles transfer automatically</li>
                      <li>5. You&apos;ll be charged the prorated difference</li>
                    </ol>
                  </div>
                </div>
              </article>
            </div>

            {/* Help CTA */}
            <div className="mt-12 p-6 rounded-2xl bg-muted/50 border border-border text-center">
              <p className="text-foreground font-medium">Questions about family features?</p>
              <p className="text-muted-foreground mt-1">
                <Link href="/contact" className="text-primary hover:underline">Contact our support team</Link>
                {" "}— we&apos;re happy to help.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

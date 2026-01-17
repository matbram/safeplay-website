import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { ArrowLeft, Users, UserPlus, Shield, Eye } from "lucide-react";

export const metadata = {
  title: "Family & Profiles - SafePlay Help Center",
  description: "Learn how to set up and manage family profiles and parental controls.",
};

const articles = [
  {
    id: "family-overview",
    title: "Family Profiles Overview",
    content: `Family profiles let you share one SafePlay subscription with your whole household while giving each person their own experience.

**What Each Profile Gets**
- Personal viewing history
- Individual filter preferences
- Custom word lists (configurable per profile)
- Separate watch progress

**Shared Resources**
- Monthly credit pool (all profiles share credits)
- Filtered video library (anyone can watch videos filtered by any profile)
- Subscription management (handled by the account owner)

**Profile Limits by Plan**
- Individual: Up to 3 profiles
- Family: Up to 10 profiles
- Organization: Unlimited profiles`,
  },
  {
    id: "create-profiles",
    title: "Creating Family Profiles",
    content: `Adding profiles for your family members is easy:

**Creating a New Profile**
1. Go to Family in your dashboard
2. Click "Add Profile"
3. Enter the profile name (e.g., "Emma" or "Kids TV")
4. Choose if this is a child profile (enables parental oversight)
5. Set their filter preferences
6. Click "Create Profile"

**Profile Types**
- **Adult profiles** — Full access, can see their own history only
- **Child profiles** — Parents can view their history and manage their settings

**Profile Switching**
On the extension or web app, click your profile icon and select a different profile to switch. Each profile's activity is tracked separately.

**Editing Profiles**
1. Go to Family
2. Click on the profile you want to edit
3. Make changes to name, type, or preferences
4. Save changes`,
  },
  {
    id: "parental-controls",
    title: "Setting Up Parental Controls",
    content: `Parental controls give you oversight of your children's viewing activity.

**Enabling Parental Controls**
1. When creating a profile, mark it as a "Child" profile
2. Or edit an existing profile and change its type to Child

**What Parents Can See**
- Complete viewing history for child profiles
- What videos they've filtered and watched
- When they watched (timestamps)
- How many credits they've used

**What Parents Can Control**
- Custom word list for each child's profile
- Filter mode (mute vs bleep)
- Ability to remove videos from their history

**Viewing Child Activity**
1. Go to Family
2. Click on a child profile
3. Select "View Activity"
4. See their complete viewing history

**Privacy Notes**
- Child profiles cannot see other profiles' activity
- Only account owners and designated parents can view child activity
- Children see their own history but not parental oversight activity`,
  },
  {
    id: "sharing-credits",
    title: "How Credit Sharing Works",
    content: `All profiles on your account share the same credit pool.

**The Shared Pool**
Your monthly credits, rollover credits, and top-up credits are all combined into one pool that any profile can use.

**Example**
- You have a Family plan (1,500 credits/month)
- Mom filters a 90-minute movie (90 credits)
- Dad filters a 45-minute documentary (45 credits)
- Kids filter various videos (200 credits)
- Remaining: 1,165 credits available for anyone

**Monitoring Usage**
1. Go to Family
2. View the "Credit Usage" section
3. See breakdown by profile

**Setting Limits (Coming Soon)**
We're working on the ability to set per-profile credit limits so you can control how many credits each family member can use per month.

**Tips for Managing Shared Credits**
- Review usage periodically in the Family dashboard
- Remind family members that re-watching is free
- Consider upgrading if you consistently run out`,
  },
  {
    id: "removing-profiles",
    title: "Removing or Archiving Profiles",
    content: `Sometimes you need to remove a profile from your account.

**Removing a Profile**
1. Go to Family
2. Click on the profile to remove
3. Click "Remove Profile"
4. Confirm the removal

**What Happens When Removed**
- The profile's viewing history is deleted
- Their custom word list is deleted
- Filtered videos remain accessible to other profiles
- Credits used by that profile are not refunded

**Archiving Instead**
If you might want the profile back later (e.g., a child going to college):
1. Edit the profile
2. Toggle "Archive Profile"
3. The profile becomes inactive but data is preserved
4. You can reactivate it anytime

**Transferring the Account Owner**
If the account owner needs to change:
1. Contact support
2. We'll verify both parties
3. Ownership can be transferred while preserving all profiles and history`,
  },
  {
    id: "family-billing",
    title: "Family Plan Billing",
    content: `The account owner manages all billing for the family.

**Who Pays**
Only the account owner is billed. Other family members don't need payment information.

**Inviting vs. Creating Profiles**
Currently, all profiles are created and managed by the account owner. Each profile doesn't need its own SafePlay account or email address.

**Upgrading from Individual to Family**
If you have an Individual plan and need more profiles:
1. Go to Billing
2. Click "Change Plan"
3. Select Family
4. Your existing profiles transfer automatically
5. You'll be charged the prorated difference

**What Family Members Need**
- Access to a device with the SafePlay extension installed
- Knowledge of which profile is theirs
- No separate login required (profiles are selected, not logged into)

**Future Enhancement**
We're working on the ability for family members to have their own logins that connect to your family account. Stay tuned!`,
  },
];

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
                {articles.map((article) => (
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
              {articles.map((article) => (
                <article
                  key={article.id}
                  id={article.id}
                  className="scroll-mt-24"
                >
                  <div className="p-8 rounded-2xl bg-card border border-border">
                    <h2 className="text-xl font-semibold text-foreground mb-4">
                      {article.title}
                    </h2>
                    <div className="prose prose-slate dark:prose-invert max-w-none text-muted-foreground">
                      {article.content.split('\n\n').map((paragraph, i) => {
                        if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                          return (
                            <h3 key={i} className="text-lg font-semibold text-foreground mt-6 mb-2 first:mt-0">
                              {paragraph.replace(/\*\*/g, '')}
                            </h3>
                          );
                        }
                        if (paragraph.startsWith('1.') || paragraph.startsWith('-')) {
                          const items = paragraph.split('\n').filter(Boolean);
                          const isNumbered = paragraph.startsWith('1.');
                          const ListTag = isNumbered ? 'ol' : 'ul';
                          return (
                            <ListTag key={i} className={`space-y-2 my-4 ${isNumbered ? 'list-decimal' : 'list-disc'} ml-5`}>
                              {items.map((item, j) => (
                                <li key={j}>
                                  {item.replace(/^\d+\.\s*/, '').replace(/^-\s*/, '').split('**').map((part, k) =>
                                    k % 2 === 1 ? <strong key={k} className="text-foreground">{part}</strong> : part
                                  )}
                                </li>
                              ))}
                            </ListTag>
                          );
                        }
                        return (
                          <p key={i} className="my-4">
                            {paragraph.split('**').map((part, k) =>
                              k % 2 === 1 ? <strong key={k} className="text-foreground">{part}</strong> : part
                            )}
                          </p>
                        );
                      })}
                    </div>
                  </div>
                </article>
              ))}
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

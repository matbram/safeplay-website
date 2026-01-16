# SafePlay Website - Complete Implementation Guide

## Project Overview

SafePlay is a YouTube profanity filtering SaaS platform. This document provides comprehensive guidance for building the complete web application that integrates with the existing Chrome extension and orchestration service.

### Existing Architecture (Already Built)
- **Chrome Extension**: TypeScript/Webpack - Injects into YouTube, handles mute/bleep filtering
- **Orchestration Service**: Node.js/Express - Coordinates downloads, transcription, caching
- **YT-DLP Service**: Python/FastAPI - Downloads videos via OxyLabs proxies
- **External Services**: Supabase, ElevenLabs (transcription), Stripe, OxyLabs

### Key Integration Point
The Chrome extension authenticates via the website using `chrome.runtime.onMessageExternal`. When a user logs in on the website, a token is passed to the extension via:
```typescript
// Website sends to extension
chrome.runtime.sendMessage(EXTENSION_ID, {
  type: 'AUTH_TOKEN',
  token: supabaseSession.access_token,
  userId: user.id,
  subscriptionTier: user.subscription_tier
});
```

---

## 1. Information Architecture

### Public Pages (No Auth Required)
```
/                     → Landing page with hero, features, pricing preview
/pricing              → Detailed plan comparison
/features             → Feature showcase with filtering demo
/about                → Company story, mission, values
/login                → Sign in form
/signup               → Registration with plan selection
/forgot-password      → Password reset request
/reset-password       → Password reset form (with token)
/verify-email         → Email verification handler
/privacy              → Privacy policy
/terms                → Terms of service
/contact              → Contact form
/help                 → Public FAQ/help center
```

### Authenticated Pages (Dashboard)
```
/dashboard            → Main hub: credit status, recent videos, quick actions
/filter               → Video filtering interface (paste URL, preview, filter)
/history              → All filtered videos with search/filter/export
/history/[videoId]    → Single video detail view
/billing              → Current plan, payment method, invoices, upgrade/downgrade
/billing/invoices     → Invoice history with PDF downloads
/settings             → Account settings hub
/settings/profile     → Name, email, avatar
/settings/security    → Password, 2FA
/settings/preferences → Default filter type, custom words, sensitivity
/settings/privacy     → Data retention, export, deletion
/settings/notifications → Email preferences
/family               → Family/team management (paid plans)
/family/[profileId]   → Individual profile management
/support              → Support ticket submission
/extension            → Extension auth bridge page (receives OAuth flow)
```

### Admin Pages (Staff Only)
```
/admin                → Admin dashboard
/admin/users          → User management
/admin/analytics      → Usage analytics
/admin/support        → Support ticket queue
```

---

## 2. User Flows

### Flow 1: New User Signup
```
Landing Page → Click "Get Started"
    ↓
Signup Page → Enter email, password
    ↓
Plan Selection → Choose Free/Individual/Family/Organization
    ↓
[If Paid] → Stripe Checkout → Payment processed
    ↓
Email Verification → Click link in email
    ↓
Dashboard → Account active, credits loaded
```

### Flow 2: Video Filtering (Web Interface)
```
Dashboard → Click "Filter Video" or navigate to /filter
    ↓
Paste YouTube URL → System fetches metadata
    ↓
Preview Shown → Title, thumbnail, duration, credit cost
    ↓
Select Filter Type → Mute or Bleep (+ custom words for paid)
    ↓
Click "Filter This Video"
    ↓
[If Cached] → Instant transcript returned
[If New] → Progress shown: Downloading → Transcribing → Complete
    ↓
Success → Credits deducted, added to history
    ↓
Options: View filtered video, filter another, go to history
```

### Flow 3: Chrome Extension Authentication
```
User visits /extension (or popup redirects there)
    ↓
If not logged in → Redirect to /login with return URL
    ↓
After login → Page detects extension presence
    ↓
Click "Connect Extension" → Website sends token via chrome.runtime.sendMessage
    ↓
Extension receives token → Stores in chrome.storage.local
    ↓
Success confirmation shown → User can close tab
```

### Flow 4: Plan Upgrade
```
Dashboard/Billing → Click "Upgrade Plan"
    ↓
Plan comparison modal → Select new plan
    ↓
[If upgrading] → Proration preview shown
    ↓
Stripe Checkout → Payment processed
    ↓
Webhook received → Database updated
    ↓
New credits added immediately → Dashboard reflects changes
```

### Flow 5: Family Profile Management
```
Dashboard → Click "Manage Profiles" (Family/Org plans only)
    ↓
Family page → See all profiles, credit usage breakdown
    ↓
Add Profile → Name, optional restrictions
    ↓
Profile created → Can be selected in extension
    ↓
Parent can view child's history, set restrictions
```

---

## 3. Page Structure Details

### Dashboard (`/dashboard`)
```
┌─────────────────────────────────────────────────────────────┐
│  Header: Logo | Filter Video | [User Avatar ▼]              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  [Filter Video Button - Large CTA]                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ Credit Status    │  │ Quick Stats      │                │
│  │ ▓▓▓▓▓░░░░░ 51%   │  │ 47 videos        │                │
│  │ 380 of 750 used  │  │ 823 minutes      │                │
│  │ 320 rollover     │  │ This month       │                │
│  │ Reset in 12 days │  │                  │                │
│  └──────────────────┘  └──────────────────┘                │
│                                                             │
│  Recent Videos                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [Thumb] Video Title | 45 min | 2 days ago | Rewatch │   │
│  │ [Thumb] Video Title | 12 min | 5 days ago | Rewatch │   │
│  │ [Thumb] Video Title | 8 min  | 1 week ago | Rewatch │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [View All History →]                                       │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [If Free Plan] Upgrade to unlock more credits       │   │
│  │ [Upgrade Now Button]                                 │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Filter Video (`/filter`)
```
┌─────────────────────────────────────────────────────────────┐
│  Header                                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Filter a YouTube Video                                     │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [Paste YouTube URL here...]                    [Go] │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [After URL entered - Video Preview Card]                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  [Thumbnail]     Video Title                        │   │
│  │                  Channel Name                       │   │
│  │                  Duration: 45:32                    │   │
│  │                  Credit Cost: 46 credits            │   │
│  │                                                     │   │
│  │  Filter Type:    ◉ Mute   ○ Bleep                   │   │
│  │                                                     │   │
│  │  [+ Custom Words] (Paid plans)                      │   │
│  │                                                     │   │
│  │  Your balance: 705 credits                          │   │
│  │  After filtering: 659 credits                       │   │
│  │                                                     │   │
│  │  [Filter This Video]                                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Processing State - if filtering]                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ▓▓▓▓▓▓▓░░░░░░░░░░░░ 35%                            │   │
│  │  Transcribing audio...                              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Video History (`/history`)
```
┌─────────────────────────────────────────────────────────────┐
│  Header                                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Your Video History                                         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [Search videos...]  [Date Range ▼]  [Filter Type ▼] │   │
│  │ Sort: [Most Recent ▼]                               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Statistics: 47 videos | 823 minutes | 823 credits used    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [✓] [Thumb] Video Title                             │   │
│  │            Duration: 45:32 | Jan 15, 2026           │   │
│  │            Credits: 46 | Type: Mute                 │   │
│  │            [Rewatch] [Details] [Delete]             │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ [✓] [Thumb] Another Video                           │   │
│  │            Duration: 12:15 | Jan 14, 2026           │   │
│  │            Credits: 13 | Type: Bleep                │   │
│  │            [Rewatch] [Details] [Delete]             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Export Selected as CSV]  [Delete Selected]                │
│                                                             │
│  Pagination: [← Prev] Page 1 of 5 [Next →]                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Billing (`/billing`)
```
┌─────────────────────────────────────────────────────────────┐
│  Header                                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Billing & Subscription                                     │
│                                                             │
│  Current Plan                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Individual Plan - $9.99/month                      │   │
│  │  750 credits/month | Up to 3 profiles               │   │
│  │  Next billing: January 28, 2026                     │   │
│  │  Amount: $9.99                                      │   │
│  │                                                     │   │
│  │  [Change Plan]  [Cancel Subscription]               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Payment Method                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  💳 Visa ending in 4242                             │   │
│  │  Expires 12/2027                                    │   │
│  │  [Update Payment Method]                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Recent Invoices                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Dec 28, 2025 | Individual Plan | $9.99 | [PDF]     │   │
│  │  Nov 28, 2025 | Individual Plan | $9.99 | [PDF]     │   │
│  │  Oct 28, 2025 | Individual Plan | $9.99 | [PDF]     │   │
│  └─────────────────────────────────────────────────────┘   │
│  [View All Invoices →]                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Settings - Preferences (`/settings/preferences`)
```
┌─────────────────────────────────────────────────────────────┐
│  Header                                                     │
├─────────────────────────────────────────────────────────────┤
│  Settings Sidebar    │  Filtering Preferences               │
│  ├ Profile           │                                      │
│  ├ Security          │  Default Filter Type                 │
│  ├ Preferences  ←    │  ◉ Mute (silence profanity)          │
│  ├ Privacy           │  ○ Bleep (replace with tone)         │
│  └ Notifications     │                                      │
│                      │  Sensitivity Level                   │
│                      │  [▓▓▓▓▓░░░░░] Moderate               │
│                      │  Low = only strong profanity         │
│                      │  High = mild language included       │
│                      │                                      │
│                      │  Custom Word Filter (Paid)           │
│                      │  ┌─────────────────────────────┐     │
│                      │  │ Add words SafePlay should   │     │
│                      │  │ filter in addition to our   │     │
│                      │  │ default list...             │     │
│                      │  │                             │     │
│                      │  │ [+ Add Word]                │     │
│                      │  │ • darn                 [×]  │     │
│                      │  │ • heck                 [×]  │     │
│                      │  └─────────────────────────────┘     │
│                      │                                      │
│                      │  Auto-save to History                │
│                      │  [✓] Automatically save all videos   │
│                      │                                      │
│                      │  [Save Preferences]                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Database Schema

### Core Tables

```sql
-- Users (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscription Plans
CREATE TABLE public.plans (
  id TEXT PRIMARY KEY, -- 'free', 'individual', 'family', 'organization'
  name TEXT NOT NULL,
  price_cents INTEGER NOT NULL, -- 999 = $9.99
  credits_per_month INTEGER NOT NULL,
  max_profiles INTEGER NOT NULL,
  features JSONB NOT NULL, -- { "custom_words": true, "priority_support": false }
  stripe_price_id TEXT, -- Stripe Price ID for paid plans
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Subscriptions
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES public.plans(id),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- active, canceled, past_due, paused
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Credit Ledger (tracks all credit transactions)
CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- positive = credit added, negative = credit used
  balance_after INTEGER NOT NULL,
  type TEXT NOT NULL, -- 'subscription_renewal', 'video_filter', 'rollover', 'adjustment', 'refund'
  description TEXT,
  video_id UUID REFERENCES public.videos(id),
  expires_at TIMESTAMPTZ, -- for rollover credits that expire
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Current Credit Balance (materialized view for fast lookups)
CREATE TABLE public.credit_balances (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  available_credits INTEGER NOT NULL DEFAULT 0,
  used_this_period INTEGER NOT NULL DEFAULT 0,
  rollover_credits INTEGER NOT NULL DEFAULT 0,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Videos (cached transcripts)
CREATE TABLE public.videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  channel_name TEXT,
  duration_seconds INTEGER NOT NULL,
  thumbnail_url TEXT,
  transcript JSONB, -- character-level timing data
  transcript_version INTEGER DEFAULT 1,
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed TIMESTAMPTZ DEFAULT NOW()
);

-- Filter History (user's filtered videos)
CREATE TABLE public.filter_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.family_profiles(id), -- which profile filtered this
  video_id UUID NOT NULL REFERENCES public.videos(id),
  filter_type TEXT NOT NULL, -- 'mute' or 'bleep'
  custom_words TEXT[], -- additional words filtered
  credits_used INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Family/Team Profiles
CREATE TABLE public.family_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  is_child BOOLEAN DEFAULT FALSE,
  restrictions JSONB, -- { "max_video_length": 30, "blocked_channels": [] }
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Preferences
CREATE TABLE public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  default_filter_type TEXT DEFAULT 'mute', -- 'mute' or 'bleep'
  sensitivity_level TEXT DEFAULT 'moderate', -- 'low', 'moderate', 'high'
  custom_words TEXT[] DEFAULT '{}',
  auto_save_history BOOLEAN DEFAULT TRUE,
  data_retention_days INTEGER DEFAULT 90, -- 30, 90, 180, or NULL for forever
  share_history_with_family BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification Preferences
CREATE TABLE public.notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  billing_alerts BOOLEAN DEFAULT TRUE,
  usage_alerts BOOLEAN DEFAULT TRUE,
  credit_low_threshold INTEGER DEFAULT 80, -- percent
  feature_updates BOOLEAN DEFAULT TRUE,
  marketing_emails BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices (synced from Stripe)
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT NOT NULL UNIQUE,
  amount_cents INTEGER NOT NULL,
  status TEXT NOT NULL, -- 'paid', 'open', 'void', 'uncollectible'
  invoice_pdf_url TEXT,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Support Tickets
CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  assigned_to UUID,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Indexes

```sql
-- Performance indexes
CREATE INDEX idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_created_at ON public.credit_transactions(created_at DESC);
CREATE INDEX idx_filter_history_user_id ON public.filter_history(user_id);
CREATE INDEX idx_filter_history_created_at ON public.filter_history(created_at DESC);
CREATE INDEX idx_videos_youtube_id ON public.videos(youtube_id);
CREATE INDEX idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX idx_family_profiles_owner_id ON public.family_profiles(owner_id);
```

### Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.filter_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own credits" ON public.credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own balance" ON public.credit_balances
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own history" ON public.filter_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own history" ON public.filter_history
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own family profiles" ON public.family_profiles
  FOR ALL USING (auth.uid() = owner_id);

-- Videos are shared (anyone authenticated can read cached transcripts)
CREATE POLICY "Authenticated users can view videos" ON public.videos
  FOR SELECT USING (auth.role() = 'authenticated');
```

---

## 5. API Endpoints

### Authentication
```
POST   /api/auth/signup          - Create account
POST   /api/auth/login           - Sign in
POST   /api/auth/logout          - Sign out
POST   /api/auth/forgot-password - Request password reset
POST   /api/auth/reset-password  - Reset password with token
POST   /api/auth/verify-email    - Verify email address
GET    /api/auth/session         - Get current session
POST   /api/auth/refresh         - Refresh access token
```

### User Profile
```
GET    /api/user/profile         - Get user profile
PATCH  /api/user/profile         - Update profile
POST   /api/user/change-password - Change password
DELETE /api/user/account         - Delete account and data
POST   /api/user/export-data     - Request data export (GDPR)
```

### Credits & Usage
```
GET    /api/credits/balance      - Get current credit balance
GET    /api/credits/transactions - Get credit transaction history
GET    /api/credits/usage        - Get usage statistics
```

### Video Filtering
```
POST   /api/filter/preview       - Get video metadata and cost preview
POST   /api/filter/start         - Start filtering a video
GET    /api/filter/status/:jobId - Check job status
GET    /api/filter/transcript/:youtubeId - Get cached transcript
```

### History
```
GET    /api/history              - Get filter history (paginated)
GET    /api/history/:id          - Get single history entry
DELETE /api/history/:id          - Delete history entry
DELETE /api/history              - Bulk delete history entries
GET    /api/history/export       - Export history as CSV
GET    /api/history/stats        - Get history statistics
```

### Billing
```
GET    /api/billing/subscription - Get current subscription
POST   /api/billing/checkout     - Create Stripe checkout session
POST   /api/billing/portal       - Create Stripe billing portal session
GET    /api/billing/invoices     - Get invoice history
GET    /api/billing/invoice/:id  - Get single invoice with PDF URL
POST   /api/billing/change-plan  - Preview plan change (proration)
```

### Preferences
```
GET    /api/preferences          - Get all preferences
PATCH  /api/preferences/filter   - Update filter preferences
PATCH  /api/preferences/notifications - Update notification preferences
PATCH  /api/preferences/privacy  - Update privacy preferences
```

### Family/Team
```
GET    /api/family/profiles      - Get family profiles
POST   /api/family/profiles      - Create family profile
PATCH  /api/family/profiles/:id  - Update family profile
DELETE /api/family/profiles/:id  - Delete family profile
GET    /api/family/usage         - Get usage breakdown by profile
```

### Extension Integration
```
GET    /api/extension/auth       - Get auth token for extension
POST   /api/extension/sync       - Sync preferences to extension
GET    /api/extension/preferences - Get preferences for extension
```

### Webhooks
```
POST   /api/webhooks/stripe      - Handle Stripe events
```

### Support
```
POST   /api/support/ticket       - Create support ticket
GET    /api/support/tickets      - Get user's tickets
GET    /api/support/ticket/:id   - Get ticket details
```

---

## 6. Component Breakdown

### Layout Components
```
components/
├── layout/
│   ├── Header.tsx              - Top nav bar with logo, nav, user menu
│   ├── Footer.tsx              - Site footer
│   ├── Sidebar.tsx             - Settings/admin sidebar navigation
│   ├── DashboardLayout.tsx     - Authenticated page wrapper
│   └── PublicLayout.tsx        - Public page wrapper
```

### Authentication Components
```
├── auth/
│   ├── LoginForm.tsx           - Email/password login
│   ├── SignupForm.tsx          - Registration form
│   ├── PlanSelector.tsx        - Plan selection during signup
│   ├── ForgotPasswordForm.tsx  - Password reset request
│   ├── ResetPasswordForm.tsx   - New password form
│   ├── EmailVerification.tsx   - Email verification handler
│   └── AuthProvider.tsx        - Auth context provider
```

### Dashboard Components
```
├── dashboard/
│   ├── CreditStatusCard.tsx    - Credit usage progress bar
│   ├── QuickStatsCard.tsx      - Video count, minutes, etc.
│   ├── RecentVideosCard.tsx    - Last 5 filtered videos
│   ├── UpgradePrompt.tsx       - CTA for free users
│   └── WelcomeHero.tsx         - Main filter video CTA
```

### Video Filtering Components
```
├── filter/
│   ├── VideoUrlInput.tsx       - URL input with validation
│   ├── VideoPreviewCard.tsx    - Thumbnail, title, cost preview
│   ├── FilterTypeSelector.tsx  - Mute/bleep toggle
│   ├── CustomWordsInput.tsx    - Custom word filter (paid)
│   ├── FilterProgress.tsx      - Processing progress bar
│   ├── FilterSuccess.tsx       - Success state with options
│   └── InsufficientCredits.tsx - Insufficient credits warning
```

### History Components
```
├── history/
│   ├── HistoryList.tsx         - Paginated video list
│   ├── HistoryItem.tsx         - Single video row
│   ├── HistoryFilters.tsx      - Search, date range, sort
│   ├── HistoryStats.tsx        - Summary statistics
│   ├── HistoryExport.tsx       - CSV export button
│   └── VideoDetailModal.tsx    - Full video details
```

### Billing Components
```
├── billing/
│   ├── CurrentPlanCard.tsx     - Plan name, price, next billing
│   ├── PaymentMethodCard.tsx   - Card on file
│   ├── InvoiceList.tsx         - Invoice history
│   ├── PlanComparisonModal.tsx - Upgrade/downgrade modal
│   ├── CancelSubscriptionModal.tsx - Cancellation flow
│   └── BillingAlertBanner.tsx  - Payment failed, etc.
```

### Settings Components
```
├── settings/
│   ├── ProfileForm.tsx         - Name, email, avatar
│   ├── PasswordChangeForm.tsx  - Current/new password
│   ├── TwoFactorSetup.tsx      - 2FA configuration
│   ├── FilterPreferencesForm.tsx - Default filter settings
│   ├── CustomWordsList.tsx     - Manage custom words
│   ├── PrivacySettings.tsx     - Data retention, export
│   ├── NotificationSettings.tsx - Email preferences
│   └── DeleteAccountModal.tsx  - Account deletion
```

### Family/Team Components
```
├── family/
│   ├── ProfileList.tsx         - Family member list
│   ├── ProfileCard.tsx         - Single profile card
│   ├── AddProfileModal.tsx     - Create profile form
│   ├── EditProfileModal.tsx    - Edit profile form
│   ├── UsageBreakdown.tsx      - Credits by profile
│   └── ParentalControls.tsx    - Restrictions for children
```

### Shared/UI Components
```
├── ui/
│   ├── Button.tsx              - Button variants
│   ├── Input.tsx               - Form inputs
│   ├── Card.tsx                - Card container
│   ├── Modal.tsx               - Modal dialog
│   ├── Toast.tsx               - Toast notifications
│   ├── Badge.tsx               - Status badges
│   ├── ProgressBar.tsx         - Progress indicator
│   ├── Skeleton.tsx            - Loading skeletons
│   ├── Table.tsx               - Data tables
│   ├── Pagination.tsx          - Pagination controls
│   ├── Avatar.tsx              - User avatars
│   ├── Dropdown.tsx            - Dropdown menus
│   └── Tooltip.tsx             - Tooltips
```

---

## 7. State Management

### Global State (React Context or Zustand)

```typescript
// stores/authStore.ts
interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

// stores/subscriptionStore.ts
interface SubscriptionState {
  subscription: Subscription | null;
  plan: Plan | null;
  isLoading: boolean;
  fetchSubscription: () => Promise<void>;
  updatePlan: (planId: string) => Promise<void>;
}

// stores/creditsStore.ts
interface CreditsState {
  balance: CreditBalance | null;
  isLoading: boolean;
  fetchBalance: () => Promise<void>;
  deductCredits: (amount: number, videoId: string) => void;
}

// stores/preferencesStore.ts
interface PreferencesState {
  preferences: UserPreferences | null;
  isLoading: boolean;
  fetchPreferences: () => Promise<void>;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
}
```

### Server State (TanStack Query / SWR)

```typescript
// Use React Query for server data that needs caching/revalidation
const { data: history, isLoading } = useQuery({
  queryKey: ['history', page, filters],
  queryFn: () => fetchHistory(page, filters),
});

const { data: invoices } = useQuery({
  queryKey: ['invoices'],
  queryFn: fetchInvoices,
});

// Mutations for updates
const filterMutation = useMutation({
  mutationFn: startFiltering,
  onSuccess: () => {
    queryClient.invalidateQueries(['credits']);
    queryClient.invalidateQueries(['history']);
  },
});
```

### State Flow Example

```
User clicks "Filter Video"
    ↓
filterMutation.mutate({ youtubeId, filterType })
    ↓
API returns jobId
    ↓
Poll useQuery for job status
    ↓
Job completes → credits deducted
    ↓
Invalidate 'credits' query → UI updates
Invalidate 'history' query → new entry appears
```

---

## 8. Error Handling

### Error Types

```typescript
// types/errors.ts
export enum ErrorCode {
  // Auth errors
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',

  // Credit errors
  INSUFFICIENT_CREDITS = 'INSUFFICIENT_CREDITS',
  CREDIT_LIMIT_REACHED = 'CREDIT_LIMIT_REACHED',

  // Video errors
  INVALID_VIDEO_URL = 'INVALID_VIDEO_URL',
  VIDEO_NOT_FOUND = 'VIDEO_NOT_FOUND',
  VIDEO_RESTRICTED = 'VIDEO_RESTRICTED',
  VIDEO_TOO_LONG = 'VIDEO_TOO_LONG',
  TRANSCRIPTION_FAILED = 'TRANSCRIPTION_FAILED',

  // Billing errors
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  SUBSCRIPTION_INACTIVE = 'SUBSCRIPTION_INACTIVE',

  // General errors
  RATE_LIMITED = 'RATE_LIMITED',
  SERVER_ERROR = 'SERVER_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
}
```

### Error Handling Patterns

```typescript
// Insufficient Credits
if (error.code === ErrorCode.INSUFFICIENT_CREDITS) {
  showModal({
    title: "Not Enough Credits",
    message: `This video requires ${cost} credits, but you only have ${balance}. Upgrade your plan for more credits.`,
    actions: [
      { label: "Upgrade Plan", onClick: () => navigate('/billing') },
      { label: "Cancel", onClick: close }
    ]
  });
}

// Video Restricted (age-restricted)
if (error.code === ErrorCode.VIDEO_RESTRICTED) {
  showToast({
    type: 'error',
    message: "This video is age-restricted and cannot be filtered. Try a different video."
  });
}

// Payment Failed
if (error.code === ErrorCode.PAYMENT_FAILED) {
  showBanner({
    type: 'warning',
    message: "Your payment failed. Please update your payment method to continue using SafePlay.",
    action: { label: "Update Payment", href: '/billing' }
  });
}

// Session Expired
if (error.code === ErrorCode.SESSION_EXPIRED) {
  clearAuth();
  navigate('/login?returnTo=' + encodeURIComponent(currentPath));
}
```

### User-Friendly Error Messages

```typescript
const errorMessages: Record<ErrorCode, string> = {
  [ErrorCode.INVALID_CREDENTIALS]: "The email or password you entered is incorrect.",
  [ErrorCode.EMAIL_NOT_VERIFIED]: "Please verify your email before logging in. Check your inbox for the verification link.",
  [ErrorCode.INSUFFICIENT_CREDITS]: "You don't have enough credits to filter this video.",
  [ErrorCode.INVALID_VIDEO_URL]: "Please enter a valid YouTube URL.",
  [ErrorCode.VIDEO_NOT_FOUND]: "We couldn't find this video. It may have been removed or made private.",
  [ErrorCode.VIDEO_RESTRICTED]: "This video is age-restricted and cannot be filtered.",
  [ErrorCode.VIDEO_TOO_LONG]: "This video exceeds the maximum length for your plan.",
  [ErrorCode.TRANSCRIPTION_FAILED]: "We had trouble processing this video. Please try again.",
  [ErrorCode.PAYMENT_FAILED]: "Your payment couldn't be processed. Please check your payment method.",
  [ErrorCode.RATE_LIMITED]: "You're making too many requests. Please wait a moment and try again.",
  [ErrorCode.SERVER_ERROR]: "Something went wrong on our end. Please try again later.",
  [ErrorCode.NETWORK_ERROR]: "We couldn't connect to the server. Please check your internet connection.",
};
```

---

## 9. Edge Cases

### Credit Management Edge Cases

1. **Concurrent requests depleting credits**
   - Use database transactions with row-level locking
   - Check balance immediately before deduction
   - Return error if insufficient mid-transaction

2. **Mid-cycle plan upgrade**
   - Calculate prorated credits based on days remaining
   - Add new plan credits immediately
   - Update billing cycle end date

3. **Plan downgrade**
   - Show warning about credit reduction
   - Effective at next billing cycle
   - Current credits remain until period end

4. **Rollover credits expiring**
   - Track expiration date per credit batch
   - Use FIFO (oldest credits first)
   - Notify users before expiration

5. **Failed transcription after credit deduction**
   - Automatically refund credits
   - Log the refund transaction
   - Notify user

### Family/Team Edge Cases

1. **Family member uses all credits**
   - Show usage breakdown to owner
   - Optional: Set per-profile credit limits
   - Notify owner when 80% used

2. **Removing family member**
   - Their history remains (owned by account owner)
   - Preferences deleted
   - Immediately revoke access

3. **Child profile restrictions**
   - Check video metadata against restrictions
   - Block videos from blocked channels
   - Enforce max video length

### Billing Edge Cases

1. **Payment retry logic**
   - Stripe handles automatic retries
   - After 4 failures, pause subscription
   - Send escalating notifications

2. **Subscription canceled mid-period**
   - Keep access until period end
   - No refund for partial month
   - Clear recurring billing

3. **Webhook delivery failure**
   - Stripe retries for 72 hours
   - Implement idempotent handlers
   - Reconcile on user login

### Video Processing Edge Cases

1. **Duplicate concurrent requests (same video)**
   - Orchestration service handles with database locking
   - Second request waits for first to complete
   - Both receive same transcript

2. **Very long videos (>3 hours)**
   - Calculate credit cost upfront
   - Warn user before processing
   - Consider plan-based limits

3. **Video taken down during processing**
   - Return appropriate error
   - Refund credits if partially processed
   - Log for support investigation

4. **User closes browser during processing**
   - Processing continues server-side
   - Credits deducted on completion
   - Video appears in history when user returns

---

## 10. Prioritization

### Phase 1: MVP (Critical for Launch)
1. Authentication (signup, login, email verification, password reset)
2. Basic dashboard with credit status
3. Video filtering interface (paste URL, filter, view result)
4. Credit deduction and balance tracking
5. Basic video history
6. Stripe integration (checkout, basic subscription management)
7. Chrome extension authentication bridge
8. User preferences (filter type, custom words)

### Phase 2: Core Features
1. Billing portal (upgrade, downgrade, cancel, invoices)
2. Advanced history (search, filter, export)
3. Notification preferences
4. Usage statistics and analytics
5. Profile settings (name, avatar)
6. Password change and security settings

### Phase 3: Enhanced Features
1. Family profiles (Individual plan: 3 profiles)
2. Credit rollover tracking and expiration
3. Two-factor authentication
4. Data export (GDPR compliance)
5. Support ticket system

### Phase 4: Advanced Features
1. Family plan features (10 profiles, parental controls)
2. Organization plan features (team management, permissions)
3. Admin dashboard
4. Advanced analytics
5. Dark mode

---

## 11. Chrome Extension Integration

### Authentication Flow

```typescript
// In website: /app/extension/page.tsx
'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

const EXTENSION_ID = process.env.NEXT_PUBLIC_EXTENSION_ID;

export default function ExtensionAuthPage() {
  const { user, session, subscription } = useAuth();

  useEffect(() => {
    if (user && session && EXTENSION_ID) {
      // Send auth token to extension
      chrome.runtime.sendMessage(EXTENSION_ID, {
        type: 'AUTH_TOKEN',
        token: session.access_token,
        refreshToken: session.refresh_token,
        userId: user.id,
        email: user.email,
        subscriptionTier: subscription?.plan_id || 'free',
        expiresAt: session.expires_at,
      }, (response) => {
        if (response?.success) {
          // Show success message
          setStatus('connected');
        } else {
          setStatus('error');
        }
      });
    }
  }, [user, session, subscription]);

  return (
    <div>
      {status === 'connected' && (
        <p>Extension connected! You can close this tab.</p>
      )}
      {status === 'error' && (
        <p>Failed to connect. Make sure the SafePlay extension is installed.</p>
      )}
    </div>
  );
}
```

### Preference Sync

```typescript
// API endpoint: /api/extension/preferences
export async function GET(request: Request) {
  const user = await getAuthenticatedUser(request);

  const preferences = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return Response.json({
    filterType: preferences.default_filter_type,
    sensitivity: preferences.sensitivity_level,
    customWords: preferences.custom_words,
    autoSave: preferences.auto_save_history,
  });
}
```

### Extension Manifest Requirements

The extension needs these permissions to communicate with the website:
```json
{
  "externally_connectable": {
    "matches": ["https://safeplay.app/*"]
  },
  "permissions": ["storage"],
  "host_permissions": [
    "https://safeplay.app/*",
    "https://api.safeplay.app/*"
  ]
}
```

---

## 12. Technology Stack Summary

```
Framework:        Next.js 14+ (App Router)
Language:         TypeScript
Styling:          Tailwind CSS + shadcn/ui
Authentication:   Supabase Auth
Database:         Supabase PostgreSQL
Payments:         Stripe
State Management: Zustand (global) + TanStack Query (server)
Form Handling:    React Hook Form + Zod
HTTP Client:      Native fetch / Supabase client
Deployment:       Railway (Docker)
Email:            Resend or Supabase built-in
Monitoring:       Sentry (errors) + Posthog (analytics)
```

### Project Structure

```
safeplay-website/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   ├── reset-password/page.tsx
│   │   └── verify-email/page.tsx
│   ├── (dashboard)/
│   │   ├── dashboard/page.tsx
│   │   ├── filter/page.tsx
│   │   ├── history/page.tsx
│   │   ├── billing/page.tsx
│   │   ├── settings/
│   │   │   ├── page.tsx
│   │   │   ├── profile/page.tsx
│   │   │   ├── security/page.tsx
│   │   │   ├── preferences/page.tsx
│   │   │   ├── privacy/page.tsx
│   │   │   └── notifications/page.tsx
│   │   └── family/page.tsx
│   ├── (public)/
│   │   ├── page.tsx (landing)
│   │   ├── pricing/page.tsx
│   │   ├── features/page.tsx
│   │   └── about/page.tsx
│   ├── api/
│   │   ├── auth/
│   │   ├── user/
│   │   ├── credits/
│   │   ├── filter/
│   │   ├── history/
│   │   ├── billing/
│   │   ├── preferences/
│   │   ├── family/
│   │   ├── extension/
│   │   └── webhooks/
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── layout/
│   ├── auth/
│   ├── dashboard/
│   ├── filter/
│   ├── history/
│   ├── billing/
│   ├── settings/
│   ├── family/
│   └── ui/
├── hooks/
│   ├── useAuth.ts
│   ├── useSubscription.ts
│   ├── useCredits.ts
│   ├── usePreferences.ts
│   └── useHistory.ts
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── stripe/
│   │   ├── client.ts
│   │   └── webhooks.ts
│   └── utils.ts
├── stores/
│   ├── authStore.ts
│   ├── subscriptionStore.ts
│   └── creditsStore.ts
├── types/
│   ├── database.ts
│   ├── api.ts
│   └── errors.ts
├── middleware.ts
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## Summary

This implementation guide provides a comprehensive blueprint for building the SafePlay website. The key integration points with the existing Chrome extension are:

1. **Authentication Bridge**: Website page that sends tokens to the extension via `chrome.runtime.sendMessage`
2. **Preference Sync**: API endpoint for the extension to fetch user preferences
3. **Shared Backend**: Both website and extension communicate with the same orchestration service
4. **Unified Credit System**: Credits tracked in Supabase, deducted by orchestration service, displayed by website

The MVP should focus on authentication, basic filtering via web UI, credit tracking, and the extension auth bridge. Advanced features like family profiles, parental controls, and admin dashboards can be added incrementally.

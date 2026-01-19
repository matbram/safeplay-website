-- ============================================================================
-- SafePlay Database Schema for Supabase
-- ============================================================================
-- Copy and paste this entire file into Supabase SQL Editor and run it.
-- This creates all tables, indexes, RLS policies, functions, and seed data.
-- ============================================================================

-- ============================================================================
-- 1. TABLES
-- ============================================================================

-- Users (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscription Plans
CREATE TABLE IF NOT EXISTS public.plans (
  id TEXT PRIMARY KEY, -- 'free', 'individual', 'family', 'organization'
  name TEXT NOT NULL,
  price_cents INTEGER NOT NULL, -- 999 = $9.99
  credits_per_month INTEGER NOT NULL,
  max_profiles INTEGER NOT NULL,
  features JSONB NOT NULL DEFAULT '{}', -- { "custom_words": true, "priority_support": false }
  stripe_price_id TEXT, -- Stripe Price ID for paid plans
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
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

-- Videos (cached transcripts)
CREATE TABLE IF NOT EXISTS public.videos (
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

-- Family/Team Profiles
CREATE TABLE IF NOT EXISTS public.family_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  is_child BOOLEAN DEFAULT FALSE,
  restrictions JSONB, -- { "max_video_length": 30, "blocked_channels": [] }
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credit Ledger (tracks all credit transactions)
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- positive = credit added, negative = credit used
  balance_after INTEGER NOT NULL,
  type TEXT NOT NULL, -- 'subscription_renewal', 'video_filter', 'rollover', 'adjustment', 'refund', 'topup'
  description TEXT,
  video_id UUID REFERENCES public.videos(id),
  expires_at TIMESTAMPTZ, -- for rollover credits that expire
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Current Credit Balance (for fast lookups)
CREATE TABLE IF NOT EXISTS public.credit_balances (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  available_credits INTEGER NOT NULL DEFAULT 0,
  used_this_period INTEGER NOT NULL DEFAULT 0,
  rollover_credits INTEGER NOT NULL DEFAULT 0,
  topup_credits INTEGER NOT NULL DEFAULT 0, -- never expire
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Filter History (user's filtered videos)
CREATE TABLE IF NOT EXISTS public.filter_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.family_profiles(id), -- which profile filtered this
  video_id UUID NOT NULL REFERENCES public.videos(id),
  filter_type TEXT NOT NULL, -- 'mute' or 'bleep'
  custom_words TEXT[], -- additional words filtered
  credits_used INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Preferences
CREATE TABLE IF NOT EXISTS public.user_preferences (
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
CREATE TABLE IF NOT EXISTS public.notification_preferences (
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
CREATE TABLE IF NOT EXISTS public.invoices (
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
CREATE TABLE IF NOT EXISTS public.support_tickets (
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

-- ============================================================================
-- 2. INDEXES (for performance)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON public.credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_filter_history_user_id ON public.filter_history(user_id);
CREATE INDEX IF NOT EXISTS idx_filter_history_created_at ON public.filter_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_filter_history_video_id ON public.filter_history(video_id);
CREATE INDEX IF NOT EXISTS idx_videos_youtube_id ON public.videos(youtube_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_family_profiles_owner_id ON public.family_profiles(owner_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON public.subscriptions(stripe_customer_id);

-- ============================================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================================================

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
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Plans are public (anyone can view)
CREATE POLICY "Plans are viewable by everyone" ON public.plans
  FOR SELECT USING (true);

-- Videos are viewable by authenticated users
CREATE POLICY "Authenticated users can view videos" ON public.videos
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow service role to insert/update videos
CREATE POLICY "Service role can manage videos" ON public.videos
  FOR ALL USING (auth.role() = 'service_role');

-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Subscriptions
CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions" ON public.subscriptions
  FOR ALL USING (auth.role() = 'service_role');

-- Credit Transactions
CREATE POLICY "Users can view own credit transactions" ON public.credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage credit transactions" ON public.credit_transactions
  FOR ALL USING (auth.role() = 'service_role');

-- Credit Balances
CREATE POLICY "Users can view own balance" ON public.credit_balances
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage balances" ON public.credit_balances
  FOR ALL USING (auth.role() = 'service_role');

-- Filter History
CREATE POLICY "Users can view own history" ON public.filter_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own history" ON public.filter_history
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own history" ON public.filter_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage history" ON public.filter_history
  FOR ALL USING (auth.role() = 'service_role');

-- Family Profiles
CREATE POLICY "Users can view own family profiles" ON public.family_profiles
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can manage own family profiles" ON public.family_profiles
  FOR ALL USING (auth.uid() = owner_id);

-- User Preferences
CREATE POLICY "Users can view own preferences" ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own preferences" ON public.user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Notification Preferences
CREATE POLICY "Users can view own notification preferences" ON public.notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own notification preferences" ON public.notification_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Invoices
CREATE POLICY "Users can view own invoices" ON public.invoices
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage invoices" ON public.invoices
  FOR ALL USING (auth.role() = 'service_role');

-- Support Tickets
CREATE POLICY "Users can view own tickets" ON public.support_tickets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create tickets" ON public.support_tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Service role can manage tickets" ON public.support_tickets
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- 4. FUNCTIONS
-- ============================================================================

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );

  -- Create subscription (free plan)
  INSERT INTO public.subscriptions (user_id, plan_id, status, current_period_start, current_period_end)
  VALUES (
    NEW.id,
    'free',
    'active',
    NOW(),
    NOW() + INTERVAL '1 month'
  );

  -- Create credit balance (30 free credits)
  INSERT INTO public.credit_balances (user_id, available_credits, used_this_period, rollover_credits, topup_credits, period_start, period_end)
  VALUES (
    NEW.id,
    30,
    0,
    0,
    0,
    NOW(),
    NOW() + INTERVAL '1 month'
  );

  -- Create initial credit transaction
  INSERT INTO public.credit_transactions (user_id, amount, balance_after, type, description)
  VALUES (
    NEW.id,
    30,
    30,
    'subscription_renewal',
    'Free plan monthly credits'
  );

  -- Create default preferences
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id);

  -- Create default notification preferences
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run on new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to deduct credits
CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_video_id UUID,
  p_description TEXT DEFAULT NULL
)
RETURNS TABLE (success BOOLEAN, new_balance INTEGER, error_message TEXT) AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Get current balance with row lock
  SELECT available_credits INTO v_current_balance
  FROM public.credit_balances
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_current_balance IS NULL THEN
    RETURN QUERY SELECT FALSE, 0, 'User not found'::TEXT;
    RETURN;
  END IF;

  IF v_current_balance < p_amount THEN
    RETURN QUERY SELECT FALSE, v_current_balance, 'Insufficient credits'::TEXT;
    RETURN;
  END IF;

  v_new_balance := v_current_balance - p_amount;

  -- Update balance
  UPDATE public.credit_balances
  SET
    available_credits = v_new_balance,
    used_this_period = used_this_period + p_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Record transaction
  INSERT INTO public.credit_transactions (user_id, amount, balance_after, type, description, video_id)
  VALUES (p_user_id, -p_amount, v_new_balance, 'video_filter', p_description, p_video_id);

  RETURN QUERY SELECT TRUE, v_new_balance, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add credits
CREATE OR REPLACE FUNCTION public.add_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_type TEXT,
  p_description TEXT DEFAULT NULL,
  p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (success BOOLEAN, new_balance INTEGER, error_message TEXT) AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Get current balance with row lock
  SELECT available_credits INTO v_current_balance
  FROM public.credit_balances
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_current_balance IS NULL THEN
    RETURN QUERY SELECT FALSE, 0, 'User not found'::TEXT;
    RETURN;
  END IF;

  v_new_balance := v_current_balance + p_amount;

  -- Update balance
  UPDATE public.credit_balances
  SET
    available_credits = v_new_balance,
    topup_credits = CASE WHEN p_type = 'topup' THEN topup_credits + p_amount ELSE topup_credits END,
    rollover_credits = CASE WHEN p_type = 'rollover' THEN rollover_credits + p_amount ELSE rollover_credits END,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Record transaction
  INSERT INTO public.credit_transactions (user_id, amount, balance_after, type, description, expires_at)
  VALUES (p_user_id, p_amount, v_new_balance, p_type, p_description, p_expires_at);

  RETURN QUERY SELECT TRUE, v_new_balance, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset credits on subscription renewal
CREATE OR REPLACE FUNCTION public.reset_credits_on_renewal(
  p_user_id UUID,
  p_new_credits INTEGER
)
RETURNS VOID AS $$
DECLARE
  v_current_balance RECORD;
  v_rollover INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Get current balance
  SELECT * INTO v_current_balance
  FROM public.credit_balances
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Calculate rollover (unused credits from this period, max 12 months)
  v_rollover := GREATEST(0, v_current_balance.available_credits - v_current_balance.topup_credits);

  -- New balance = new credits + rollover + topup credits
  v_new_balance := p_new_credits + v_rollover + v_current_balance.topup_credits;

  -- Update balance
  UPDATE public.credit_balances
  SET
    available_credits = v_new_balance,
    used_this_period = 0,
    rollover_credits = v_rollover,
    period_start = NOW(),
    period_end = NOW() + INTERVAL '1 month',
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Record renewal transaction
  INSERT INTO public.credit_transactions (user_id, amount, balance_after, type, description)
  VALUES (p_user_id, p_new_credits, v_new_balance, 'subscription_renewal', 'Monthly credit allocation');

  -- Record rollover transaction if applicable
  IF v_rollover > 0 THEN
    INSERT INTO public.credit_transactions (user_id, amount, balance_after, type, description, expires_at)
    VALUES (p_user_id, 0, v_new_balance, 'rollover', 'Rollover from previous period: ' || v_rollover || ' credits', NOW() + INTERVAL '12 months');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update subscription plan
CREATE OR REPLACE FUNCTION public.update_subscription_plan(
  p_user_id UUID,
  p_new_plan_id TEXT,
  p_stripe_customer_id TEXT DEFAULT NULL,
  p_stripe_subscription_id TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_plan RECORD;
  v_current_balance INTEGER;
BEGIN
  -- Get new plan details
  SELECT * INTO v_plan FROM public.plans WHERE id = p_new_plan_id;

  -- Update subscription
  UPDATE public.subscriptions
  SET
    plan_id = p_new_plan_id,
    stripe_customer_id = COALESCE(p_stripe_customer_id, stripe_customer_id),
    stripe_subscription_id = COALESCE(p_stripe_subscription_id, stripe_subscription_id),
    status = 'active',
    current_period_start = NOW(),
    current_period_end = NOW() + INTERVAL '1 month',
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Add new plan credits
  SELECT available_credits INTO v_current_balance
  FROM public.credit_balances WHERE user_id = p_user_id;

  UPDATE public.credit_balances
  SET
    available_credits = v_current_balance + v_plan.credits_per_month,
    period_start = NOW(),
    period_end = NOW() + INTERVAL '1 month',
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Record transaction
  INSERT INTO public.credit_transactions (user_id, amount, balance_after, type, description)
  VALUES (p_user_id, v_plan.credits_per_month, v_current_balance + v_plan.credits_per_month, 'subscription_renewal', 'Upgraded to ' || v_plan.name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. SEED DATA
-- ============================================================================

-- Insert plans (upsert to avoid duplicates)
INSERT INTO public.plans (id, name, price_cents, credits_per_month, max_profiles, features, stripe_price_id)
VALUES
  ('free', 'Free', 0, 30, 1, '{"custom_words": false, "priority_support": false}', NULL),
  ('individual', 'Individual', 999, 750, 3, '{"custom_words": true, "priority_support": false}', NULL),
  ('family', 'Family', 1999, 1500, 10, '{"custom_words": true, "priority_support": true, "parental_controls": true}', NULL),
  ('organization', 'Organization', 4999, 3750, -1, '{"custom_words": true, "priority_support": true, "parental_controls": true, "admin_dashboard": true}', NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price_cents = EXCLUDED.price_cents,
  credits_per_month = EXCLUDED.credits_per_month,
  max_profiles = EXCLUDED.max_profiles,
  features = EXCLUDED.features;

-- ============================================================================
-- 6. STORAGE BUCKETS (optional - for avatars)
-- ============================================================================

-- Create a storage bucket for avatars (run this in Supabase Dashboard > Storage)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- ============================================================================
-- DONE!
-- ============================================================================
-- Your database is now set up. Remember to:
-- 1. Update your .env.local with Supabase credentials
-- 2. Enable Google OAuth in Supabase Dashboard > Authentication > Providers
-- 3. Update the Stripe price IDs in the plans table after creating them in Stripe
-- ============================================================================

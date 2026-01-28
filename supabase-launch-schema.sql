-- ============================================================================
-- SafePlay Launch Mode & Lead Collection Schema
-- ============================================================================
-- Run this in Supabase SQL Editor to add launch mode and lead collection tables.
-- ============================================================================

-- ============================================================================
-- 1. TABLES
-- ============================================================================

-- Site Settings (for global configuration like launch mode)
CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES public.profiles(id)
);

-- Email Leads (for pre-launch signups)
CREATE TABLE IF NOT EXISTS public.email_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  source TEXT DEFAULT 'landing_page', -- where the signup came from
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}', -- additional info like referrer, utm params
  notified_at TIMESTAMPTZ, -- when they were notified about launch
  converted_at TIMESTAMPTZ, -- when they signed up as a user
  user_id UUID REFERENCES public.profiles(id) -- link to user if they converted
);

-- ============================================================================
-- 2. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_email_leads_email ON public.email_leads(email);
CREATE INDEX IF NOT EXISTS idx_email_leads_subscribed_at ON public.email_leads(subscribed_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_leads_source ON public.email_leads(source);

-- ============================================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on tables
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_leads ENABLE ROW LEVEL SECURITY;

-- Site settings are readable by everyone (for launch mode check)
CREATE POLICY "Site settings are viewable by everyone" ON public.site_settings
  FOR SELECT USING (true);

-- Only service role can manage site settings
CREATE POLICY "Service role can manage site settings" ON public.site_settings
  FOR ALL USING (auth.role() = 'service_role');

-- Anyone can insert email leads (for signups)
CREATE POLICY "Anyone can subscribe to email leads" ON public.email_leads
  FOR INSERT WITH CHECK (true);

-- Only service role can view/manage email leads
CREATE POLICY "Service role can manage email leads" ON public.email_leads
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- 4. SEED DATA
-- ============================================================================

-- Initialize launch mode setting (default to pre-launch mode = true)
INSERT INTO public.site_settings (key, value)
VALUES ('launch_mode', '{"is_pre_launch": true, "allow_signups": false}')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- DONE!
-- ============================================================================
-- After running this:
-- 1. The site will be in pre-launch mode by default
-- 2. Users will see the landing page and can submit their email
-- 3. Admins can toggle launch mode from the admin dashboard
-- ============================================================================

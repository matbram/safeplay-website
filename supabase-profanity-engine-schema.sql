-- ============================================================================
-- SafePlay Profanity Engine - Database Schema
-- ============================================================================
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- This creates the profanity bucket system tables, seeds initial data,
-- and sets up RLS policies.
-- ============================================================================

-- ============================================================================
-- 1. TABLES
-- ============================================================================

-- Canonical profanity buckets (the base concepts users toggle on/off)
CREATE TABLE IF NOT EXISTS public.profanity_buckets (
  id TEXT PRIMARY KEY,                    -- e.g., 'damn', 'ass', 'fuck'
  label TEXT NOT NULL,                    -- User-facing display name e.g., 'D-word (Damn)'
  severity TEXT NOT NULL CHECK (severity IN ('mild', 'moderate', 'severe', 'religious')),
  default_blocked BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Known profanity variants (grows over time via AI discovery)
-- Each variant maps a surface form to one or more buckets
CREATE TABLE IF NOT EXISTS public.profanity_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant TEXT NOT NULL,                  -- The surface form e.g., 'dammit', 'dayum', 'goddamn'
  bucket_id TEXT NOT NULL REFERENCES public.profanity_buckets(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'dictionary' CHECK (source IN ('dictionary', 'ai_discovered')),
  confidence REAL NOT NULL DEFAULT 1.0 CHECK (confidence >= 0 AND confidence <= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(variant, bucket_id)              -- A variant can map to a bucket only once
);

-- Per-video profanity classification results (cached per video)
CREATE TABLE IF NOT EXISTS public.video_profanity_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_id TEXT NOT NULL,               -- References the video (by youtube_id for cross-service compat)
  timestamp_start REAL NOT NULL,          -- Start time in seconds
  timestamp_end REAL NOT NULL,            -- End time in seconds
  surface_form TEXT NOT NULL,             -- The word as it appeared in the transcript
  bucket_ids TEXT[] NOT NULL,             -- Array of bucket IDs this word belongs to
  confidence REAL NOT NULL DEFAULT 1.0,   -- Classification confidence (1.0 = dictionary match, <1.0 = AI)
  source TEXT NOT NULL DEFAULT 'dictionary' CHECK (source IN ('dictionary', 'ai_discovered')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User bucket preferences (which buckets each user wants blocked)
CREATE TABLE IF NOT EXISTS public.user_bucket_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bucket_id TEXT NOT NULL REFERENCES public.profanity_buckets(id) ON DELETE CASCADE,
  blocked BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, bucket_id)
);

-- ============================================================================
-- 2. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profanity_variants_variant ON public.profanity_variants(variant);
CREATE INDEX IF NOT EXISTS idx_profanity_variants_bucket_id ON public.profanity_variants(bucket_id);
CREATE INDEX IF NOT EXISTS idx_video_profanity_map_youtube_id ON public.video_profanity_map(youtube_id);
CREATE INDEX IF NOT EXISTS idx_video_profanity_map_bucket_ids ON public.video_profanity_map USING gin(bucket_ids);
CREATE INDEX IF NOT EXISTS idx_user_bucket_preferences_user_id ON public.user_bucket_preferences(user_id);

-- ============================================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.profanity_buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profanity_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_profanity_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_bucket_preferences ENABLE ROW LEVEL SECURITY;

-- Profanity buckets: readable by all authenticated users, writable by service role only
CREATE POLICY "Authenticated users can view profanity buckets"
  ON public.profanity_buckets FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can manage profanity buckets"
  ON public.profanity_buckets FOR ALL
  USING (auth.role() = 'service_role');

-- Profanity variants: readable by all authenticated users, writable by service role only
CREATE POLICY "Authenticated users can view profanity variants"
  ON public.profanity_variants FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can manage profanity variants"
  ON public.profanity_variants FOR ALL
  USING (auth.role() = 'service_role');

-- Video profanity map: readable by all authenticated users, writable by service role only
CREATE POLICY "Authenticated users can view video profanity map"
  ON public.video_profanity_map FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can manage video profanity map"
  ON public.video_profanity_map FOR ALL
  USING (auth.role() = 'service_role');

-- User bucket preferences: users can only read/write their own
CREATE POLICY "Users can view own bucket preferences"
  ON public.user_bucket_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bucket preferences"
  ON public.user_bucket_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bucket preferences"
  ON public.user_bucket_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bucket preferences"
  ON public.user_bucket_preferences FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage user bucket preferences"
  ON public.user_bucket_preferences FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- 4. FUNCTIONS
-- ============================================================================

-- Function to initialize default bucket preferences for a new user
-- Called by the existing handle_new_user() trigger or manually
CREATE OR REPLACE FUNCTION public.initialize_bucket_preferences(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.user_bucket_preferences (user_id, bucket_id, blocked)
  SELECT p_user_id, id, default_blocked
  FROM public.profanity_buckets
  ON CONFLICT (user_id, bucket_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get the full profanity map for a video (used by extension/website)
CREATE OR REPLACE FUNCTION public.get_video_profanity_for_user(
  p_youtube_id TEXT,
  p_user_id UUID
)
RETURNS TABLE (
  timestamp_start REAL,
  timestamp_end REAL,
  surface_form TEXT,
  bucket_ids TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    vpm.timestamp_start,
    vpm.timestamp_end,
    vpm.surface_form,
    vpm.bucket_ids
  FROM public.video_profanity_map vpm
  WHERE vpm.youtube_id = p_youtube_id
    AND vpm.bucket_ids && (
      SELECT ARRAY_AGG(ubp.bucket_id)
      FROM public.user_bucket_preferences ubp
      WHERE ubp.user_id = p_user_id AND ubp.blocked = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. UPDATE EXISTING handle_new_user() TO INCLUDE BUCKET PREFERENCES
-- ============================================================================

-- Re-create the trigger function to also initialize bucket preferences
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

  -- Initialize default bucket preferences
  PERFORM public.initialize_bucket_preferences(NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. SEED DATA - Canonical Profanity Buckets
-- ============================================================================

INSERT INTO public.profanity_buckets (id, label, severity, default_blocked, display_order) VALUES
  ('fuck',          'F-word',                  'severe',    true,  1),
  ('shit',          'S-word (Shit)',            'moderate',  true,  2),
  ('ass',           'A-word (Ass)',             'moderate',  true,  3),
  ('bitch',         'B-word (Bitch)',           'moderate',  true,  4),
  ('damn',          'Damn',                     'mild',      false, 5),
  ('hell',          'Hell',                     'mild',      false, 6),
  ('crap',          'Crap',                     'mild',      false, 7),
  ('piss',          'Piss',                     'mild',      false, 8),
  ('dick',          'D-word (Dick)',            'moderate',  true,  9),
  ('cock',          'C-word (Cock)',            'moderate',  true,  10),
  ('pussy',         'P-word (Pussy)',           'moderate',  true,  11),
  ('bastard',       'Bastard',                  'moderate',  true,  12),
  ('slut',          'Slut',                     'moderate',  true,  13),
  ('whore',         'Whore',                    'moderate',  true,  14),
  ('cunt',          'C-word (Cunt)',            'severe',    true,  15),
  ('twat',          'Twat',                     'moderate',  true,  16),
  ('prick',         'Prick',                    'moderate',  true,  17),
  ('racial_slurs',  'Racial Slurs',             'severe',    true,  18),
  ('homophobic',    'Homophobic Slurs',         'severe',    true,  19),
  ('ableist',       'Ableist Slurs',            'severe',    true,  20),
  ('religious',     'Religious Exclamations',   'religious', false, 21)
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label,
  severity = EXCLUDED.severity,
  default_blocked = EXCLUDED.default_blocked,
  display_order = EXCLUDED.display_order;

-- ============================================================================
-- 7. SEED DATA - Known Profanity Variants
-- ============================================================================
-- These are seeded from the existing Chrome extension dictionary (147 entries)
-- plus the website demo route. The AI will discover more over time.

-- FUCK bucket variants
INSERT INTO public.profanity_variants (variant, bucket_id, source, confidence) VALUES
  ('fuck',              'fuck', 'dictionary', 1.0),
  ('fucking',           'fuck', 'dictionary', 1.0),
  ('fuckin',            'fuck', 'dictionary', 1.0),
  ('fucked',            'fuck', 'dictionary', 1.0),
  ('fucker',            'fuck', 'dictionary', 1.0),
  ('fuckers',           'fuck', 'dictionary', 1.0),
  ('fucks',             'fuck', 'dictionary', 1.0),
  ('motherfucker',      'fuck', 'dictionary', 1.0),
  ('motherfucking',     'fuck', 'dictionary', 1.0),
  ('motherfuckin',      'fuck', 'dictionary', 1.0),
  ('motherfuckers',     'fuck', 'dictionary', 1.0)
ON CONFLICT (variant, bucket_id) DO NOTHING;

-- SHIT bucket variants
INSERT INTO public.profanity_variants (variant, bucket_id, source, confidence) VALUES
  ('shit',              'shit', 'dictionary', 1.0),
  ('shits',             'shit', 'dictionary', 1.0),
  ('shitty',            'shit', 'dictionary', 1.0),
  ('shitting',          'shit', 'dictionary', 1.0),
  ('bullshit',          'shit', 'dictionary', 1.0),
  ('horseshit',         'shit', 'dictionary', 1.0),
  ('batshit',           'shit', 'dictionary', 1.0),
  ('shithead',          'shit', 'dictionary', 1.0),
  ('shitheads',         'shit', 'dictionary', 1.0)
ON CONFLICT (variant, bucket_id) DO NOTHING;

-- ASS bucket variants
INSERT INTO public.profanity_variants (variant, bucket_id, source, confidence) VALUES
  ('ass',               'ass', 'dictionary', 1.0),
  ('asses',             'ass', 'dictionary', 1.0),
  ('asshole',           'ass', 'dictionary', 1.0),
  ('assholes',          'ass', 'dictionary', 1.0)
ON CONFLICT (variant, bucket_id) DO NOTHING;

-- BITCH bucket variants
INSERT INTO public.profanity_variants (variant, bucket_id, source, confidence) VALUES
  ('bitch',             'bitch', 'dictionary', 1.0),
  ('bitches',           'bitch', 'dictionary', 1.0),
  ('bitchy',            'bitch', 'dictionary', 1.0)
ON CONFLICT (variant, bucket_id) DO NOTHING;

-- DAMN bucket variants
INSERT INTO public.profanity_variants (variant, bucket_id, source, confidence) VALUES
  ('damn',              'damn', 'dictionary', 1.0),
  ('damned',            'damn', 'dictionary', 1.0),
  ('dammit',            'damn', 'dictionary', 1.0),
  ('damnit',            'damn', 'dictionary', 1.0)
ON CONFLICT (variant, bucket_id) DO NOTHING;

-- HELL bucket variants
INSERT INTO public.profanity_variants (variant, bucket_id, source, confidence) VALUES
  ('hell',              'hell', 'dictionary', 1.0)
ON CONFLICT (variant, bucket_id) DO NOTHING;

-- CRAP bucket variants
INSERT INTO public.profanity_variants (variant, bucket_id, source, confidence) VALUES
  ('crap',              'crap', 'dictionary', 1.0),
  ('crappy',            'crap', 'dictionary', 1.0)
ON CONFLICT (variant, bucket_id) DO NOTHING;

-- PISS bucket variants
INSERT INTO public.profanity_variants (variant, bucket_id, source, confidence) VALUES
  ('piss',              'piss', 'dictionary', 1.0),
  ('pissed',            'piss', 'dictionary', 1.0),
  ('pissing',           'piss', 'dictionary', 1.0)
ON CONFLICT (variant, bucket_id) DO NOTHING;

-- DICK bucket variants
INSERT INTO public.profanity_variants (variant, bucket_id, source, confidence) VALUES
  ('dick',              'dick', 'dictionary', 1.0),
  ('dicks',             'dick', 'dictionary', 1.0),
  ('dickhead',          'dick', 'dictionary', 1.0),
  ('dickheads',         'dick', 'dictionary', 1.0)
ON CONFLICT (variant, bucket_id) DO NOTHING;

-- COCK bucket variants
INSERT INTO public.profanity_variants (variant, bucket_id, source, confidence) VALUES
  ('cock',              'cock', 'dictionary', 1.0),
  ('cocks',             'cock', 'dictionary', 1.0),
  ('cocksucker',        'cock', 'dictionary', 1.0),
  ('cocksuckers',       'cock', 'dictionary', 1.0)
ON CONFLICT (variant, bucket_id) DO NOTHING;

-- PUSSY bucket variants
INSERT INTO public.profanity_variants (variant, bucket_id, source, confidence) VALUES
  ('pussy',             'pussy', 'dictionary', 1.0),
  ('pussies',           'pussy', 'dictionary', 1.0)
ON CONFLICT (variant, bucket_id) DO NOTHING;

-- BASTARD bucket variants
INSERT INTO public.profanity_variants (variant, bucket_id, source, confidence) VALUES
  ('bastard',           'bastard', 'dictionary', 1.0),
  ('bastards',          'bastard', 'dictionary', 1.0)
ON CONFLICT (variant, bucket_id) DO NOTHING;

-- SLUT bucket variants
INSERT INTO public.profanity_variants (variant, bucket_id, source, confidence) VALUES
  ('slut',              'slut', 'dictionary', 1.0),
  ('sluts',             'slut', 'dictionary', 1.0),
  ('slutty',            'slut', 'dictionary', 1.0)
ON CONFLICT (variant, bucket_id) DO NOTHING;

-- WHORE bucket variants
INSERT INTO public.profanity_variants (variant, bucket_id, source, confidence) VALUES
  ('whore',             'whore', 'dictionary', 1.0),
  ('whores',            'whore', 'dictionary', 1.0)
ON CONFLICT (variant, bucket_id) DO NOTHING;

-- CUNT bucket variants
INSERT INTO public.profanity_variants (variant, bucket_id, source, confidence) VALUES
  ('cunt',              'cunt', 'dictionary', 1.0),
  ('cunts',             'cunt', 'dictionary', 1.0)
ON CONFLICT (variant, bucket_id) DO NOTHING;

-- TWAT bucket variants
INSERT INTO public.profanity_variants (variant, bucket_id, source, confidence) VALUES
  ('twat',              'twat', 'dictionary', 1.0),
  ('twats',             'twat', 'dictionary', 1.0)
ON CONFLICT (variant, bucket_id) DO NOTHING;

-- PRICK bucket variants
INSERT INTO public.profanity_variants (variant, bucket_id, source, confidence) VALUES
  ('prick',             'prick', 'dictionary', 1.0),
  ('pricks',            'prick', 'dictionary', 1.0)
ON CONFLICT (variant, bucket_id) DO NOTHING;

-- RACIAL SLURS bucket variants
INSERT INTO public.profanity_variants (variant, bucket_id, source, confidence) VALUES
  ('nigger',            'racial_slurs', 'dictionary', 1.0),
  ('niggers',           'racial_slurs', 'dictionary', 1.0),
  ('nigga',             'racial_slurs', 'dictionary', 1.0),
  ('niggas',            'racial_slurs', 'dictionary', 1.0)
ON CONFLICT (variant, bucket_id) DO NOTHING;

-- HOMOPHOBIC SLURS bucket variants
INSERT INTO public.profanity_variants (variant, bucket_id, source, confidence) VALUES
  ('faggot',            'homophobic', 'dictionary', 1.0),
  ('faggots',           'homophobic', 'dictionary', 1.0),
  ('fag',               'homophobic', 'dictionary', 1.0),
  ('fags',              'homophobic', 'dictionary', 1.0)
ON CONFLICT (variant, bucket_id) DO NOTHING;

-- ABLEIST SLURS bucket variants
INSERT INTO public.profanity_variants (variant, bucket_id, source, confidence) VALUES
  ('retard',            'ableist', 'dictionary', 1.0),
  ('retarded',          'ableist', 'dictionary', 1.0),
  ('retards',           'ableist', 'dictionary', 1.0)
ON CONFLICT (variant, bucket_id) DO NOTHING;

-- RELIGIOUS bucket variants
INSERT INTO public.profanity_variants (variant, bucket_id, source, confidence) VALUES
  ('jesus',             'religious', 'dictionary', 1.0),
  ('jesus christ',      'religious', 'dictionary', 1.0),
  ('jesus fucking christ', 'religious', 'dictionary', 1.0),
  ('christ',            'religious', 'dictionary', 1.0),
  ('christ almighty',   'religious', 'dictionary', 1.0),
  ('god',               'religious', 'dictionary', 1.0),
  ('oh my god',         'religious', 'dictionary', 1.0),
  ('oh god',            'religious', 'dictionary', 1.0),
  ('my god',            'religious', 'dictionary', 1.0),
  ('for gods sake',     'religious', 'dictionary', 1.0),
  ('god almighty',      'religious', 'dictionary', 1.0),
  ('swear to god',      'religious', 'dictionary', 1.0),
  ('lord',              'religious', 'dictionary', 1.0),
  ('oh lord',           'religious', 'dictionary', 1.0),
  ('dear lord',         'religious', 'dictionary', 1.0),
  ('good lord',         'religious', 'dictionary', 1.0),
  ('lord almighty',     'religious', 'dictionary', 1.0),
  ('lord have mercy',   'religious', 'dictionary', 1.0),
  ('lordy',             'religious', 'dictionary', 1.0),
  ('lawdy',             'religious', 'dictionary', 1.0),
  ('lawd',              'religious', 'dictionary', 1.0),
  ('holy cow',          'religious', 'dictionary', 1.0),
  ('holy smokes',       'religious', 'dictionary', 1.0),
  ('holy moly',         'religious', 'dictionary', 1.0),
  ('holy mother',       'religious', 'dictionary', 1.0),
  ('holy mother of god','religious', 'dictionary', 1.0),
  ('for christs sake',  'religious', 'dictionary', 1.0),
  ('chrissake',         'religious', 'dictionary', 1.0)
ON CONFLICT (variant, bucket_id) DO NOTHING;

-- MULTI-BUCKET variants (words that belong to more than one bucket)
-- "goddamn" family → both 'damn' AND 'religious'
INSERT INTO public.profanity_variants (variant, bucket_id, source, confidence) VALUES
  ('goddamn',           'damn',      'dictionary', 1.0),
  ('goddamn',           'religious', 'dictionary', 1.0),
  ('goddamned',         'damn',      'dictionary', 1.0),
  ('goddamned',         'religious', 'dictionary', 1.0),
  ('goddamnit',         'damn',      'dictionary', 1.0),
  ('goddamnit',         'religious', 'dictionary', 1.0),
  ('goddammit',         'damn',      'dictionary', 1.0),
  ('goddammit',         'religious', 'dictionary', 1.0),
  ('goddamit',          'damn',      'dictionary', 1.0),
  ('goddamit',          'religious', 'dictionary', 1.0),
  ('god damn',          'damn',      'dictionary', 1.0),
  ('god damn',          'religious', 'dictionary', 1.0),
  ('god damned',        'damn',      'dictionary', 1.0),
  ('god damned',        'religious', 'dictionary', 1.0),
  ('god damnit',        'damn',      'dictionary', 1.0),
  ('god damnit',        'religious', 'dictionary', 1.0),
  ('god dammit',        'damn',      'dictionary', 1.0),
  ('god dammit',        'religious', 'dictionary', 1.0),
  ('god damn it',       'damn',      'dictionary', 1.0),
  ('god damn it',       'religious', 'dictionary', 1.0),
  ('gotdamn',           'damn',      'dictionary', 1.0),
  ('gotdamn',           'religious', 'dictionary', 1.0),
  ('got damn',          'damn',      'dictionary', 1.0),
  ('got damn',          'religious', 'dictionary', 1.0),
  ('gahdamn',           'damn',      'dictionary', 1.0),
  ('gahdamn',           'religious', 'dictionary', 1.0),
  ('gawddamn',         'damn',      'dictionary', 1.0),
  ('gawddamn',         'religious', 'dictionary', 1.0)
ON CONFLICT (variant, bucket_id) DO NOTHING;

-- "holy shit" → both 'shit' AND 'religious'
INSERT INTO public.profanity_variants (variant, bucket_id, source, confidence) VALUES
  ('holy shit',         'shit',      'dictionary', 1.0),
  ('holy shit',         'religious', 'dictionary', 1.0)
ON CONFLICT (variant, bucket_id) DO NOTHING;

-- "holy fuck" → both 'fuck' AND 'religious'
INSERT INTO public.profanity_variants (variant, bucket_id, source, confidence) VALUES
  ('holy fuck',         'fuck',      'dictionary', 1.0),
  ('holy fuck',         'religious', 'dictionary', 1.0)
ON CONFLICT (variant, bucket_id) DO NOTHING;

-- "holy crap" → both 'crap' AND 'religious'
INSERT INTO public.profanity_variants (variant, bucket_id, source, confidence) VALUES
  ('holy crap',         'crap',      'dictionary', 1.0),
  ('holy crap',         'religious', 'dictionary', 1.0)
ON CONFLICT (variant, bucket_id) DO NOTHING;

-- "holy hell" → both 'hell' AND 'religious'
INSERT INTO public.profanity_variants (variant, bucket_id, source, confidence) VALUES
  ('holy hell',         'hell',      'dictionary', 1.0),
  ('holy hell',         'religious', 'dictionary', 1.0)
ON CONFLICT (variant, bucket_id) DO NOTHING;

-- Additional mild words from extension
INSERT INTO public.profanity_variants (variant, bucket_id, source, confidence) VALUES
  ('suck',              'damn', 'dictionary', 0.8),
  ('sucks',             'damn', 'dictionary', 0.8),
  ('sucked',            'damn', 'dictionary', 0.8),
  ('balls',             'damn', 'dictionary', 0.8),
  ('butt',              'ass',  'dictionary', 0.9),
  ('butthole',          'ass',  'dictionary', 0.9),
  ('screw',             'damn', 'dictionary', 0.8),
  ('screwed',           'damn', 'dictionary', 0.8),
  ('douche',            'damn', 'dictionary', 0.9),
  ('douchebag',         'damn', 'dictionary', 0.9),
  ('douchebags',        'damn', 'dictionary', 0.9),
  ('wanker',            'dick', 'dictionary', 0.9),
  ('wankers',           'dick', 'dictionary', 0.9),
  ('bollocks',          'damn', 'dictionary', 0.9),
  ('penis',             'dick', 'dictionary', 1.0)
ON CONFLICT (variant, bucket_id) DO NOTHING;

-- ============================================================================
-- DONE!
-- ============================================================================
-- Tables created:
--   - profanity_buckets (21 canonical buckets)
--   - profanity_variants (~120 known variants, will grow via AI)
--   - video_profanity_map (populated per-video by profanity engine)
--   - user_bucket_preferences (populated per-user on signup)
--
-- The handle_new_user() trigger has been updated to auto-create
-- bucket preferences for new users based on default_blocked values.
--
-- For existing users, run:
--   SELECT public.initialize_bucket_preferences(id) FROM auth.users;
-- ============================================================================

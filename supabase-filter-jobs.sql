-- Filter Jobs Table
-- This table tracks ongoing and completed filter jobs from the orchestrator

-- Create the filter_jobs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.filter_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  youtube_id TEXT NOT NULL,
  filter_type TEXT NOT NULL DEFAULT 'mute',
  custom_words TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  progress INTEGER DEFAULT 0,
  credits_used INTEGER DEFAULT 0,
  error TEXT,
  auto_retry_count INTEGER DEFAULT 0,
  needs_review BOOLEAN DEFAULT false,
  last_auto_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_filter_jobs_user_id ON public.filter_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_filter_jobs_job_id ON public.filter_jobs(job_id);
CREATE INDEX IF NOT EXISTS idx_filter_jobs_status ON public.filter_jobs(status);

-- Enable RLS
ALTER TABLE public.filter_jobs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own filter jobs
DROP POLICY IF EXISTS "Users can view own filter jobs" ON public.filter_jobs;
CREATE POLICY "Users can view own filter jobs"
  ON public.filter_jobs FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own filter jobs
DROP POLICY IF EXISTS "Users can insert own filter jobs" ON public.filter_jobs;
CREATE POLICY "Users can insert own filter jobs"
  ON public.filter_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own filter jobs
DROP POLICY IF EXISTS "Users can update own filter jobs" ON public.filter_jobs;
CREATE POLICY "Users can update own filter jobs"
  ON public.filter_jobs FOR UPDATE
  USING (auth.uid() = user_id);

-- Add user_preferences table if not exists (for settings page)
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  default_filter_type TEXT DEFAULT 'mute',
  sensitivity_level TEXT DEFAULT 'moderate',
  custom_words TEXT[] DEFAULT '{}',
  auto_save_history BOOLEAN DEFAULT true,
  data_retention_days INTEGER DEFAULT 90,
  billing_alerts BOOLEAN DEFAULT true,
  usage_alerts BOOLEAN DEFAULT true,
  credit_low_threshold INTEGER DEFAULT 80,
  feature_updates BOOLEAN DEFAULT true,
  marketing_emails BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for user_preferences
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_preferences
DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;
CREATE POLICY "Users can view own preferences"
  ON public.user_preferences FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;
CREATE POLICY "Users can insert own preferences"
  ON public.user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;
CREATE POLICY "Users can update own preferences"
  ON public.user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Add family_profiles table if not exists
CREATE TABLE IF NOT EXISTS public.family_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  is_child BOOLEAN DEFAULT false,
  is_owner BOOLEAN DEFAULT false,
  max_video_length INTEGER,
  credits_used INTEGER DEFAULT 0,
  videos_filtered INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for family_profiles
ALTER TABLE public.family_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for family_profiles
DROP POLICY IF EXISTS "Users can view own family profiles" ON public.family_profiles;
CREATE POLICY "Users can view own family profiles"
  ON public.family_profiles FOR SELECT
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can insert own family profiles" ON public.family_profiles;
CREATE POLICY "Users can insert own family profiles"
  ON public.family_profiles FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update own family profiles" ON public.family_profiles;
CREATE POLICY "Users can update own family profiles"
  ON public.family_profiles FOR UPDATE
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can delete own family profiles" ON public.family_profiles;
CREATE POLICY "Users can delete own family profiles"
  ON public.family_profiles FOR DELETE
  USING (auth.uid() = owner_id);

-- Create indexes for family_profiles
CREATE INDEX IF NOT EXISTS idx_family_profiles_owner_id ON public.family_profiles(owner_id);

-- Migration: Add auto-retry tracking columns to filter_jobs (safe to run on existing tables)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'filter_jobs' AND column_name = 'auto_retry_count') THEN
    ALTER TABLE public.filter_jobs ADD COLUMN auto_retry_count INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'filter_jobs' AND column_name = 'needs_review') THEN
    ALTER TABLE public.filter_jobs ADD COLUMN needs_review BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'filter_jobs' AND column_name = 'last_auto_retry_at') THEN
    ALTER TABLE public.filter_jobs ADD COLUMN last_auto_retry_at TIMESTAMPTZ;
  END IF;
  -- Retranscribe flag: jobs created by user-initiated "Re-transcribe" on already-filtered videos.
  -- These are free (user already paid) and bypass credit deduction on completion.
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'filter_jobs' AND column_name = 'is_retranscribe') THEN
    ALTER TABLE public.filter_jobs ADD COLUMN is_retranscribe BOOLEAN DEFAULT false;
  END IF;
END $$;

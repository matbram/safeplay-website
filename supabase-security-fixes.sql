-- ============================================================================
-- Supabase Security Fixes
-- ============================================================================
-- Fixes two categories of security linter errors:
-- 1. SECURITY DEFINER views → changed to SECURITY INVOKER
-- 2. RLS disabled on public tables → RLS enabled with service_role policies
--
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ============================================================================

-- ============================================================================
-- 1. FIX SECURITY DEFINER VIEWS
-- ============================================================================
-- These views currently run with the view owner's permissions, bypassing RLS.
-- Setting security_invoker = on makes them respect the querying user's
-- permissions and RLS policies instead.

ALTER VIEW public.active_knowledge SET (security_invoker = on);
ALTER VIEW public.fix_success_rates SET (security_invoker = on);
ALTER VIEW public.common_errors SET (security_invoker = on);
ALTER VIEW public.recent_failures SET (security_invoker = on);
ALTER VIEW public.hourly_success_pattern SET (security_invoker = on);
ALTER VIEW public.player_client_performance SET (security_invoker = on);

-- ============================================================================
-- 2. ENABLE RLS ON AGENT/TELEMETRY TABLES
-- ============================================================================
-- These tables are exposed via PostgREST but have no row level security.
-- Without RLS, anyone with the anon key can read/write all data.
--
-- Since these are backend/agent tables, we restrict access to service_role
-- only. The anon and authenticated roles will have no access.

-- agent_telemetry
ALTER TABLE public.agent_telemetry ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage agent_telemetry" ON public.agent_telemetry;
CREATE POLICY "Service role can manage agent_telemetry"
  ON public.agent_telemetry FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- agent_actions
ALTER TABLE public.agent_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage agent_actions" ON public.agent_actions;
CREATE POLICY "Service role can manage agent_actions"
  ON public.agent_actions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- agent_knowledge
ALTER TABLE public.agent_knowledge ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage agent_knowledge" ON public.agent_knowledge;
CREATE POLICY "Service role can manage agent_knowledge"
  ON public.agent_knowledge FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- agent_patterns
ALTER TABLE public.agent_patterns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage agent_patterns" ON public.agent_patterns;
CREATE POLICY "Service role can manage agent_patterns"
  ON public.agent_patterns FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- agent_config
ALTER TABLE public.agent_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage agent_config" ON public.agent_config;
CREATE POLICY "Service role can manage agent_config"
  ON public.agent_config FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- agent_alerts
ALTER TABLE public.agent_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage agent_alerts" ON public.agent_alerts;
CREATE POLICY "Service role can manage agent_alerts"
  ON public.agent_alerts FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- agent_error_fingerprints
ALTER TABLE public.agent_error_fingerprints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage agent_error_fingerprints" ON public.agent_error_fingerprints;
CREATE POLICY "Service role can manage agent_error_fingerprints"
  ON public.agent_error_fingerprints FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- agent_fix_correlations
ALTER TABLE public.agent_fix_correlations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage agent_fix_correlations" ON public.agent_fix_correlations;
CREATE POLICY "Service role can manage agent_fix_correlations"
  ON public.agent_fix_correlations FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- download_jobs
ALTER TABLE public.download_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage download_jobs" ON public.download_jobs;
CREATE POLICY "Service role can manage download_jobs"
  ON public.download_jobs FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- DONE
-- ============================================================================
-- After running this:
-- 1. All 6 views will respect the querying user's RLS policies
-- 2. All 9 tables will have RLS enabled with service_role-only access
-- 3. Re-run the Supabase security linter to verify all issues are resolved
--
-- NOTE: If any of these tables need to be accessed by authenticated users
-- (not just the backend service), add additional policies. For example:
--
--   CREATE POLICY "Authenticated users can read download_jobs"
--     ON public.download_jobs FOR SELECT
--     USING (auth.uid() = user_id);
--
-- ============================================================================

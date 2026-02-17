-- ============================================================================
-- Supabase Security Fixes
-- ============================================================================
-- Fixes two categories of security linter errors:
-- 1. SECURITY DEFINER views -> changed to SECURITY INVOKER
-- 2. RLS disabled on public tables -> RLS enabled with service_role policies
--
-- SOURCE: These objects are created by the SafePlay AI Agent in the
-- safeplay-yt-dlp repo:
--   - schema/agent_schema.sql (6 tables, 4 views)
--   - supabase/intelligence_schema.sql (2 tables, 2 views)
--   - schema/add_platform_column.sql (view updates)
--   - schema/download_jobs.sql (1 table, on cloud-run branch)
--
-- The original schemas intentionally left RLS disabled:
--   "For now, we'll use service role access only (RLS disabled)"
-- This was fine when the agent was the sole consumer, but Supabase's
-- security linter correctly flags it because these tables are exposed
-- via PostgREST (the public API). Without RLS, anyone with the anon
-- key can read/write all agent data directly from a browser.
--
-- Run this in Supabase SQL Editor (Dashboard -> SQL Editor -> New query)
-- ============================================================================

-- ============================================================================
-- 1. FIX SECURITY DEFINER VIEWS
-- ============================================================================
-- Views created with CREATE OR REPLACE VIEW default to security_invoker=off
-- in PostgreSQL, meaning they execute with the view OWNER's permissions
-- (typically postgres), bypassing RLS on the underlying tables.
--
-- Setting security_invoker=on makes them respect the querying user's
-- permissions and RLS policies instead.
--
-- Views from schema/agent_schema.sql:
--   recent_failures, player_client_performance, hourly_success_pattern,
--   active_knowledge
-- Views from supabase/intelligence_schema.sql:
--   fix_success_rates, common_errors

ALTER VIEW public.active_knowledge SET (security_invoker = on);
ALTER VIEW public.fix_success_rates SET (security_invoker = on);
ALTER VIEW public.common_errors SET (security_invoker = on);
ALTER VIEW public.recent_failures SET (security_invoker = on);
ALTER VIEW public.hourly_success_pattern SET (security_invoker = on);
ALTER VIEW public.player_client_performance SET (security_invoker = on);

-- ============================================================================
-- 2. ENABLE RLS ON AGENT/TELEMETRY TABLES
-- ============================================================================
-- All these tables are backend-only (accessed by the SafePlay AI Agent
-- using the service_role key). No authenticated user or anon client
-- should access them directly.
--
-- Tables from schema/agent_schema.sql:
--   agent_telemetry, agent_knowledge, agent_patterns, agent_actions,
--   agent_alerts, agent_config
-- Tables from supabase/intelligence_schema.sql:
--   agent_error_fingerprints, agent_fix_correlations
-- Table from schema/download_jobs.sql:
--   download_jobs

-- agent_telemetry: Raw download attempt data for pattern analysis
ALTER TABLE public.agent_telemetry ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage agent_telemetry" ON public.agent_telemetry;
CREATE POLICY "Service role can manage agent_telemetry"
  ON public.agent_telemetry FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- agent_actions: Log of every agent action (config changes, code fixes, etc.)
ALTER TABLE public.agent_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage agent_actions" ON public.agent_actions;
CREATE POLICY "Service role can manage agent_actions"
  ON public.agent_actions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- agent_knowledge: The agent's learning journal
ALTER TABLE public.agent_knowledge ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage agent_knowledge" ON public.agent_knowledge;
CREATE POLICY "Service role can manage agent_knowledge"
  ON public.agent_knowledge FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- agent_patterns: Computed statistics refreshed periodically
ALTER TABLE public.agent_patterns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage agent_patterns" ON public.agent_patterns;
CREATE POLICY "Service role can manage agent_patterns"
  ON public.agent_patterns FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- agent_config: Persistent agent configuration (key-value store)
ALTER TABLE public.agent_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage agent_config" ON public.agent_config;
CREATE POLICY "Service role can manage agent_config"
  ON public.agent_config FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- agent_alerts: Notifications sent to admins
ALTER TABLE public.agent_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage agent_alerts" ON public.agent_alerts;
CREATE POLICY "Service role can manage agent_alerts"
  ON public.agent_alerts FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- agent_error_fingerprints: Clusters similar errors by pattern fingerprint
ALTER TABLE public.agent_error_fingerprints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage agent_error_fingerprints" ON public.agent_error_fingerprints;
CREATE POLICY "Service role can manage agent_error_fingerprints"
  ON public.agent_error_fingerprints FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- agent_fix_correlations: Tracks which fixes work for which errors
ALTER TABLE public.agent_fix_correlations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage agent_fix_correlations" ON public.agent_fix_correlations;
CREATE POLICY "Service role can manage agent_fix_correlations"
  ON public.agent_fix_correlations FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- download_jobs: Persistent job tracking across Cloud Run instances
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
-- 3. The SafePlay AI Agent will continue to work (it uses service_role key)
-- 4. Re-run the Supabase security linter to verify all 15 errors are resolved
-- ============================================================================

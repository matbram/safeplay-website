-- ============================================================================
-- SafePlay Admin Dashboard Database Schema
-- ============================================================================
-- Run this AFTER the main supabase-schema.sql to add admin functionality
-- ============================================================================

-- ============================================================================
-- 1. ADMIN TABLES
-- ============================================================================

-- Admin roles table - defines who is an admin and their permissions
CREATE TABLE IF NOT EXISTS public.admin_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'support', -- 'super_admin', 'admin', 'support'
  permissions JSONB NOT NULL DEFAULT '{}', -- granular permissions
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin activity/audit log - tracks all admin actions
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'credit_adjustment', 'subscription_change', 'account_suspension', etc.
  target_type TEXT NOT NULL, -- 'user', 'subscription', 'ticket', 'credit', etc.
  target_id TEXT NOT NULL, -- the ID of the affected entity
  details JSONB NOT NULL DEFAULT '{}', -- action-specific details
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin notes on user accounts
CREATE TABLE IF NOT EXISTS public.admin_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  note TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Support ticket messages/replies
CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_type TEXT NOT NULL DEFAULT 'user', -- 'user', 'admin', 'system'
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  is_internal BOOLEAN DEFAULT FALSE, -- internal notes not visible to user
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Account flags/warnings
CREATE TABLE IF NOT EXISTS public.account_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  flag_type TEXT NOT NULL, -- 'warning', 'suspension', 'ban', 'watch_list'
  reason TEXT NOT NULL,
  expires_at TIMESTAMPTZ, -- NULL for permanent
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_note TEXT
);

-- ============================================================================
-- 2. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_id ON public.admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON public.admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_target ON public.admin_audit_log(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action ON public.admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_admin_notes_user_id ON public.admin_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON public.ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_account_flags_user_id ON public.account_flags(user_id);
CREATE INDEX IF NOT EXISTS idx_account_flags_active ON public.account_flags(user_id, resolved_at) WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON public.support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned ON public.support_tickets(assigned_to);

-- ============================================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on admin tables
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_flags ENABLE ROW LEVEL SECURITY;

-- Admin roles - only viewable/manageable by super admins via service role
CREATE POLICY "Service role manages admin_roles" ON public.admin_roles
  FOR ALL USING (auth.role() = 'service_role');

-- Audit log - only accessible via service role (API endpoints will check admin status)
CREATE POLICY "Service role manages audit_log" ON public.admin_audit_log
  FOR ALL USING (auth.role() = 'service_role');

-- Admin notes - accessible via service role
CREATE POLICY "Service role manages admin_notes" ON public.admin_notes
  FOR ALL USING (auth.role() = 'service_role');

-- Ticket messages - users can view their own non-internal messages, admins see all via service role
CREATE POLICY "Users view own ticket messages" ON public.ticket_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = ticket_id AND t.user_id = auth.uid()
    ) AND is_internal = FALSE
  );

CREATE POLICY "Users can send ticket messages" ON public.ticket_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = ticket_id AND t.user_id = auth.uid()
    ) AND sender_type = 'user'
  );

CREATE POLICY "Service role manages ticket_messages" ON public.ticket_messages
  FOR ALL USING (auth.role() = 'service_role');

-- Account flags - only accessible via service role
CREATE POLICY "Service role manages account_flags" ON public.account_flags
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- 4. ADMIN HELPER FUNCTIONS
-- ============================================================================

-- Function to check if a user is an admin
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_roles WHERE user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get admin role
CREATE OR REPLACE FUNCTION public.get_admin_role(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM public.admin_roles WHERE user_id = p_user_id;
  RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check specific permission
CREATE OR REPLACE FUNCTION public.admin_has_permission(p_user_id UUID, p_permission TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
  v_permissions JSONB;
BEGIN
  SELECT role, permissions INTO v_role, v_permissions
  FROM public.admin_roles
  WHERE user_id = p_user_id;

  -- Super admins have all permissions
  IF v_role = 'super_admin' THEN
    RETURN TRUE;
  END IF;

  -- Check specific permission in JSONB
  RETURN COALESCE((v_permissions->p_permission)::boolean, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log admin action
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_admin_id UUID,
  p_action TEXT,
  p_target_type TEXT,
  p_target_id TEXT,
  p_details JSONB DEFAULT '{}',
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.admin_audit_log (admin_id, action, target_type, target_id, details, ip_address, user_agent)
  VALUES (p_admin_id, p_action, p_target_type, p_target_id, p_details, p_ip_address, p_user_agent)
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to adjust user credits (admin action)
CREATE OR REPLACE FUNCTION public.admin_adjust_credits(
  p_admin_id UUID,
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT,
  p_type TEXT DEFAULT 'adjustment'
)
RETURNS TABLE (success BOOLEAN, new_balance INTEGER, error_message TEXT) AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Check admin permission
  IF NOT public.admin_has_permission(p_admin_id, 'manage_credits') THEN
    RETURN QUERY SELECT FALSE, 0, 'Insufficient permissions'::TEXT;
    RETURN;
  END IF;

  -- Get current balance
  SELECT available_credits INTO v_current_balance
  FROM public.credit_balances
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_current_balance IS NULL THEN
    RETURN QUERY SELECT FALSE, 0, 'User not found'::TEXT;
    RETURN;
  END IF;

  v_new_balance := v_current_balance + p_amount;

  -- Don't allow negative balance
  IF v_new_balance < 0 THEN
    RETURN QUERY SELECT FALSE, v_current_balance, 'Cannot set negative balance'::TEXT;
    RETURN;
  END IF;

  -- Update balance
  UPDATE public.credit_balances
  SET
    available_credits = v_new_balance,
    topup_credits = CASE WHEN p_amount > 0 THEN topup_credits + p_amount ELSE topup_credits END,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Record transaction
  INSERT INTO public.credit_transactions (user_id, amount, balance_after, type, description)
  VALUES (p_user_id, p_amount, v_new_balance, p_type, 'Admin adjustment: ' || p_reason);

  -- Log admin action
  PERFORM public.log_admin_action(
    p_admin_id,
    'credit_adjustment',
    'user',
    p_user_id::TEXT,
    jsonb_build_object('amount', p_amount, 'reason', p_reason, 'previous_balance', v_current_balance, 'new_balance', v_new_balance)
  );

  RETURN QUERY SELECT TRUE, v_new_balance, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get dashboard stats
CREATE OR REPLACE FUNCTION public.admin_get_dashboard_stats()
RETURNS TABLE (
  total_users BIGINT,
  active_subscriptions BIGINT,
  total_credits_used BIGINT,
  open_tickets BIGINT,
  new_users_today BIGINT,
  new_users_week BIGINT,
  revenue_this_month BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM public.profiles)::BIGINT as total_users,
    (SELECT COUNT(*) FROM public.subscriptions WHERE status = 'active' AND plan_id != 'free')::BIGINT as active_subscriptions,
    (SELECT COALESCE(SUM(used_this_period), 0) FROM public.credit_balances)::BIGINT as total_credits_used,
    (SELECT COUNT(*) FROM public.support_tickets WHERE status IN ('open', 'in_progress'))::BIGINT as open_tickets,
    (SELECT COUNT(*) FROM public.profiles WHERE created_at >= CURRENT_DATE)::BIGINT as new_users_today,
    (SELECT COUNT(*) FROM public.profiles WHERE created_at >= CURRENT_DATE - INTERVAL '7 days')::BIGINT as new_users_week,
    (SELECT COALESCE(SUM(amount_cents), 0) FROM public.invoices WHERE status = 'paid' AND created_at >= date_trunc('month', CURRENT_DATE))::BIGINT as revenue_this_month;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. DEFAULT PERMISSIONS TEMPLATES
-- ============================================================================

-- Permission templates for different roles
COMMENT ON TABLE public.admin_roles IS 'Admin role permissions:
- super_admin: Full access to everything
- admin: Can manage users, credits, subscriptions, tickets
- support: Can view users, manage tickets, limited credit adjustments

Permission keys:
- manage_users: Can view and edit user accounts
- manage_credits: Can add/remove credits
- manage_subscriptions: Can change subscription plans
- manage_tickets: Can handle support tickets
- manage_admins: Can add/remove admin roles (super_admin only)
- view_audit_log: Can view audit log
- export_data: Can export user data
- suspend_accounts: Can suspend/ban accounts
';

-- ============================================================================
-- 6. SEED ADMIN DATA (OPTIONAL - REMOVE IN PRODUCTION)
-- ============================================================================

-- Example: To make a user a super admin, run:
-- INSERT INTO public.admin_roles (user_id, role, permissions, created_by)
-- VALUES ('user-uuid-here', 'super_admin', '{}', 'user-uuid-here');

-- ============================================================================
-- DONE!
-- ============================================================================

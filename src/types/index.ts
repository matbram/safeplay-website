export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Plan {
  id: string;
  name: string;
  price_cents: number;
  credits_per_month: number;
  max_profiles: number;
  features: PlanFeatures;
  stripe_price_id: string | null;
  active: boolean;
}

export interface PlanFeatures {
  custom_words: boolean;
  priority_support: boolean;
  family_sharing: boolean;
  team_management: boolean;
  parental_controls: boolean;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: SubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'paused' | 'trialing';

export interface CreditBalance {
  user_id: string;
  available_credits: number;
  used_this_period: number;
  rollover_credits: number;
  period_start: string | null;
  period_end: string | null;
  updated_at: string;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  balance_after: number;
  type: CreditTransactionType;
  description: string | null;
  video_id: string | null;
  expires_at: string | null;
  created_at: string;
}

export type CreditTransactionType =
  | 'subscription_renewal'
  | 'video_filter'
  | 'rollover'
  | 'adjustment'
  | 'refund';

export interface Video {
  id: string;
  youtube_id: string;
  title: string;
  channel_name: string | null;
  duration_seconds: number;
  thumbnail_url: string | null;
  cached_at: string;
  last_accessed: string;
}

export interface FilterHistory {
  id: string;
  user_id: string;
  profile_id: string | null;
  video_id: string;
  filter_type: FilterType;
  custom_words: string[] | null;
  credits_used: number;
  created_at: string;
  video?: Video;
}

export type FilterType = 'mute' | 'bleep';

export interface FamilyProfile {
  id: string;
  owner_id: string;
  name: string;
  avatar_url: string | null;
  is_child: boolean;
  restrictions: ProfileRestrictions | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileRestrictions {
  max_video_length?: number;
  blocked_channels?: string[];
}

export interface UserPreferences {
  user_id: string;
  default_filter_type: FilterType;
  sensitivity_level: SensitivityLevel;
  custom_words: string[];
  auto_save_history: boolean;
  data_retention_days: number | null;
  share_history_with_family: boolean;
  created_at: string;
  updated_at: string;
}

export type SensitivityLevel = 'low' | 'moderate' | 'high';

export interface NotificationPreferences {
  user_id: string;
  billing_alerts: boolean;
  usage_alerts: boolean;
  credit_low_threshold: number;
  feature_updates: boolean;
  marketing_emails: boolean;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  user_id: string;
  stripe_invoice_id: string;
  amount_cents: number;
  status: InvoiceStatus;
  invoice_pdf_url: string | null;
  period_start: string | null;
  period_end: string | null;
  created_at: string;
}

export type InvoiceStatus = 'paid' | 'open' | 'void' | 'uncollectible';

export interface SupportTicket {
  id: string;
  user_id: string | null;
  email: string;
  subject: string;
  message: string;
  status: TicketStatus;
  priority: TicketPriority;
  assigned_to: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';

// API Response Types
export interface VideoMetadata {
  youtube_id: string;
  title: string;
  channel_name: string;
  duration_seconds: number;
  thumbnail_url: string;
  credit_cost: number;
}

export interface FilterJobStatus {
  job_id: string;
  status: 'pending' | 'downloading' | 'transcribing' | 'completed' | 'failed';
  progress: number;
  transcript?: TranscriptData;
  error?: string;
}

export interface TranscriptData {
  segments: TranscriptSegment[];
  profanity_timestamps: ProfanityTimestamp[];
}

export interface TranscriptSegment {
  text: string;
  start: number;
  end: number;
}

export interface ProfanityTimestamp {
  word: string;
  start: number;
  end: number;
}

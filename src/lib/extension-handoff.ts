import type { Session, SupabaseClient } from "@supabase/supabase-js";

export interface ExtensionProfileData {
  display_name: string | null;
  subscription_tier: string;
  subscription_status: string;
  available_credits: number;
  used_this_period: number;
}

export interface ExtensionAuthPayload {
  type: "AUTH_TOKEN";
  token: string;
  refreshToken: string;
  expiresAt: number;
  userId: string;
  tier: string;
  user: {
    id: string;
    email: string | undefined;
    full_name: string | undefined;
    avatar_url: string | null;
  };
  subscription: {
    id: string;
    user_id: string;
    plan_id: string;
    status: string;
    plans: {
      id: string;
      name: string;
      monthly_credits: number;
    };
  };
  userCredits: {
    user_id: string;
    available_credits: number;
    used_this_period: number;
    rollover_credits: number;
  };
  credits: {
    available: number;
    used_this_period: number;
    plan_allocation: number;
    percent_consumed: number;
    plan: string;
  };
}

export function buildExtensionAuthPayload(
  session: Session,
  profile: ExtensionProfileData | null,
): ExtensionAuthPayload {
  const tier = profile?.subscription_tier || "individual";
  const availableCredits = profile?.available_credits ?? 0;
  const usedThisPeriod = profile?.used_this_period ?? 0;
  const planAllocation = tier === "family" ? 1500 : 750;
  const percentConsumed =
    planAllocation > 0 ? Math.round((usedThisPeriod / planAllocation) * 100) : 0;

  // expiresAt is in MILLISECONDS (session.expires_at is seconds) so the
  // extension can compare it against Date.now() directly.
  const expiresAtMs = (session.expires_at || 0) * 1000;

  return {
    type: "AUTH_TOKEN",
    token: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: expiresAtMs,
    userId: session.user.id,
    tier,
    user: {
      id: session.user.id,
      email: session.user.email,
      full_name: profile?.display_name || session.user.email?.split("@")[0],
      avatar_url: null,
    },
    subscription: {
      id: session.user.id,
      user_id: session.user.id,
      plan_id: tier,
      status: profile?.subscription_status || "active",
      plans: {
        id: tier,
        name: tier.charAt(0).toUpperCase() + tier.slice(1),
        monthly_credits: planAllocation,
      },
    },
    userCredits: {
      user_id: session.user.id,
      available_credits: availableCredits,
      used_this_period: usedThisPeriod,
      rollover_credits: 0,
    },
    credits: {
      available: availableCredits,
      used_this_period: usedThisPeriod,
      plan_allocation: planAllocation,
      percent_consumed: percentConsumed,
      plan: tier,
    },
  };
}

export async function fetchExtensionProfileData(
  supabase: SupabaseClient,
  userId: string,
): Promise<ExtensionProfileData | null> {
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, subscription_tier, subscription_status")
      .eq("id", userId)
      .single();

    const { data: credits } = await supabase
      .from("credit_balances")
      .select("available_credits, used_this_period")
      .eq("user_id", userId)
      .single();

    if (!profile) return null;

    return {
      display_name: profile.display_name,
      subscription_tier: profile.subscription_tier || "individual",
      subscription_status: profile.subscription_status || "active",
      available_credits: credits?.available_credits ?? 0,
      used_this_period: credits?.used_this_period ?? 0,
    };
  } catch (err) {
    console.error("Failed to fetch extension profile data:", err);
    return null;
  }
}

type ChromeRuntime = {
  sendMessage: (
    id: string,
    message: unknown,
    callback?: (response: unknown) => void,
  ) => void;
};

export function getChromeRuntime(): ChromeRuntime | undefined {
  if (typeof window === "undefined") return undefined;
  return (
    window as typeof window & {
      chrome?: { runtime?: ChromeRuntime };
    }
  ).chrome?.runtime;
}

export function sendMessageToExtension(
  extensionId: string,
  payload: unknown,
): void {
  const runtime = getChromeRuntime();
  if (!runtime?.sendMessage) return;
  try {
    runtime.sendMessage(extensionId, payload, () => {
      // Swallow lastError; the extension may simply not be installed.
      void (
        window as typeof window & {
          chrome?: { runtime?: { lastError?: unknown } };
        }
      ).chrome?.runtime?.lastError;
    });
  } catch (err) {
    console.debug("[extension-handoff] sendMessage failed", err);
  }
}

export function getTrustedExtensionIds(): string[] {
  const raw = process.env.NEXT_PUBLIC_EXTENSION_IDS;
  if (!raw) return [];
  return raw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  subscription_status: string;
  subscription_tier: string;
  monthly_quota: number;
}

interface CreditBalance {
  available_credits: number;
  used_this_period: number;
  rollover_credits: number;
  topup_credits: number;
  period_start: string;
  period_end: string;
}

interface UserContextType {
  user: UserProfile | null;
  credits: CreditBalance | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  signOut: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [credits, setCredits] = useState<CreditBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!supabase) {
        setError("Unable to connect to database");
        setLoading(false);
        return;
      }

      // Get current session
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setUser(null);
        setCredits(null);
        setLoading(false);
        return;
      }

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (profileError) {
        console.error("Profile fetch error:", profileError);
        setError("Failed to load profile");
        setLoading(false);
        return;
      }

      setUser({
        id: profile.id,
        email: profile.email || session.user.email || "",
        display_name: profile.display_name,
        subscription_status: profile.subscription_status || "active",
        subscription_tier: profile.subscription_tier || "free",
        monthly_quota: profile.monthly_quota || 30,
      });

      // Fetch credit balance
      const { data: creditData, error: creditError } = await supabase
        .from("credit_balances")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (creditError) {
        console.error("Credit fetch error:", creditError);
        // Don't error out completely, just set default credits
        setCredits({
          available_credits: profile.monthly_quota || 30,
          used_this_period: 0,
          rollover_credits: 0,
          topup_credits: 0,
          period_start: new Date().toISOString(),
          period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });
      } else {
        setCredits(creditData);
      }

      setLoading(false);
    } catch (err) {
      console.error("Fetch user data error:", err);
      setError("An unexpected error occurred");
      setLoading(false);
    }
  }, [supabase]);

  const signOut = useCallback(async () => {
    if (!supabase) return;

    await supabase.auth.signOut();
    setUser(null);
    setCredits(null);
    router.push("/login");
    router.refresh();
  }, [supabase, router]);

  useEffect(() => {
    fetchUserData();

    // Listen for auth changes
    if (!supabase) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string) => {
      if (event === "SIGNED_IN") {
        fetchUserData();
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setCredits(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserData, supabase]);

  return (
    <UserContext.Provider
      value={{
        user,
        credits,
        loading,
        error,
        refetch: fetchUserData,
        signOut,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}

"use client";

import { useEffect, useRef } from "react";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import {
  buildExtensionAuthPayload,
  fetchExtensionProfileData,
  getTrustedExtensionIds,
  sendMessageToExtension,
} from "@/lib/extension-handoff";

const SYNC_DEBOUNCE_MS = 500;

export function ExtensionTokenSync() {
  const lastDispatchedAccessTokenRef = useRef<string | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    const extensionIds = getTrustedExtensionIds();
    if (extensionIds.length === 0) return;

    const broadcast = (payload: unknown) => {
      for (const id of extensionIds) {
        sendMessageToExtension(id, payload);
      }
    };

    const syncSession = async (session: Session) => {
      // Skip duplicate sends triggered by multiple tabs / quick event bursts.
      if (lastDispatchedAccessTokenRef.current === session.access_token) return;
      lastDispatchedAccessTokenRef.current = session.access_token;

      const profileData = await fetchExtensionProfileData(supabase, session.user.id);
      const payload = buildExtensionAuthPayload(session, profileData);
      broadcast(payload);
    };

    const scheduleSync = (session: Session) => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        void syncSession(session);
      }, SYNC_DEBOUNCE_MS);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (event === "SIGNED_OUT") {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        lastDispatchedAccessTokenRef.current = null;
        broadcast({ type: "LOGOUT" });
        return;
      }

      if ((event === "TOKEN_REFRESHED" || event === "SIGNED_IN") && session) {
        scheduleSync(session);
      }
    });

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      subscription.unsubscribe();
    };
  }, []);

  return null;
}

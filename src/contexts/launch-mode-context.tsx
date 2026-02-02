"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface LaunchModeSettings {
  isPreLaunch: boolean;
  allowSignups: boolean;
  isLoading: boolean;
}

const LaunchModeContext = createContext<LaunchModeSettings>({
  isPreLaunch: true,
  allowSignups: false,
  isLoading: true,
});

export function LaunchModeProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<LaunchModeSettings>({
    isPreLaunch: true,
    allowSignups: false,
    isLoading: true,
  });

  useEffect(() => {
    async function fetchLaunchMode() {
      try {
        const response = await fetch("/api/settings/launch-mode");
        const data = await response.json();
        setSettings({
          isPreLaunch: data.is_pre_launch ?? true,
          allowSignups: data.allow_signups ?? false,
          isLoading: false,
        });
      } catch (error) {
        console.error("Failed to fetch launch mode:", error);
        // Default to pre-launch mode on error
        setSettings({
          isPreLaunch: true,
          allowSignups: false,
          isLoading: false,
        });
      }
    }

    fetchLaunchMode();
  }, []);

  return (
    <LaunchModeContext.Provider value={settings}>
      {children}
    </LaunchModeContext.Provider>
  );
}

export function useLaunchMode() {
  return useContext(LaunchModeContext);
}

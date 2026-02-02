"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/theme-context";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "relative p-2 rounded-lg hover:bg-accent transition-colors",
        className
      )}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      <Sun className={cn(
        "w-5 h-5 transition-all",
        theme === "dark" ? "scale-100 rotate-0" : "scale-0 -rotate-90 absolute"
      )} />
      <Moon className={cn(
        "w-5 h-5 transition-all",
        theme === "light" ? "scale-100 rotate-0" : "scale-0 rotate-90 absolute"
      )} />
    </button>
  );
}

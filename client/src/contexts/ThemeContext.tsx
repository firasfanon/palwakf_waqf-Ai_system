import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Theme = "comfort-light" | "dark";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  forcedTheme?: Theme | null;
  switchable?: boolean;
  storageKey?: string;
}

/**
 * Theme Freeze Patch
 * - Freeze the app to a single central theme temporarily.
 * - Keep the old API shape so existing components keep working.
 * - toggleTheme/setTheme become safe no-ops outside the frozen comfort-light theme.
 */
export function ThemeProvider({
  children,
  defaultTheme = "comfort-light",
}: ThemeProviderProps) {
  const [theme] = useState<Theme>(defaultTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark");
    root.setAttribute("data-theme", "pwf-comfort-light");
    root.setAttribute("dir", "rtl");
    root.setAttribute("lang", "ar");
    document.body.setAttribute("dir", "rtl");
    document.body.classList.add("rtl-app");
  }, []);

  const setTheme = useMemo(() => {
    return (_theme: Theme) => {
      // theme switching intentionally frozen for now
      const root = document.documentElement;
      root.classList.remove("dark");
      root.setAttribute("data-theme", "pwf-comfort-light");
    };
  }, []);

  const toggleTheme = useMemo(() => {
    return () => {
      // theme switching intentionally frozen for now
      const root = document.documentElement;
      root.classList.remove("dark");
      root.setAttribute("data-theme", "pwf-comfort-light");
    };
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { trpc } from "@/lib/trpc";

type SiteSettings = {
  id: number;
  siteName: string;
  siteDescription: string | null;
  siteLanguage: string;
  primaryColor: string | null;
  secondaryColor: string | null;
  backgroundColor: string | null;
  textColor: string | null;
  accentColor: string | null;
  headingFont: string | null;
  bodyFont: string | null;
  baseFontSize: number | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  menuItems: string | null;
  footerText: string | null;
  showSocialLinks: boolean | null;
  socialLinks: string | null;
  theme: "light" | "dark" | "auto" | null;
  updatedAt: Date;
  updatedBy: number | null;
};

interface SiteSettingsContextType {
  settings: SiteSettings | undefined;
  isLoading: boolean;
  refetch: () => void;
}

const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined);

function isAdminRuntimeRoute(): boolean {
  try {
    const h = window.location.hash || "";
    if (h.includes("/admin")) return true;
    const p = window.location.pathname || "";
    return p.startsWith("/admin");
  } catch {
    return false;
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function parseHexColor(input: string) {
  const v = input.trim();
  const m3 = /^#?([0-9a-fA-F]{3})$/.exec(v);
  if (m3) {
    const raw = m3[1];
    const r = parseInt(raw[0] + raw[0], 16);
    const g = parseInt(raw[1] + raw[1], 16);
    const b = parseInt(raw[2] + raw[2], 16);
    return { r, g, b };
  }
  const m6 = /^#?([0-9a-fA-F]{6})$/.exec(v);
  if (!m6) return null;
  const raw = m6[1];
  const r = parseInt(raw.slice(0, 2), 16);
  const g = parseInt(raw.slice(2, 4), 16);
  const b = parseInt(raw.slice(4, 6), 16);
  return { r, g, b };
}

function rgbToHslTriplet(r: number, g: number, b: number) {
  let rn = r / 255;
  let gn = g / 255;
  let bn = b / 255;

  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      case bn:
        h = (rn - gn) / d + 4;
        break;
    }

    h *= 60;
  }

  const hh = Math.round(clamp(h, 0, 360));
  const ss = Math.round(clamp(s * 100, 0, 100));
  const ll = Math.round(clamp(l * 100, 0, 100));

  return `${hh} ${ss}% ${ll}%`;
}

function toHslTriplet(input?: string | null): string | null {
  if (!input) return null;
  const v = input.trim();
  if (/^\d{1,3}\s+\d{1,3}%\s+\d{1,3}%$/.test(v)) return v; // already a triplet
  const rgb = parseHexColor(v);
  if (rgb) return rgbToHslTriplet(rgb.r, rgb.g, rgb.b);
  return null;
}

function parseHslTriplet(triplet: string) {
  const m = /^\s*(\d{1,3})\s+(\d{1,3})%\s+(\d{1,3})%\s*$/.exec(triplet);
  if (!m) return null;
  return {
    h: clamp(parseInt(m[1], 10), 0, 360),
    s: clamp(parseInt(m[2], 10), 0, 100),
    l: clamp(parseInt(m[3], 10), 0, 100),
  };
}

function hslTriplet(h: number, s: number, l: number) {
  return `${Math.round(clamp(h, 0, 360))} ${Math.round(clamp(s, 0, 100))}% ${Math.round(clamp(l, 0, 100))}%`;
}

function tweakTriplet(
  base: string,
  opts: { dl?: number; capS?: number; sMult?: number; addS?: number } = {}
) {
  const p = parseHslTriplet(base);
  if (!p) return null;

  let s = p.s;
  if (typeof opts.sMult === "number") s = s * opts.sMult;
  if (typeof opts.addS === "number") s = s + opts.addS;
  if (typeof opts.capS === "number") s = Math.min(s, opts.capS);

  const l = p.l + (opts.dl ?? 0);
  return hslTriplet(p.h, s, l);
}

function clearInlineThemeOverrides() {
  const root = document.documentElement;
  const keys = [
    // brand base
    "--pwf-blue",
    "--pwf-gold",
    "--pwf-red",

    // semantic tokens
    "--background",
    "--foreground",
    "--card",
    "--card-foreground",
    "--popover",
    "--popover-foreground",
    "--primary",
    "--primary-foreground",
    "--secondary",
    "--secondary-foreground",
    "--muted",
    "--muted-foreground",
    "--accent",
    "--accent-foreground",
    "--destructive",
    "--destructive-foreground",
    "--border",
    "--input",
    "--ring",

    // sidebar tokens
    "--sidebar",
    "--sidebar-foreground",
    "--sidebar-accent",
    "--sidebar-accent-foreground",
    "--sidebar-border",
    "--sidebar-ring",
  ];
  for (const k of keys) root.style.removeProperty(k);
}

function applyPublicThemeTokens(settings: SiteSettings, isDarkMode: boolean) {
  const root = document.documentElement;

  const primary = toHslTriplet(settings.primaryColor);
  const secondary = toHslTriplet(settings.secondaryColor);
  const accent = toHslTriplet(settings.accentColor);
  const background = toHslTriplet(settings.backgroundColor);
  const foreground = toHslTriplet(settings.textColor);

  // Brand colors always apply (public + dark/light)
  if (primary) {
    root.style.setProperty("--pwf-blue", primary);
    root.style.setProperty("--primary", primary);
    root.style.setProperty("--ring", primary);
    root.style.setProperty("--sidebar-ring", primary);
  }
  if (secondary) {
    root.style.setProperty("--pwf-gold", secondary);
    root.style.setProperty("--secondary", secondary);
  }
  if (accent) {
    // Accent is a brand highlight (NOT destructive)
    root.style.setProperty("--accent", accent);
  }

  // Surface palette: apply ONLY in Light mode so Dark mode stays stable.
  // This makes the homepage/public pages visibly change when a preset is applied.
  if (!isDarkMode) {
    if (background) {
      root.style.setProperty("--background", background);

      // Cards/Popovers (slightly lifted from background)
      const card = tweakTriplet(background, { dl: +4, capS: 18, sMult: 0.4 }) ?? background;
      root.style.setProperty("--card", card);
      root.style.setProperty("--popover", card);

      // Muted surfaces + borders
      const muted = tweakTriplet(background, { dl: -2, capS: 18, sMult: 0.35 }) ?? background;
      const border = tweakTriplet(background, { dl: -8, capS: 20, sMult: 0.25 }) ?? "214 32% 91%";
      root.style.setProperty("--muted", muted);
      root.style.setProperty("--border", border);
      root.style.setProperty("--input", border);

      // Sidebar (light): slightly different than page background
      const sidebar = tweakTriplet(background, { dl: +2, capS: 18, sMult: 0.35 }) ?? background;
      const sidebarAccent = tweakTriplet(background, { dl: -1, capS: 18, sMult: 0.35 }) ?? muted;
      root.style.setProperty("--sidebar", sidebar);
      root.style.setProperty("--sidebar-accent", sidebarAccent);
      root.style.setProperty("--sidebar-border", border);
    }

    if (foreground) {
      root.style.setProperty("--foreground", foreground);
      root.style.setProperty("--card-foreground", foreground);
      root.style.setProperty("--popover-foreground", foreground);
      root.style.setProperty("--sidebar-foreground", foreground);
    }
  }
}

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const { data: settings, isLoading, refetch } = trpc.siteSettings.get.useQuery();

  const [routeTick, setRouteTick] = useState(0);
  useEffect(() => {
    const bump = () => setRouteTick((t) => t + 1);
    window.addEventListener("hashchange", bump);
    window.addEventListener("popstate", bump);
    return () => {
      window.removeEventListener("hashchange", bump);
      window.removeEventListener("popstate", bump);
    };
  }, []);

  // Track light/dark changes (ThemeProvider toggles html.dark)
  const [themeTick, setThemeTick] = useState(0);
  useEffect(() => {
    const root = document.documentElement;
    const obs = new MutationObserver(() => setThemeTick((t) => t + 1));
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  const isAdmin = useMemo(() => isAdminRuntimeRoute(), [routeTick]);
  const isDarkMode = useMemo(() => document.documentElement.classList.contains("dark"), [themeTick]);

  useEffect(() => {
    if (!settings) return;
    const root = document.documentElement;

    // CRITICAL:
    // - Tokens are consumed as: hsl(var(--background))
    // - Writing HEX into tokens breaks CSS and can cause "white" UI.
    // Rules:
    // - Admin: NEVER apply DB color overrides. Clear any leftovers.
    // - Public: Apply presets (brand + surfaces in light mode).
    if (isAdmin) {
      clearInlineThemeOverrides();
    } else {
      clearInlineThemeOverrides();
      applyPublicThemeTokens(settings, isDarkMode);
    }

    // Typography
    if (settings.headingFont) root.style.setProperty("--font-heading", settings.headingFont);
    if (settings.bodyFont) root.style.setProperty("--font-body", settings.bodyFont);
    if (settings.baseFontSize) root.style.setProperty("--font-size-base", `${settings.baseFontSize}px`);

    // Metadata
    if (settings.siteName) document.title = settings.siteName;

    if (settings.siteDescription) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement("meta");
        metaDesc.setAttribute("name", "description");
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute("content", settings.siteDescription);
    }

    if (settings.faviconUrl) {
      let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (!favicon) {
        favicon = document.createElement("link");
        favicon.rel = "icon";
        document.head.appendChild(favicon);
      }
      favicon.href = settings.faviconUrl;
    }

    // Optional: load fonts if they are not already bundled
    const fontsToLoad: string[] = [];
    if (settings.headingFont) {
      const fontName = settings.headingFont.split("'")[1] || settings.headingFont.split('"')[1] || settings.headingFont;
      if (fontName && !fontName.includes("sans-serif") && !fontName.includes("serif")) fontsToLoad.push(fontName);
    }
    if (settings.bodyFont) {
      const fontName = settings.bodyFont.split("'")[1] || settings.bodyFont.split('"')[1] || settings.bodyFont;
      if (
        fontName &&
        !fontName.includes("sans-serif") &&
        !fontName.includes("serif") &&
        !fontsToLoad.includes(fontName)
      ) {
        fontsToLoad.push(fontName);
      }
    }

    if (fontsToLoad.length > 0) {
      const existingLink = document.querySelector("link[data-google-fonts]");
      if (existingLink) existingLink.remove();

      const fontLink = document.createElement("link");
      fontLink.rel = "stylesheet";
      fontLink.setAttribute("data-google-fonts", "true");
      const fontFamilies = fontsToLoad.map((f) => f.replace(/ /g, "+")).join("&family=");
      fontLink.href = `https://fonts.googleapis.com/css2?family=${fontFamilies}&display=swap`;
      document.head.appendChild(fontLink);
    }
  }, [settings, isAdmin, isDarkMode]);

  return <SiteSettingsContext.Provider value={{ settings, isLoading, refetch }}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings() {
  const context = useContext(SiteSettingsContext);
  if (context === undefined) {
    throw new Error("useSiteSettings must be used within a SiteSettingsProvider");
  }
  return context;
}

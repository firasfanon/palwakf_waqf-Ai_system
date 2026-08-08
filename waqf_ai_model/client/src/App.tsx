import React, { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Router, Route, Switch } from "wouter";
import { useHybridLocation } from "./lib/useHybridLocation";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Navbar from "./components/Navbar";
import Home from "@/pages/Home";
import References from "@/pages/References";
import Chat from "@/pages/Chat";
import Bookmarks from "@/pages/Bookmarks";
import FavoriteConversations from "@/pages/FavoriteConversations";
import ExportData from "@/pages/ExportData";
import Stats from "@/pages/Stats";
import FAQs from "@/pages/FAQs";
import AboutUs from "@/pages/AboutUs";
import ContactUs from "@/pages/ContactUs";
import Search from "@/pages/Search";
import Knowledge from "@/pages/Knowledge";
import KnowledgeDetails from "@/pages/KnowledgeDetails";
import AdvancedSearch from "@/pages/AdvancedSearch";

import { adminRouteEntries } from "@/config/adminRegistryV2";

import { SiteSettingsProvider, useSiteSettings } from "./contexts/SiteSettingsContext";
import Footer from "./components/Footer";
import AdminLayoutV2 from "./components/admin/AdminLayoutV2";
import ComingSoon from "./pages/ComingSoon";

function isAdminRuntimeRoute() {
  if (typeof window === "undefined") return false;
  const h = window.location.hash || "";
  const p = window.location.pathname || "";
  return h.includes("/admin") || p.startsWith("/admin");
}

function clearInlineSurfaceOverrides() {
  const root = document.documentElement;
  const keys = [
    "--background",
    "--foreground",
    "--card",
    "--card-foreground",
    "--popover",
    "--popover-foreground",
    "--muted",
    "--muted-foreground",
    "--border",
    "--input",
    "--ring",
    "--sidebar",
    "--sidebar-foreground",
    "--sidebar-accent",
    "--sidebar-accent-foreground",
    "--sidebar-border",
    "--sidebar-ring",
  ];
  for (const k of keys) root.style.removeProperty(k);
}

// STRICT: Ensure Admin identity styles apply (without hijacking theme toggle).
function useAdminScopeBootstrap() {
  useEffect(() => {
    const isAdmin = isAdminRuntimeRoute();
    const body = document.body;

    if (isAdmin) {
      body.classList.add("admin-scope");
      // Admin must never inherit broken inline HEX overrides from Public.
      clearInlineSurfaceOverrides();
    } else {
      body.classList.remove("admin-scope");
    }
  });
}

// Admin Router - handles ALL /admin/* routes
function AdminRouter() {
  return (
    <AdminLayoutV2>
      <Switch>
        {adminRouteEntries.map(({ path, component }) => (
          <Route key={path} path={path} component={component} />
        ))}
        <Route component={() => <ComingSoon title="الصفحة غير موجودة" />} />
      </Switch>
    </AdminLayoutV2>
  );
}

// Public Router - handles ALL public routes (UNCHANGED)
function PublicRouter() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/references" component={References} />
          <Route path="/chat" component={Chat} />
          <Route path="/bookmarks" component={Bookmarks} />
          <Route path="/favorites" component={FavoriteConversations} />
          <Route path="/export" component={ExportData} />
          <Route path="/stats" component={Stats} />
          <Route path="/faqs" component={FAQs} />
          <Route path="/about" component={AboutUs} />
          <Route path="/contact" component={ContactUs} />
          <Route path="/search" component={Search} />
          <Route path="/knowledge" component={Knowledge} />
          <Route path="/advanced-search" component={AdvancedSearch} />
          <Route path="/knowledge/:id" component={KnowledgeDetails} />
          <Route path="/404" component={NotFound} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

// ThemeShell - provides theme switching, without forcing a locked theme.
function ThemeShell({ children }: { children: React.ReactNode }) {
  const { settings } = useSiteSettings();

  // ThemeShell sits outside Router, so we track route changes manually.
  // Admin must be dark by default and must NOT inherit the public theme storage.
  const [isAdminScope, setIsAdminScope] = useState(() => isAdminRuntimeRoute());

  useEffect(() => {
    const onRouteChange = () => setIsAdminScope(isAdminRuntimeRoute());
    window.addEventListener("hashchange", onRouteChange);
    window.addEventListener("popstate", onRouteChange);
    return () => {
      window.removeEventListener("hashchange", onRouteChange);
      window.removeEventListener("popstate", onRouteChange);
    };
  }, []);

  // Public can be forced by Site Settings. Admin remains independent to prevent accidental overrides.
  const forcedTheme =
    !isAdminScope && settings?.theme && settings.theme !== "auto" ? (settings.theme as any) : null;

  const defaultTheme = isAdminScope
    ? "dark"
    : settings?.theme === "light" || settings?.theme === "dark"
      ? (settings.theme as any)
      : "light";

  const storageKey = isAdminScope ? "pwf-theme-admin" : "pwf-theme-public";

  return (
    <ThemeProvider
      defaultTheme={defaultTheme}
      forcedTheme={forcedTheme}
      switchable={true}
      storageKey={storageKey}
    >
      {children}
    </ThemeProvider>
  );
}

// Top-level Router - separates Admin from Public (NO CONDITIONALS!)
function AppRouter() {
  return (
    <Switch>
      {/* Admin catch-all - matches /admin and /admin/* */}
      <Route path="/admin/*" component={AdminRouter} />
      <Route path="/admin" component={AdminRouter} />

      {/* Public routes - everything else */}
      <Route component={PublicRouter} />
    </Switch>
  );
}

function App() {
  useAdminScopeBootstrap();

  return (
    <ErrorBoundary>
      <SiteSettingsProvider>
        <ThemeShell>
          <TooltipProvider>
            <Router hook={useHybridLocation}>
              <AppRouter />
            </Router>
            <Toaster />
          </TooltipProvider>
        </ThemeShell>
      </SiteSettingsProvider>
    </ErrorBoundary>
  );
}

export default App;

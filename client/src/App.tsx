import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import { Router, Route, Switch } from "wouter";
import { useHybridLocation } from "./lib/useHybridLocation";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Navbar from "./components/Navbar";















import { adminRouteEntries } from "@/config/adminRegistryV2";

import { SiteSettingsProvider, useSiteSettings } from "./contexts/SiteSettingsContext";
import Footer from "./components/Footer";

const NotFound = React.lazy(() => import("@/pages/NotFound"));
const Home = React.lazy(() => import("@/pages/Home"));
const References = React.lazy(() => import("@/pages/References"));
const Chat = React.lazy(() => import("@/pages/Chat"));
const Bookmarks = React.lazy(() => import("@/pages/Bookmarks"));
const FavoriteConversations = React.lazy(() => import("@/pages/FavoriteConversations"));
const ExportData = React.lazy(() => import("@/pages/ExportData"));
const Stats = React.lazy(() => import("@/pages/Stats"));
const FAQs = React.lazy(() => import("@/pages/FAQs"));
const AboutUs = React.lazy(() => import("@/pages/AboutUs"));
const ContactUs = React.lazy(() => import("@/pages/ContactUs"));
const Search = React.lazy(() => import("@/pages/Search"));
const Knowledge = React.lazy(() => import("@/pages/Knowledge"));
const KnowledgeDetails = React.lazy(() => import("@/pages/KnowledgeDetails"));
const AdvancedSearch = React.lazy(() => import("@/pages/AdvancedSearch"));
const ComingSoon = React.lazy(() => import("./pages/ComingSoon"));
import AdminLayoutV2 from "./components/admin/AdminLayoutV2";


function isAdminRuntimeRoute() {
  if (typeof window === "undefined") return false;
  const h = window.location.hash || "";
  const p = window.location.pathname || "";
  return h.includes("/admin") || p.startsWith("/admin");
}

function clearInlineThemeOverrides() {
  // Mega Batch A: global surface tokens remain intact.
  // Admin-specific presentation is handled by the scope stylesheet.
}

// STRICT: Ensure Admin identity styles apply (without hijacking theme toggle).
function useAdminScopeBootstrap() {
  useEffect(() => {
    const isAdmin = isAdminRuntimeRoute();
    const body = document.body;

    if (isAdmin) {
      body.classList.add("admin-scope");
      // Admin must never inherit broken inline HEX overrides from Public.
      clearInlineThemeOverrides();
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
          <Route path="/knowledge-base/:id" component={KnowledgeDetails} />
          <Route path="/knowledge-base" component={Knowledge} />
          {/* Legacy aliases kept to avoid breaking old DB/server URLs. */}
          <Route path="/knowledge/:id" component={KnowledgeDetails} />
          <Route path="/knowledge" component={Knowledge} />
          <Route path="/advanced-search" component={AdvancedSearch} />
          <Route path="/404" component={NotFound} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

// ThemeShell - theme switching is frozen temporarily to consolidate surfaces.
function ThemeShell({ children }: { children: React.ReactNode }) {
  useSiteSettings();

  return (
    <ThemeProvider defaultTheme="comfort-light" forcedTheme="comfort-light" switchable={false} storageKey="pwf-theme-comfort-light-frozen">
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
            <React.Suspense fallback={<div className="p-6 text-sm text-muted-foreground" role="status" aria-live="polite">جارٍ تحميل الواجهة…</div>}>
              <Router hook={useHybridLocation}>
                <AppRouter />
              </Router>
            </React.Suspense>
            <Toaster />
          </TooltipProvider>
        </ThemeShell>
      </SiteSettingsProvider>
    </ErrorBoundary>
  );
}

export default App;

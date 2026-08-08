import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import "./index.css";
// STRICT: ensure admin identity styles are loaded at runtime
import "./styles/admin.css";
import "./styles/operational-foundation.css";

/**
 * EARLY THEME BOOTSTRAP
 * Freeze the app to a single central theme until surface cleanup is complete.
 */
(() => {
  const root = document.documentElement;
  root.classList.remove("dark");
  root.setAttribute("data-theme", "pwf-comfort-light");
})();

/**
 * Optional analytics is loaded only when both public runtime values are present.
 * This keeps an unset VITE_ANALYTICS_ENDPOINT from becoming a broken /umami
 * script request that returns the SPA HTML document.
 */
function loadOptionalAnalytics(): void {
  const endpoint = String(import.meta.env.VITE_ANALYTICS_ENDPOINT ?? '').trim().replace(/\/+$/, '');
  const websiteId = String(import.meta.env.VITE_ANALYTICS_WEBSITE_ID ?? '').trim();

  if (!endpoint || !websiteId) return;

  let analyticsBase: URL;
  try {
    analyticsBase = new URL(endpoint);
  } catch {
    return;
  }

  if (analyticsBase.protocol !== 'https:' && analyticsBase.protocol !== 'http:') return;
  if (document.querySelector('script[data-pwf-analytics="umami"]')) return;

  const script = document.createElement('script');
  script.defer = true;
  script.src = new URL('umami', `${analyticsBase.toString().replace(/\/$/, '')}/`).toString();
  script.dataset.websiteId = websiteId;
  script.dataset.pwfAnalytics = 'umami';
  document.body.appendChild(script);
}

loadOptionalAnalytics();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Default cache time: 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed queries once
      retry: 1,
      // Don't refetch on window focus for better UX
      refetchOnWindowFocus: false,
      // Refetch on mount if data is stale
      refetchOnMount: true,
    },
  },
});

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  window.location.href = getLoginUrl();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </trpc.Provider>
  </HelmetProvider>
);

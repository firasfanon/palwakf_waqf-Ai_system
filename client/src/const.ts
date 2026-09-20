export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { redirectTargetFromHybridAddress } from "@/lib/hybridLocationPath";

const isExternalOAuthEnabled = () => {
  const explicit = import.meta.env.VITE_EXTERNAL_OAUTH_ENABLED;
  return explicit === "1" || explicit === "true";
};

const isLocalAuthEnabled = () => {
  const explicit = import.meta.env.VITE_LOCAL_AUTH_ENABLED;
  if (explicit === "1" || explicit === "true") return true;
  if (!isExternalOAuthEnabled()) return true;
  return !import.meta.env.VITE_OAUTH_PORTAL_URL || !import.meta.env.VITE_APP_ID;
};

export const isHashRoutingEnabled = () => {
  if (typeof window === "undefined") return false;
  const envFlag = String(import.meta.env.VITE_FORCE_HASH_ROUTING || "").trim().toLowerCase();
  const hasHashPath = (window.location.hash || "").startsWith("#/");
  return envFlag === "1" || envFlag === "true" || hasHashPath;
};

const normalizeAppPath = (path: string) => {
  if (!path) return "/";

  // Accept either pure app paths (/chat), hash paths (#/chat), or accidental
  // full hash URLs (/knowledge#/chat).  The router must only receive the
  // internal route segment after #, otherwise routes like /knowledge#/knowledge
  // can be treated as a literal path and fall through to 404.
  const hashIndex = path.indexOf("#");
  const candidate = hashIndex >= 0 ? path.slice(hashIndex + 1) : path;
  const clean = candidate.split("#")[0] || "/";
  return clean.startsWith("/") ? clean : `/${clean}`;
};

export const getHashRoutingBasePath = () => {
  if (typeof window === "undefined") {
    const envBase = String(import.meta.env.VITE_HASH_APP_BASE_PATH || import.meta.env.VITE_APP_BASE_PATH || "/knowledge").trim();
    return normalizeAppPath(envBase || "/knowledge");
  }

  const envBase = String(import.meta.env.VITE_HASH_APP_BASE_PATH || import.meta.env.VITE_APP_BASE_PATH || "").trim();
  if (envBase) return normalizeAppPath(envBase);

  const pathname = window.location.pathname || "/";
  if (pathname === "/knowledge" || pathname.startsWith("/knowledge/")) return "/knowledge";
  if (pathname.startsWith("/client/") || pathname.endsWith(".tsx") || pathname.endsWith(".ts") || pathname === "/") {
    return "/knowledge";
  }

  return pathname;
};

export const getAppHref = (path: string) => {
  const normalized = normalizeAppPath(path);
  if (!isHashRoutingEnabled()) return normalized;
  return `${getHashRoutingBasePath()}#${normalized}`;
};

export const getAppRedirectTarget = (path?: string) => {
  if (typeof window === "undefined") return path || "/";

  const hashRoutingEnabled = isHashRoutingEnabled();
  const currentTarget = redirectTargetFromHybridAddress(
    window.location.hash || "",
    window.location.pathname || "/",
    window.location.search || "",
    hashRoutingEnabled,
  );
  const normalized = normalizeAppPath(path || currentTarget || "/");

  if (!hashRoutingEnabled) return normalized;
  return `${getHashRoutingBasePath()}#${normalized}`;
};

const encodeOAuthState = (redirect: string) => {
  return btoa(JSON.stringify({ redirect }));
};

export const getLoginUrl = (redirectOverride?: string) => {
  const currentRedirect = getAppRedirectTarget();
  const redirect = getAppRedirectTarget(redirectOverride || currentRedirect || "/");

  if (isLocalAuthEnabled()) {
    return `/api/auth/dev-login?redirect=${encodeURIComponent(redirect || "/")}`;
  }

  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = encodeOAuthState(redirect || "/");

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};

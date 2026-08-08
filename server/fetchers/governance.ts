/**
 * Fetch Governance (Robots + Rate limit + Allowlist)
 * حوكمة الجلب: احترام robots.txt + rate limiting + allowlist
 *
 * الهدف: منع الانهيار ومنع جلب غير منضبط/غير مصرح به.
 */

export interface FetchGovernance {
  /** User-Agent used in HTTP requests */
  userAgent?: string;
  /** Respect robots.txt for the target host */
  respectRobots?: boolean;
  /** Minimum delay between requests per host */
  rateLimitMs?: number;
  /** Allowed domains (pilot allowlist). If provided and non-empty, URL host must match one of these. */
  allowedDomains?: string[];
  /** Timeout for each request */
  timeoutMs?: number;
  /** Maximum bytes for PDF download */
  maxBytes?: number;
}

type RobotsRules = {
  fetchedAt: number;
  allow: string[];
  disallow: string[];
};

const robotsCache = new Map<string, RobotsRules>();
const hostLastHit = new Map<string, number>();

function normalizeHost(host: string) {
  return host.toLowerCase().replace(/^www\./, "");
}

function isHostAllowed(host: string, allowed?: string[]) {
  if (!allowed || allowed.length === 0) return true;
  const h = normalizeHost(host);
  return allowed.some((d) => {
    const dd = normalizeHost(d);
    return h === dd || h.endsWith("." + dd);
  });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pathMatches(rulePath: string, urlPath: string) {
  // Minimal robots matcher: prefix match only (safe, simple).
  if (!rulePath) return false;
  if (rulePath === "/") return true;
  return urlPath.startsWith(rulePath);
}

async function fetchRobotsTxt(origin: string, userAgent: string, timeoutMs: number): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(new URL("/robots.txt", origin).toString(), {
      headers: { "User-Agent": userAgent },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function parseRobots(robotsTxt: string): RobotsRules {
  // Minimal parser supporting: User-agent, Disallow, Allow.
  // We intentionally only apply the '*' group.
  const lines = robotsTxt
    .split(/\r?\n/)
    .map((l) => l.split("#")[0].trim())
    .filter(Boolean);

  let inStarGroup = false;
  const allow: string[] = [];
  const disallow: string[] = [];

  for (const line of lines) {
    const [rawKey, ...rest] = line.split(":");
    const key = rawKey.trim().toLowerCase();
    const value = rest.join(":").trim();

    if (key === "user-agent") {
      inStarGroup = value === "*";
      continue;
    }

    if (!inStarGroup) continue;

    if (key === "allow") {
      allow.push(value || "/");
    } else if (key === "disallow") {
      // empty disallow means allow all
      if (value) disallow.push(value);
    }
  }

  return {
    fetchedAt: Date.now(),
    allow,
    disallow,
  };
}

async function getRobotsRules(origin: string, governance: FetchGovernance): Promise<RobotsRules | null> {
  const ua = governance.userAgent || "PalWakfBot/1.0";
  const timeoutMs = governance.timeoutMs ?? 15000;

  const host = normalizeHost(new URL(origin).host);
  const cached = robotsCache.get(host);

  // 12 hours cache
  if (cached && Date.now() - cached.fetchedAt < 12 * 60 * 60 * 1000) {
    return cached;
  }

  const txt = await fetchRobotsTxt(origin, ua, timeoutMs);
  if (!txt) return null;

  const rules = parseRobots(txt);
  robotsCache.set(host, rules);
  return rules;
}

async function applyRateLimit(origin: string, governance: FetchGovernance) {
  const host = normalizeHost(new URL(origin).host);
  const minDelay = governance.rateLimitMs ?? 1000;

  const last = hostLastHit.get(host);
  if (last) {
    const wait = minDelay - (Date.now() - last);
    if (wait > 0) await sleep(wait);
  }

  hostLastHit.set(host, Date.now());
}

export async function governedFetch(url: string, init: RequestInit = {}, governance: FetchGovernance = {}) {
  const u = new URL(url);
  const ua = governance.userAgent || "PalWakfBot/1.0";
  const timeoutMs = governance.timeoutMs ?? 15000;

  // Pilot allowlist
  if (!isHostAllowed(u.host, governance.allowedDomains)) {
    throw new Error(`Domain not allowed (pilot): ${u.host}`);
  }

  // Robots
  if (governance.respectRobots) {
    const rules = await getRobotsRules(u.origin, governance);
    if (rules) {
      const path = u.pathname;
      const isAllowedByAllow = rules.allow.some((p) => pathMatches(p, path));
      const isBlockedByDisallow = rules.disallow.some((p) => pathMatches(p, path));

      // If both match, Allow wins (common robots convention)
      if (isBlockedByDisallow && !isAllowedByAllow) {
        throw new Error(`Blocked by robots.txt: ${u.origin}${path}`);
      }
    }
  }

  // Rate limit
  await applyRateLimit(u.origin, governance);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers = new Headers(init.headers || {});
    if (!headers.has("User-Agent")) headers.set("User-Agent", ua);
    if (!headers.has("Accept")) headers.set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8");

    const res = await fetch(url, {
      ...init,
      headers,
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}
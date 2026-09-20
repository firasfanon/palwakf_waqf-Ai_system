import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";
import { sdk } from "./sdk";
import { findPlatformAdminUser } from "../platform/authBridge";
import { isPlatformBridgeConfigured } from "../platform/config";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

function sanitizeRedirect(value: string | undefined): string {
  if (!value) return ENV.localAuthDefaultRedirect;
  if (!value.startsWith("/")) return ENV.localAuthDefaultRedirect;
  if (value.startsWith("//")) return ENV.localAuthDefaultRedirect;
  return value;
}

function decodeRedirectFromState(state: string | undefined): string | undefined {
  if (!state) return undefined;
  try {
    const decoded = Buffer.from(state, "base64").toString("utf-8");
    const parsed = JSON.parse(decoded);
    return typeof parsed?.redirect === "string" ? parsed.redirect : undefined;
  } catch {
    try {
      return Buffer.from(state, "base64").toString("utf-8");
    } catch {
      return undefined;
    }
  }
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/auth/dev-login", async (req: Request, res: Response) => {
    if (!ENV.localAuthEnabled) {
      res.status(404).json({ error: "Local auth is disabled" });
      return;
    }

    try {
      if (!isPlatformBridgeConfigured()) {
        const sessionToken = await sdk.createSessionToken(ENV.localAuthOpenId, {
          name: ENV.localAuthName,
          expiresInMs: ONE_YEAR_MS,
          email: ENV.localAuthEmail,
          role: ENV.localAuthRole === "admin" ? "admin" : "user",
          source: "local_users",
        });
        const cookieOptions = getSessionCookieOptions(req);
        res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        res.redirect(302, sanitizeRedirect(getQueryParam(req, "redirect")));
        return;
      }

      const platformUser = await findPlatformAdminUser({
        authUserId: ENV.localAuthOpenId,
        openId: ENV.localAuthOpenId,
        email: ENV.localAuthEmail,
      });

      if (!platformUser) {
        res.status(403).json({ error: "Local auth user is not allowed by platform admin_users" });
        return;
      }

      const sessionToken = await sdk.createSessionToken(platformUser.openId, {
        name: platformUser.name ?? ENV.localAuthName,
        expiresInMs: ONE_YEAR_MS,
        email: platformUser.email ?? ENV.localAuthEmail,
        role: platformUser.role,
        platformRole: platformUser.platformRole ?? undefined,
        unitId: platformUser.unitId == null ? undefined : String(platformUser.unitId),
        authUserId: platformUser.authUserId ?? undefined,
        platformUserId: platformUser.platformUserId ?? undefined,
        source: platformUser.source,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, sanitizeRedirect(getQueryParam(req, "redirect")));
    } catch (error) {
      console.error("[Local Auth] Login failed", error);
      res.status(500).json({ error: "Local auth login failed" });
    }
  });

  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    if (ENV.localAuthEnabled || !ENV.externalOAuthEnabled || !ENV.oAuthServerUrl) {
      res.redirect(302, sanitizeRedirect(decodeRedirectFromState(getQueryParam(req, "state"))));
      return;
    }

    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      if (!isPlatformBridgeConfigured()) {
        res.status(503).json({ error: "Platform bridge is not configured for platform user authentication" });
        return;
      }

      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      const platformUser = await findPlatformAdminUser({
        authUserId: userInfo.openId,
        openId: userInfo.openId,
        email: userInfo.email ?? undefined,
      });

      if (!platformUser) {
        res.status(403).json({ error: "Authenticated user is not present in platform admin_users" });
        return;
      }

      const sessionToken = await sdk.createSessionToken(platformUser.openId, {
        name: platformUser.name || userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
        email: platformUser.email ?? userInfo.email ?? undefined,
        role: platformUser.role,
        platformRole: platformUser.platformRole ?? undefined,
        unitId: platformUser.unitId == null ? undefined : String(platformUser.unitId),
        authUserId: platformUser.authUserId ?? undefined,
        platformUserId: platformUser.platformUserId ?? undefined,
        source: platformUser.source,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, sanitizeRedirect(decodeRedirectFromState(state)));
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

import { resolveDatabaseConfig } from "../config/databaseConfig";

const truthy = new Set(["1", "true", "yes", "on"]);
const isTruthy = (value: string | undefined) => typeof value === "string" && truthy.has(value.toLowerCase());

export const ENV = {
  appId: process.env.VITE_APP_ID ?? process.env.APP_ID ?? "palwakf-local",
  cookieSecret: process.env.JWT_SECRET ?? process.env.COOKIE_SECRET ?? "palwakf-local-dev-secret",
  databaseUrl: resolveDatabaseConfig().url,
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  externalOAuthEnabled:
    isTruthy(process.env.EXTERNAL_OAUTH_ENABLED) ||
    isTruthy(process.env.VITE_EXTERNAL_OAUTH_ENABLED),
  localAuthEnabled:
    isTruthy(process.env.LOCAL_AUTH_ENABLED) ||
    isTruthy(process.env.VITE_LOCAL_AUTH_ENABLED) ||
    !(isTruthy(process.env.EXTERNAL_OAUTH_ENABLED) || isTruthy(process.env.VITE_EXTERNAL_OAUTH_ENABLED)),
  localAuthOpenId: process.env.LOCAL_AUTH_OPEN_ID ?? "local-admin",
  localAuthName: process.env.LOCAL_AUTH_NAME ?? "Local Admin",
  localAuthEmail: process.env.LOCAL_AUTH_EMAIL ?? "admin@local.test",
  localAuthRole: process.env.LOCAL_AUTH_ROLE ?? "admin",
  localAuthDefaultRedirect: process.env.LOCAL_AUTH_DEFAULT_REDIRECT ?? "/",
  serviceApiUrl:
    process.env.OLLAMA_BASE_URL ??
    process.env.AI_PROVIDER_URL ??
    process.env.OPENAI_BASE_URL ??
    process.env.BUILT_IN_FORGE_API_URL ??
    "http://127.0.0.1:11434",
  serviceApiKey:
    process.env.OLLAMA_API_KEY ??
    process.env.AI_PROVIDER_API_KEY ??
    process.env.OPENAI_API_KEY ??
    process.env.BUILT_IN_FORGE_API_KEY ??
    "ollama",
  serviceModel:
    process.env.OLLAMA_MODEL ??
    process.env.AI_MODEL ??
    process.env.OPENAI_MODEL ??
    "qwen2.5:3b",
  publishSchedulerEnabled:
    isTruthy(process.env.PUBLISH_SCHEDULER_ENABLED) ||
    (process.env.NODE_ENV === "production" && !isTruthy(process.env.DISABLE_PUBLISH_SCHEDULER)),
  ownerNotificationsEnabled:
    isTruthy(process.env.OWNER_NOTIFICATIONS_ENABLED) ||
    (process.env.NODE_ENV === "production" && !isTruthy(process.env.DISABLE_OWNER_NOTIFICATIONS)),
};

export type PlatformBridgeConfig = {
  enabled: boolean;
  strict: boolean;
  url: string;
  serviceRoleKey: string;
  anonKey: string;
  projectRef?: string;
  objects: {
    adminUsers: { schema: string; table: string };
    orgUnits: { schema: string; table: string };
    waqfAssets: { schema: string; table: string };
    endowments: { schema: string; table: string };
    references?: { schema: string; table: string };
  };
};

const envFlag = (value: string | undefined, fallback = false) => {
  if (value == null || value === "") return fallback;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
};

export const platformBridgeConfig: PlatformBridgeConfig = {
  enabled: envFlag(process.env.PLATFORM_BRIDGE_ENABLED),
  strict: envFlag(process.env.PLATFORM_BRIDGE_STRICT),
  url: process.env.PLATFORM_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "",
  serviceRoleKey:
    process.env.PLATFORM_SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  anonKey: process.env.PLATFORM_SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? "",
  projectRef: process.env.PLATFORM_SUPABASE_PROJECT_REF,
  objects: {
    adminUsers: {
      schema: process.env.PLATFORM_ADMIN_SCHEMA ?? "public",
      table: process.env.PLATFORM_ADMIN_USERS_TABLE ?? "admin_users",
    },
    orgUnits: {
      schema: process.env.PLATFORM_CORE_SCHEMA ?? "core",
      table: process.env.PLATFORM_ORG_UNITS_TABLE ?? "org_units",
    },
    waqfAssets: {
      schema: process.env.PLATFORM_WAQF_SCHEMA ?? "waqf",
      table: process.env.PLATFORM_WAQF_ASSETS_TABLE ?? "waqf_assets",
    },
    endowments: {
      schema: process.env.PLATFORM_WAQF_SCHEMA ?? "waqf",
      table: process.env.PLATFORM_ENDOWMENTS_TABLE ?? "endowment_names",
    },
    references: {
      schema: process.env.PLATFORM_KNOWLEDGE_SCHEMA ?? "public",
      table: process.env.PLATFORM_REFERENCES_TABLE ?? "land_references",
    },
  },
};

export const isPlatformBridgeConfigured = () =>
  Boolean(platformBridgeConfig.url && (platformBridgeConfig.serviceRoleKey || platformBridgeConfig.anonKey));

export const requirePlatformBridgeConfig = () => {
  if (!isPlatformBridgeConfigured()) {
    throw new Error(
      "Platform bridge is not configured. Set PLATFORM_SUPABASE_URL and PLATFORM_SUPABASE_SERVICE_ROLE_KEY (or anon key) in .env."
    );
  }
  return platformBridgeConfig;
};

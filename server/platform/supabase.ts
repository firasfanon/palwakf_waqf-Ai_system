import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { platformBridgeConfig, isPlatformBridgeConfigured } from "./config";

let _platformClient: SupabaseClient | null = null;

export function getPlatformSupabaseClient() {
  if (!isPlatformBridgeConfigured()) return null;

  if (!_platformClient) {
    const key = platformBridgeConfig.serviceRoleKey || platformBridgeConfig.anonKey;
    _platformClient = createClient(platformBridgeConfig.url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          "x-platform-bridge": "palwakf-ai-local",
        },
      },
    });
  }

  return _platformClient;
}

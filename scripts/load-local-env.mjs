import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";

/**
 * Local bootstrap only.
 *
 * Existing process environment remains authoritative. When present, .env.local
 * is loaded first, then .env fills only still-missing values.
 * Both files are gitignored and must never be committed.
 */
export function loadLocalEnvFiles() {
  for (const file of [".env.local", ".env"]) {
    if (!existsSync(file)) continue;
    loadEnvFile(file);
  }
}

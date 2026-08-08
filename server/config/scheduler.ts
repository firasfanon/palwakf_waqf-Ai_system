/**
 * Scheduler configuration
 * Reads environment variables for scheduler control
 */

export const SCHEDULER_SECRET = process.env.SCHEDULER_SECRET || "";
export const SCHEDULER_ENABLED = process.env.SCHEDULER_ENABLED !== "false";

export const schedulerConfig = {
  // Secret token for triggering scheduled runs via HTTP
  secret: process.env.SCHEDULER_SECRET || "",
  
  // Enable/disable scheduler (default: true)
  enabled: process.env.SCHEDULER_ENABLED !== "false",
  
  // Lock TTL in minutes (default: 10)
  lockTtlMinutes: parseInt(process.env.SCHEDULER_LOCK_TTL_MINUTES || "10", 10),
  
  // Max items to process per run (default: 200)
  maxItemsPerRun: parseInt(process.env.SCHEDULER_MAX_ITEMS || "200", 10),
};

export function validateSchedulerSecret(providedSecret: string): boolean {
  if (!schedulerConfig.secret) {
    console.warn("⚠️ SCHEDULER_SECRET not configured");
    return false;
  }
  return providedSecret === schedulerConfig.secret;
}

import { z } from "zod";
import { adminProcedure, publicProcedure, router } from "./trpc";
import { getSiteSettings, initializeSiteSettings, updateSiteSettings } from "../db";

const colorPattern = /^#?[0-9a-fA-F]{3,8}$/;

const siteSettingsInputSchema = z.object({
  siteName: z.string().min(1).max(255),
  siteDescription: z.string().nullable().optional().default(""),
  siteLanguage: z.string().max(10).optional(),
  primaryColor: z.string().regex(colorPattern).optional(),
  secondaryColor: z.string().regex(colorPattern).optional(),
  backgroundColor: z.string().regex(colorPattern).optional(),
  textColor: z.string().regex(colorPattern).optional(),
  accentColor: z.string().regex(colorPattern).optional(),
  headingFont: z.string().max(255).optional(),
  bodyFont: z.string().max(255).optional(),
  baseFontSize: z.number().int().min(12).max(32).optional(),
  logoUrl: z.string().max(1000).nullable().optional(),
  faviconUrl: z.string().max(1000).nullable().optional(),
  menuItems: z.string().nullable().optional(),
  footerText: z.string().nullable().optional(),
  showSocialLinks: z.boolean().optional(),
  socialLinks: z.string().nullable().optional(),
  theme: z.enum(["light", "dark", "auto"]).optional(),
});

const LOCAL_READ_FALLBACK = {
  id: 0,
  siteName: "PalWaqf AI",
  siteDescription: "واجهة محلية مقيدة؛ إعدادات الموقع غير متصلة بقاعدة البيانات.",
  siteLanguage: "ar",
  primaryColor: null,
  secondaryColor: null,
  backgroundColor: null,
  textColor: null,
  accentColor: null,
  headingFont: null,
  bodyFont: null,
  baseFontSize: null,
  logoUrl: null,
  faviconUrl: null,
  menuItems: null,
  footerText: null,
  showSocialLinks: false,
  socialLinks: null,
  theme: "light" as const,
  updatedAt: new Date(0),
  updatedBy: null,
  runtimeMode: "local_read_fallback_database_unavailable",
};

function normalizeSiteSettings(raw: any) {
  if (!raw) return raw;
  return {
    ...raw,
    showSocialLinks:
      typeof raw.showSocialLinks === "boolean"
        ? raw.showSocialLinks
        : Boolean(Number(raw.showSocialLinks ?? 0)),
  };
}

function allowLocalReadFallback(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.PWF_LOCAL_BOOTSTRAP === "1";
}

function isDatabaseUnavailable(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error || "");
  return /database not available|database connection failed/i.test(message);
}

export const siteSettingsRouter = router({
  get: publicProcedure.query(async () => {
    try {
      const settings = (await getSiteSettings()) ?? (await initializeSiteSettings());
      return normalizeSiteSettings({ ...settings, runtimeMode: "database" });
    } catch (error) {
      if (allowLocalReadFallback() && isDatabaseUnavailable(error)) {
        console.warn("[siteSettings] Local read fallback returned because the primary database is unavailable.");
        return LOCAL_READ_FALLBACK;
      }
      throw error;
    }
  }),

  update: adminProcedure
    .input(siteSettingsInputSchema)
    .mutation(async ({ input, ctx }) => {
      const updated = await updateSiteSettings({
        ...input,
        showSocialLinks:
          typeof input.showSocialLinks === "boolean"
            ? (input.showSocialLinks ? 1 : 0)
            : undefined,
        updatedBy: ctx.user?.id ?? undefined,
      } as any);

      return normalizeSiteSettings({ ...updated, runtimeMode: "database" });
    }),
});

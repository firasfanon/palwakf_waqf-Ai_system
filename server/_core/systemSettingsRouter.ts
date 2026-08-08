import { z } from "zod";
import { protectedProcedure, router } from "./trpc";
import { runtimeGetSystemSettings, runtimeUpdateSystemSettings } from "../runtimeRepository";

const providerEnum = z.enum(["ollama", "openai_compatible", "disabled"]);

const assistantProfileSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200).default("المساعد الافتراضي"),
  description: z.string().default(""),
  llmEnabled: z.boolean().default(true),
  llmProvider: providerEnum.default("ollama"),
  llmBaseUrl: z.string().default("http://127.0.0.1:11434"),
  llmApiKey: z.string().default("ollama"),
  llmModel: z.string().default("qwen2.5:3b"),
  llmTimeoutSeconds: z.number().int().min(5).max(300).default(180),
  isEnabled: z.boolean().default(true),
  isDefault: z.boolean().default(false),
});

const systemSettingsSchema = z.object({
  registrationEnabled: z.boolean().default(true),
  dailyQuestionLimit: z.number().int().min(1).max(10000).default(50),
  requireEmailVerification: z.boolean().default(false),
  welcomeMessageEnabled: z.boolean().default(true),
  welcomeMessageTitle: z.string().max(500).default("مرحباً بك في نظام الأوقاف الإسلامية"),
  welcomeMessageContent: z.string().default(""),
  emailEnabled: z.boolean().default(false),
  smtpHost: z.string().default(""),
  smtpPort: z.number().int().min(1).max(65535).default(587),
  smtpUser: z.string().default(""),
  smtpPassword: z.string().default(""),
  emailFromAddress: z.string().default(""),
  emailFromName: z.string().default(""),
  maintenanceMode: z.boolean().default(false),
  maintenanceMessage: z.string().default(""),
  llmEnabled: z.boolean().default(true),
  llmProvider: providerEnum.default("ollama"),
  llmBaseUrl: z.string().default("http://127.0.0.1:11434"),
  llmApiKey: z.string().default("ollama"),
  llmModel: z.string().default("qwen2.5:3b"),
  llmTimeoutSeconds: z.number().int().min(5).max(300).default(180),
  llmLastTestStatus: z.enum(["untested", "ok", "failed"]).optional(),
  llmLastTestMessage: z.string().optional(),
  llmLastTestAt: z.string().nullable().optional(),
  assistantProfiles: z.array(assistantProfileSchema).default([]),
  activeAssistantProfileId: z.string().default("assistant_default"),
});

function buildModelListUrl(provider: z.infer<typeof providerEnum>, baseUrl: string) {
  const trimmed = (baseUrl || "").trim().replace(/\/$/, "");
  if (!trimmed) throw new Error("رابط المزود غير مضبوط");
  if (provider === "ollama") return `${trimmed}/api/tags`;
  return `${trimmed}/v1/models`;
}

const ollamaFallbackModels = ["qwen2.5:3b", "qwen2.5:7b"];

function normalizeOllamaModelNames(payload: any): string[] {
  const models = Array.isArray(payload?.models) ? payload.models : [];
  return Array.from(new Set(models.map((item: any) => (item?.name || item?.model || "").toString().trim()).filter(Boolean)));
}

function resolveOllamaEffectiveModel(configuredModel: string, availableModels: string[]) {
  const preferred = Array.from(new Set([configuredModel, ...ollamaFallbackModels].filter(Boolean)));
  const available = new Set(availableModels);
  const matches = preferred.filter((model) => available.has(model));
  return {
    effectiveModel: matches[0] || null,
    fallbackCandidates: matches,
  };
}



async function getAvailableLlmModels(settings: any) {
  if (!settings?.llmEnabled || settings?.llmProvider !== "ollama") {
    return {
      provider: settings?.llmProvider || "disabled",
      availableModels: [],
      effectiveModel: settings?.llmModel || null,
      message: settings?.llmProvider === "disabled" || !settings?.llmEnabled
        ? "مزود الذكاء معطل حاليًا"
        : "جلب القائمة التلقائية للنماذج متاح حاليًا فقط مع Ollama",
      checkedAt: new Date().toISOString(),
    };
  }

  const url = buildModelListUrl(settings.llmProvider, settings.llmBaseUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), (settings.llmTimeoutSeconds || 90) * 1000);

  try {
    const response = await fetch(url, { method: "GET", signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      const body = await response.text();
      return {
        provider: settings.llmProvider,
        availableModels: [],
        effectiveModel: settings.llmModel || null,
        message: `فشل تحميل قائمة النماذج: ${response.status} ${response.statusText}${body ? ` – ${body.slice(0, 200)}` : ""}`,
        checkedAt: new Date().toISOString(),
      };
    }

    const payload = await response.json();
    const availableModels = normalizeOllamaModelNames(payload);
    const { effectiveModel } = resolveOllamaEffectiveModel(settings.llmModel, availableModels);
    return {
      provider: settings.llmProvider,
      availableModels,
      effectiveModel,
      message: availableModels.length ? "تم تحميل النماذج المتاحة بنجاح" : "لم يعرض Ollama أي نماذج متاحة",
      checkedAt: new Date().toISOString(),
    };
  } catch (error: any) {
    clearTimeout(timeout);
    return {
      provider: settings.llmProvider,
      availableModels: [],
      effectiveModel: settings.llmModel || null,
      message: error?.name === "AbortError" ? "انتهت مهلة تحميل قائمة النماذج" : error?.message || "تعذر تحميل قائمة النماذج",
      checkedAt: new Date().toISOString(),
    };
  }
}

export const systemSettingsRouter = router({
  get: protectedProcedure.query(async () => {
    return await runtimeGetSystemSettings();
  }),

  getAvailableLlmModels: protectedProcedure.query(async () => {
    const settings = await runtimeGetSystemSettings();
    return await getAvailableLlmModels(settings);
  }),

  update: protectedProcedure
    .input(systemSettingsSchema)
    .mutation(async ({ input }) => {
      await runtimeUpdateSystemSettings(input);
      return await runtimeGetSystemSettings();
    }),

  testLlmConnection: protectedProcedure
    .input(
      z
        .object({
          llmEnabled: z.boolean().optional(),
          llmProvider: providerEnum.optional(),
          llmBaseUrl: z.string().optional(),
          llmApiKey: z.string().optional(),
          llmModel: z.string().optional(),
          llmTimeoutSeconds: z.number().int().min(5).max(300).optional(),
        })
        .optional()
    )
    .mutation(async ({ input }) => {
      const current = await runtimeGetSystemSettings();
      const settings = { ...current, ...(input || {}) };

      if (!settings.llmEnabled || settings.llmProvider === "disabled") {
        const result = {
          ok: false,
          provider: settings.llmProvider,
          url: settings.llmBaseUrl,
          model: settings.llmModel,
          message: "مزود الذكاء معطل حاليًا",
          checkedAt: new Date().toISOString(),
        };
        await runtimeUpdateSystemSettings({
          llmLastTestStatus: "failed",
          llmLastTestMessage: result.message,
          llmLastTestAt: result.checkedAt,
        });
        return result;
      }

      const url = buildModelListUrl(settings.llmProvider, settings.llmBaseUrl);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), (settings.llmTimeoutSeconds || 90) * 1000);

      try {
        const response = await fetch(url, {
          method: "GET",
          headers:
            settings.llmProvider === "openai_compatible"
              ? {
                  authorization: `Bearer ${settings.llmApiKey || ""}`,
                }
              : undefined,
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!response.ok) {
          const body = await response.text();
          const message = `فشل الاتصال بالمزود: ${response.status} ${response.statusText}${body ? ` – ${body.slice(0, 200)}` : ""}`;
          await runtimeUpdateSystemSettings({
            llmLastTestStatus: "failed",
            llmLastTestMessage: message,
            llmLastTestAt: new Date().toISOString(),
          });
          return {
            ok: false,
            provider: settings.llmProvider,
            url,
            model: settings.llmModel,
            message,
            checkedAt: new Date().toISOString(),
          };
        }

        const checkedAt = new Date().toISOString();
        if (settings.llmProvider === "ollama") {
          const payload = await response.json();
          const availableModels = normalizeOllamaModelNames(payload);
          const { effectiveModel } = resolveOllamaEffectiveModel(settings.llmModel, availableModels);

          if (!effectiveModel) {
            const message = `تم الوصول إلى Ollama لكن النموذج المطلوب غير متوفر محليًا. النماذج المتوفرة حاليًا: ${availableModels.join(", ") || "لا توجد نماذج معروضة"}`;
            await runtimeUpdateSystemSettings({
              llmLastTestStatus: "failed",
              llmLastTestMessage: message,
              llmLastTestAt: checkedAt,
            });
            return {
              ok: false,
              provider: settings.llmProvider,
              url,
              model: settings.llmModel,
              effectiveModel: null,
              availableModels,
              message,
              checkedAt,
            };
          }

          const fallbackHappened = effectiveModel !== settings.llmModel;
          const message = fallbackHappened
            ? `تم الاتصال بـ Ollama بنجاح. النموذج المضبوط غير متوفر محليًا، وسيُستخدم ${effectiveModel} تشغيليًا.`
            : "تم الاتصال بالمزود بنجاح";

          await runtimeUpdateSystemSettings({
            llmLastTestStatus: "ok",
            llmLastTestMessage: message,
            llmLastTestAt: checkedAt,
          });
          return {
            ok: true,
            provider: settings.llmProvider,
            url,
            model: settings.llmModel,
            effectiveModel,
            availableModels,
            message,
            checkedAt,
          };
        }

        await runtimeUpdateSystemSettings({
          llmLastTestStatus: "ok",
          llmLastTestMessage: "تم الاتصال بالمزود بنجاح",
          llmLastTestAt: checkedAt,
        });
        return {
          ok: true,
          provider: settings.llmProvider,
          url,
          model: settings.llmModel,
          effectiveModel: settings.llmModel,
          availableModels: [],
          message: "تم الاتصال بالمزود بنجاح",
          checkedAt,
        };
      } catch (error: any) {
        clearTimeout(timeout);
        const message = error?.name === "AbortError" ? "انتهت مهلة اختبار المزود" : error?.message || "تعذر اختبار المزود";
        await runtimeUpdateSystemSettings({
          llmLastTestStatus: "failed",
          llmLastTestMessage: message,
          llmLastTestAt: new Date().toISOString(),
        });
        return {
          ok: false,
          provider: settings.llmProvider,
          url,
          model: settings.llmModel,
          message,
          checkedAt: new Date().toISOString(),
        };
      }
    }),
});

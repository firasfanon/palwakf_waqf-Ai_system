import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Settings, Mail, Users, MessageSquare, AlertTriangle, BrainCircuit, PlugZap, Plus, Trash2 } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import { useMemo, useState, useEffect } from "react";

type LlmProvider = "ollama" | "openai_compatible" | "disabled";

type AssistantProfile = {
  id: string;
  name: string;
  description: string;
  llmEnabled: boolean;
  llmProvider: LlmProvider;
  llmBaseUrl: string;
  llmApiKey: string;
  llmModel: string;
  llmTimeoutSeconds: number;
  isEnabled: boolean;
  isDefault: boolean;
};

type FormState = {
  registrationEnabled: boolean;
  dailyQuestionLimit: number;
  requireEmailVerification: boolean;
  welcomeMessageEnabled: boolean;
  welcomeMessageTitle: string;
  welcomeMessageContent: string;
  emailEnabled: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  emailFromAddress: string;
  emailFromName: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  llmEnabled: boolean;
  llmProvider: LlmProvider;
  llmBaseUrl: string;
  llmApiKey: string;
  llmModel: string;
  llmTimeoutSeconds: number;
  llmLastTestStatus?: "untested" | "ok" | "failed";
  llmLastTestMessage?: string;
  llmLastTestAt?: string | null;
  assistantProfiles: AssistantProfile[];
  activeAssistantProfileId: string;
};


type ModelPreset = {
  provider: LlmProvider;
  baseUrl: string;
  apiKey: string;
  timeoutSeconds: number;
  description: string;
};

const OLLAMA_BASE_URL = "http://127.0.0.1:11434";

const MODEL_PRESETS: Record<string, ModelPreset> = {
  "qwen2.5:3b": {
    provider: "ollama",
    baseUrl: OLLAMA_BASE_URL,
    apiKey: "ollama",
    timeoutSeconds: 120,
    description: "خيار محلي أخف وأسرع للاستعمال اليومي والاستجابات السريعة.",
  },
  "qwen2.5:7b": {
    provider: "ollama",
    baseUrl: OLLAMA_BASE_URL,
    apiKey: "ollama",
    timeoutSeconds: 180,
    description: "خيار محلي أعلى جودة نسبيًا لكنه يحتاج وقتًا أطول وموارد أكثر.",
  },
  "llama3.2:3b": {
    provider: "ollama",
    baseUrl: OLLAMA_BASE_URL,
    apiKey: "ollama",
    timeoutSeconds: 120,
    description: "بديل محلي خفيف يمكن استخدامه عند الحاجة كنموذج عام.",
  },
};

function inferModelPreset(model: string): ModelPreset {
  const trimmed = model.trim();
  const direct = MODEL_PRESETS[trimmed];
  if (direct) return direct;

  const lower = trimmed.toLowerCase();
  if (lower.includes(":3b")) {
    return {
      provider: "ollama",
      baseUrl: OLLAMA_BASE_URL,
      apiKey: "ollama",
      timeoutSeconds: 120,
      description: "تم تطبيق إعدادات نموذج محلي خفيف تلقائيًا بناءً على اسم النموذج.",
    };
  }

  if (lower.includes(":7b")) {
    return {
      provider: "ollama",
      baseUrl: OLLAMA_BASE_URL,
      apiKey: "ollama",
      timeoutSeconds: 180,
      description: "تم تطبيق إعدادات نموذج محلي متوسط تلقائيًا بناءً على اسم النموذج.",
    };
  }

  if (lower.includes(":14b") || lower.includes(":32b")) {
    return {
      provider: "ollama",
      baseUrl: OLLAMA_BASE_URL,
      apiKey: "ollama",
      timeoutSeconds: 240,
      description: "تم تطبيق إعدادات نموذج محلي أثقل تلقائيًا بناءً على اسم النموذج.",
    };
  }

  return {
    provider: "ollama",
    baseUrl: OLLAMA_BASE_URL,
    apiKey: "ollama",
    timeoutSeconds: 180,
    description: "تم تطبيق الإعدادات المحلية الافتراضية لهذا النموذج.",
  };
}

function applyModelPreset(current: FormState, model: string): FormState {
  const preset = inferModelPreset(model);
  return {
    ...current,
    llmModel: model,
    llmProvider: preset.provider,
    llmBaseUrl: preset.baseUrl,
    llmApiKey: preset.apiKey,
    llmTimeoutSeconds: preset.timeoutSeconds,
  };
}


function buildAssistantProfileId() {
  return `assistant_${Math.random().toString(36).slice(2, 10)}`;
}

function createAssistantProfile(input?: Partial<AssistantProfile>): AssistantProfile {
  const baseModel = input?.llmModel?.trim() || "qwen2.5:3b";
  const preset = inferModelPreset(baseModel);
  return {
    id: input?.id || buildAssistantProfileId(),
    name: input?.name?.trim() || "مساعد عام",
    description: input?.description?.trim() || "مساعد محلي قابل للتخصيص داخل هذا المسار.",
    llmEnabled: input?.llmEnabled ?? true,
    llmProvider: input?.llmProvider || preset.provider,
    llmBaseUrl: input?.llmBaseUrl?.trim() || preset.baseUrl,
    llmApiKey: input?.llmApiKey?.trim() || preset.apiKey,
    llmModel: baseModel,
    llmTimeoutSeconds: input?.llmTimeoutSeconds ?? preset.timeoutSeconds,
    isEnabled: input?.isEnabled ?? true,
    isDefault: input?.isDefault ?? false,
  };
}

function normalizeAssistantProfiles(profiles: AssistantProfile[] | undefined, fallback?: Partial<AssistantProfile>) {
  const seed = createAssistantProfile({
    ...fallback,
    id: fallback?.id || "assistant_default",
    name: fallback?.name || "المساعد الافتراضي",
    description: fallback?.description || "المساعد المحلي الأساسي المستخدم افتراضيًا.",
    isDefault: true,
  });

  const source = Array.isArray(profiles) && profiles.length ? profiles : [seed];
  const normalized = source.map((profile, index) => createAssistantProfile({
    ...seed,
    ...profile,
    id: profile?.id || `assistant_${index + 1}`,
    isDefault: profile?.isDefault ?? index === 0,
  }));

  return normalized;
}

function getActiveAssistantProfile(form: FormState) {
  return form.assistantProfiles.find((profile) => profile.id === form.activeAssistantProfileId) || form.assistantProfiles[0];
}

function syncActiveAssistantProfile(form: FormState, patch: Partial<AssistantProfile>): FormState {
  const activeId = form.activeAssistantProfileId || form.assistantProfiles[0]?.id;
  const updatedProfiles = form.assistantProfiles.map((profile) => {
    if (profile.id !== activeId) return profile;
    return createAssistantProfile({ ...profile, ...patch, id: profile.id });
  });
  const activeProfile = updatedProfiles.find((profile) => profile.id === activeId) || updatedProfiles[0] || createAssistantProfile();
  return {
    ...form,
    assistantProfiles: updatedProfiles,
    activeAssistantProfileId: activeProfile.id,
    llmEnabled: activeProfile.llmEnabled,
    llmProvider: activeProfile.llmProvider,
    llmBaseUrl: activeProfile.llmBaseUrl,
    llmApiKey: activeProfile.llmApiKey,
    llmModel: activeProfile.llmModel,
    llmTimeoutSeconds: activeProfile.llmTimeoutSeconds,
  };
}

function applyAssistantProfile(form: FormState, profileId: string): FormState {
  const target = form.assistantProfiles.find((profile) => profile.id === profileId) || form.assistantProfiles[0];
  if (!target) return form;
  return {
    ...form,
    activeAssistantProfileId: target.id,
    llmEnabled: target.llmEnabled,
    llmProvider: target.llmProvider,
    llmBaseUrl: target.llmBaseUrl,
    llmApiKey: target.llmApiKey,
    llmModel: target.llmModel,
    llmTimeoutSeconds: target.llmTimeoutSeconds,
  };
}

const defaultAssistantProfile = createAssistantProfile({
  id: "assistant_default",
  name: "المساعد الافتراضي",
  description: "المساعد المحلي الأساسي المستخدم افتراضيًا.",
  isDefault: true,
});

const defaultFormData: FormState = {
  registrationEnabled: true,
  dailyQuestionLimit: 50,
  requireEmailVerification: false,
  welcomeMessageEnabled: true,
  welcomeMessageTitle: "مرحباً بك في نظام الأوقاف الإسلامية",
  welcomeMessageContent: "",
  emailEnabled: false,
  smtpHost: "",
  smtpPort: 587,
  smtpUser: "",
  smtpPassword: "",
  emailFromAddress: "",
  emailFromName: "",
  maintenanceMode: false,
  maintenanceMessage: "",
  llmEnabled: true,
  llmProvider: "ollama",
  llmBaseUrl: "http://127.0.0.1:11434",
  llmApiKey: "ollama",
  llmModel: "qwen2.5:3b",
  llmTimeoutSeconds: 180,
  llmLastTestStatus: "untested",
  llmLastTestMessage: "",
  llmLastTestAt: null,
  assistantProfiles: [defaultAssistantProfile],
  activeAssistantProfileId: defaultAssistantProfile.id,
};

export default function AdminSystemSettings() {
  const { data: settings, isLoading, refetch } = trpc.systemSettings.get.useQuery();
  const { data: availableModelsData, refetch: refetchAvailableModels } = trpc.systemSettings.getAvailableLlmModels.useQuery(undefined, {
    enabled: true,
    refetchOnWindowFocus: false,
  });
  const updateMutation = trpc.systemSettings.update.useMutation({
    onSuccess: (savedSettings) => {
      setFormData({ ...defaultFormData, ...savedSettings });
      setLastSavedAt(new Date().toISOString());
      alert("تم حفظ إعدادات النظام بنجاح");
      refetch();
      refetchAvailableModels();
    },
    onError: (error) => {
      alert("خطأ: " + error.message);
    },
  });
  const testMutation = trpc.systemSettings.testLlmConnection.useMutation({
    onSuccess: (result) => {
      alert(result.message);
      if (result.effectiveModel && result.effectiveModel !== formData.llmModel) {
        setFormData((current) => syncActiveAssistantProfile(applyModelPreset(current, result.effectiveModel!), { llmModel: result.effectiveModel!, llmProvider: inferModelPreset(result.effectiveModel!).provider, llmBaseUrl: inferModelPreset(result.effectiveModel!).baseUrl, llmApiKey: inferModelPreset(result.effectiveModel!).apiKey, llmTimeoutSeconds: inferModelPreset(result.effectiveModel!).timeoutSeconds }));
      }
      refetch();
      refetchAvailableModels();
    },
    onError: (error) => {
      alert("تعذر اختبار الاتصال: " + error.message);
    },
  });

  const [formData, setFormData] = useState<FormState>(defaultFormData);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const baselineFormData = useMemo(() => {
    const merged = {
      ...defaultFormData,
      ...(settings || {}),
    } as FormState;
    const normalizedProfiles = normalizeAssistantProfiles(merged.assistantProfiles, {
      llmEnabled: merged.llmEnabled,
      llmProvider: merged.llmProvider,
      llmBaseUrl: merged.llmBaseUrl,
      llmApiKey: merged.llmApiKey,
      llmModel: merged.llmModel,
      llmTimeoutSeconds: merged.llmTimeoutSeconds,
    });
    const activeId = normalizedProfiles.some((profile) => profile.id === merged.activeAssistantProfileId)
      ? merged.activeAssistantProfileId
      : (normalizedProfiles.find((profile) => profile.isDefault)?.id || normalizedProfiles[0].id);
    return applyAssistantProfile({
      ...merged,
      assistantProfiles: normalizedProfiles,
      activeAssistantProfileId: activeId,
    }, activeId);
  }, [settings]);

  useEffect(() => {
    setFormData(baselineFormData);
  }, [baselineFormData]);

  const isDirty = useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify(baselineFormData);
  }, [formData, baselineFormData]);

  const testStatusLabel = useMemo(() => {
    switch (formData.llmLastTestStatus) {
      case "ok":
        return "الاتصال ناجح";
      case "failed":
        return "فشل الاتصال";
      default:
        return "لم يُختبر بعد";
    }
  }, [formData.llmLastTestStatus]);

  const modelOptions = useMemo(() => {
    const dynamic = Array.isArray(availableModelsData?.availableModels) ? availableModelsData.availableModels : [];
    const preferred = [formData.llmModel, ...formData.assistantProfiles.map((profile) => profile.llmModel), "qwen2.5:3b", "qwen2.5:7b", "llama3.2:3b"];
    return Array.from(new Set([...preferred, ...dynamic].filter(Boolean)));
  }, [availableModelsData?.availableModels, formData.llmModel]);

  const selectedModelPreset = useMemo(() => inferModelPreset(formData.llmModel || "qwen2.5:3b"), [formData.llmModel]);
  const activeAssistantProfile = useMemo(() => getActiveAssistantProfile(formData), [formData]);

  const handleActiveProfileSelection = (profileId: string) => {
    setFormData((current) => applyAssistantProfile(current, profileId));
  };

  const handleAddAssistantProfile = () => {
    setFormData((current) => {
      const nextIndex = current.assistantProfiles.length + 1;
      const created = createAssistantProfile({
        name: `مساعد ${nextIndex}`,
        description: "مساعد جديد يعتمد الإعدادات الحالية كنقطة بداية.",
        llmEnabled: current.llmEnabled,
        llmProvider: current.llmProvider,
        llmBaseUrl: current.llmBaseUrl,
        llmApiKey: current.llmApiKey,
        llmModel: current.llmModel,
        llmTimeoutSeconds: current.llmTimeoutSeconds,
      });
      return applyAssistantProfile({
        ...current,
        assistantProfiles: [...current.assistantProfiles, created],
        activeAssistantProfileId: created.id,
      }, created.id);
    });
  };

  const handleRemoveAssistantProfile = () => {
    setFormData((current) => {
      if (current.assistantProfiles.length <= 1) return current;
      const remaining = current.assistantProfiles.filter((profile) => profile.id !== current.activeAssistantProfileId);
      const fallbackId = remaining.find((profile) => profile.isDefault)?.id || remaining[0]?.id;
      if (!fallbackId) return current;
      return applyAssistantProfile({
        ...current,
        assistantProfiles: remaining.map((profile, index) => ({
          ...profile,
          isDefault: profile.id === fallbackId ? true : profile.isDefault && index === 0,
        })),
        activeAssistantProfileId: fallbackId,
      }, fallbackId);
    });
  };

  const handleMarkAssistantDefault = () => {
    setFormData((current) => ({
      ...syncActiveAssistantProfile(current, {}),
      assistantProfiles: current.assistantProfiles.map((profile) => ({
        ...profile,
        isDefault: profile.id === current.activeAssistantProfileId,
      })),
    }));
  };

  const updateActiveProfileMeta = (patch: Partial<AssistantProfile>) => {
    setFormData((current) => syncActiveAssistantProfile(current, patch));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleLlmTest = () => {
    testMutation.mutate({
      llmEnabled: formData.llmEnabled,
      llmProvider: formData.llmProvider,
      llmBaseUrl: formData.llmBaseUrl,
      llmApiKey: formData.llmApiKey,
      llmModel: formData.llmModel,
      llmTimeoutSeconds: formData.llmTimeoutSeconds,
    });
  };

  const handleReset = () => {
    setFormData(baselineFormData);
  };

  if (isLoading) {
    return (
      <div dir="rtl" className="container mx-auto py-8">
        <Breadcrumbs items={[{ label: "لوحة التحكم", href: "/admin/dashboard" }, { label: "إعدادات النظام" }]} />
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="admin-page-cleanup container mx-auto py-8 space-y-6">
      <Breadcrumbs items={[{ label: "لوحة التحكم", href: "/admin/dashboard" }, { label: "إعدادات النظام" }]} />
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Settings className="w-8 h-8" />
          إعدادات النظام
        </h1>
        <p className="text-muted-foreground mt-2">إدارة الإعدادات العامة للنظام وإعدادات المزود الهجين للذكاء الاصطناعي</p>
      </div>

      <Card className="border-border/70 bg-card/95 shadow-sm">
        <CardContent className="pt-6 text-sm text-muted-foreground space-y-1">
          <p>تُحفظ إعدادات المزود الهجين حاليًا في التخزين المحلي التشغيلي للنظام، ثم يمكن لاحقًا نقلها إلى قاعدة البيانات السيادية دون تغيير واجهة الإدارة.</p>
          <p>ترتيب القراءة المعتمد: إعدادات لوحة التحكم أولًا، ثم متغيرات البيئة كقيمة احتياطية.</p>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs defaultValue="ai" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 rounded-2xl border border-border/70 bg-muted/40 p-1">
            <TabsTrigger className="rounded-xl" value="ai"><BrainCircuit className="w-4 h-4 ml-2" />الذكاء</TabsTrigger>
            <TabsTrigger className="rounded-xl" value="users"><Users className="w-4 h-4 ml-2" />المستخدمين</TabsTrigger>
            <TabsTrigger className="rounded-xl" value="welcome"><MessageSquare className="w-4 h-4 ml-2" />الترحيب</TabsTrigger>
            <TabsTrigger className="rounded-xl" value="email"><Mail className="w-4 h-4 ml-2" />البريد</TabsTrigger>
            <TabsTrigger className="rounded-xl" value="maintenance"><AlertTriangle className="w-4 h-4 ml-2" />الصيانة</TabsTrigger>
          </TabsList>

          <TabsContent value="ai">
            <div className="grid gap-6 lg:grid-cols-[1.4fr_.8fr]">
              <Card className="border-border/70 bg-card/95 shadow-sm">
                <CardHeader className="border-b border-border/60 bg-muted/10">
                  <CardTitle>المزوّد الهجين للذكاء الاصطناعي</CardTitle>
                  <CardDescription>يمكنك التبديل بين مزود محلي مثل Ollama أو مزود خارجي متوافق مع OpenAI API دون تعديل الكود.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-sm text-muted-foreground">
                    الحفظ يكتب الآن إلى التخزين المحلي التشغيلي، ويُستخدم النموذج المحفوظ أولًا. وعند Ollama يمكن للنظام التبديل تشغيليًا بين <code>qwen2.5:3b</code> و<code>qwen2.5:7b</code> حسب المتوفر محليًا.
                  </p>

                  <div className="rounded-2xl border border-border/70 bg-muted/15 p-5 space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold">Assistant Profiles</h3>
                        <p className="text-sm text-muted-foreground">أضف عدة مساعدين محليين، ولكل واحد اسم ووصف وإعدادات نموذج مستقلة ضمن نفس المسار المحلي الحالي.</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={handleAddAssistantProfile}>
                          <Plus className="w-4 h-4 ml-2" />إضافة مساعد
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={handleMarkAssistantDefault} disabled={!activeAssistantProfile}>
                          اجعله الافتراضي
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={handleRemoveAssistantProfile} disabled={formData.assistantProfiles.length <= 1}>
                          <Trash2 className="w-4 h-4 ml-2" />حذف المحدد
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="activeAssistantProfileId">المساعد النشط</Label>
                        <select
                          id="activeAssistantProfileId"
                          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground shadow-sm"
                          value={formData.activeAssistantProfileId}
                          onChange={(e) => handleActiveProfileSelection(e.target.value)}
                        >
                          {formData.assistantProfiles.map((profile) => (
                            <option key={profile.id} value={profile.id}>
                              {profile.name}{profile.isDefault ? ' — افتراضي' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="assistantProfileName">اسم المساعد</Label>
                        <Input
                          id="assistantProfileName"
                          value={activeAssistantProfile?.name || ""}
                          onChange={(e) => updateActiveProfileMeta({ name: e.target.value })}
                          placeholder="مثال: مساعد المراجع"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="assistantProfileDescription">وصف المساعد</Label>
                      <Textarea
                        className="border-border bg-background"
                        id="assistantProfileDescription"
                        rows={3}
                        value={activeAssistantProfile?.description || ""}
                        onChange={(e) => updateActiveProfileMeta({ description: e.target.value })}
                        placeholder="وصف قصير يوضح وظيفة هذا المساعد وسياقه"
                      />
                    </div>

                    <div className="rounded-2xl border border-border/70 bg-background p-4 text-xs text-muted-foreground space-y-1 shadow-sm">
                      <p>عدد المساعدين المحليين الحالي: <strong>{formData.assistantProfiles.length}</strong></p>
                      <p>المساعد النشط الآن: <strong>{activeAssistantProfile?.name || "—"}</strong></p>
                      <p>عند حفظ الإعدادات سيتم حفظ جميع Assistant Profiles داخل نفس المسار المحلي الحالي مع إبقاء القيم العليا ممثلة للمساعد النشط.</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <Label htmlFor="llmEnabled">تفعيل طبقة الذكاء</Label>
                      <p className="text-sm text-muted-foreground">عند التعطيل سيظهر للمستخدم أن مزود الذكاء غير مفعّل بدل تعليق الشات.</p>
                    </div>
                    <Switch id="llmEnabled" checked={formData.llmEnabled} onCheckedChange={(checked) => updateActiveProfileMeta({ llmEnabled: checked, isEnabled: checked })} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="llmProvider">نوع المزود</Label>
                    <select
                      id="llmProvider"
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground shadow-sm"
                      value={formData.llmProvider}
                      onChange={(e) => updateActiveProfileMeta({ llmProvider: e.target.value as LlmProvider })}
                    >
                      <option value="ollama">محلي — Ollama</option>
                      <option value="openai_compatible">خارجي — OpenAI Compatible</option>
                      <option value="disabled">معطل</option>
                    </select>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="llmBaseUrl">الرابط الأساسي للمزود</Label>
                      <Input className="border-border bg-background" id="llmBaseUrl" value={formData.llmBaseUrl} onChange={(e) => updateActiveProfileMeta({ llmBaseUrl: e.target.value })} placeholder="http://127.0.0.1:11434" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <Label htmlFor="llmModel">اسم النموذج</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => refetchAvailableModels()}
                          disabled={updateMutation.isPending || testMutation.isPending}
                        >
                          تحديث القائمة
                        </Button>
                      </div>
                      <select
                        id="llmModel"
                        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground shadow-sm"
                        value={formData.llmModel}
                        onChange={(e) => setFormData((current) => syncActiveAssistantProfile(applyModelPreset(current, e.target.value), { llmModel: e.target.value, llmProvider: inferModelPreset(e.target.value).provider, llmBaseUrl: inferModelPreset(e.target.value).baseUrl, llmApiKey: inferModelPreset(e.target.value).apiKey, llmTimeoutSeconds: inferModelPreset(e.target.value).timeoutSeconds }))}
                      >
                        {modelOptions.map((model) => (
                          <option key={model} value={model}>
                            {model}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-muted-foreground">
                        {availableModelsData?.availableModels?.length
                          ? `النماذج المتاحة حاليًا: ${availableModelsData.availableModels.join("، ")}`
                          : availableModelsData?.message || "يمكنك تحديث القائمة لقراءة النماذج المتاحة من Ollama"}
                      </p>
                      <div className="rounded-2xl border border-border/70 bg-muted/25 p-4 text-xs space-y-1">
                        <p className="font-medium text-foreground">الإعدادات التلقائية للنموذج المختار</p>
                        <p className="text-muted-foreground">{selectedModelPreset.description}</p>
                        <div className="grid gap-1 md:grid-cols-2">
                          <span>المزوّد: <strong>{selectedModelPreset.provider}</strong></span>
                          <span>الرابط: <strong>{selectedModelPreset.baseUrl}</strong></span>
                          <span>المهلة: <strong>{selectedModelPreset.timeoutSeconds} ثانية</strong></span>
                          <span>المفتاح: <strong>{selectedModelPreset.apiKey}</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="llmApiKey">مفتاح API</Label>
                      <Input className="border-border bg-background" id="llmApiKey" type="password" value={formData.llmApiKey} onChange={(e) => updateActiveProfileMeta({ llmApiKey: e.target.value })} placeholder="ollama أو مفتاح خارجي" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="llmTimeoutSeconds">مهلة الانتظار بالثواني</Label>
                      <Input className="border-border bg-background" id="llmTimeoutSeconds" type="number" min={5} max={300} value={formData.llmTimeoutSeconds} onChange={(e) => updateActiveProfileMeta({ llmTimeoutSeconds: Number(e.target.value || 180) })} />
                      <p className="text-xs text-muted-foreground">تتغير هذه القيمة تلقائيًا عند اختيار نموذج جديد، ويمكن تعديلها يدويًا قبل الحفظ.</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button type="button" variant="outline" className="rounded-xl" onClick={handleLlmTest} disabled={testMutation.isPending}>
                      <PlugZap className="w-4 h-4 ml-2" />
                      {testMutation.isPending ? "جاري الاختبار..." : "اختبار الاتصال بالمزود"}
                    </Button>
                    <Button type="submit" className="rounded-xl" disabled={updateMutation.isPending || !isDirty}>
                      {updateMutation.isPending ? "جاري الحفظ..." : isDirty ? "حفظ الإعدادات" : "لا توجد تغييرات للحفظ"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-card/95 shadow-sm">
                <CardHeader className="border-b border-border/60 bg-muted/10">
                  <CardTitle>حالة المزود</CardTitle>
                  <CardDescription>ملخص سريع لحالة الاتصال الحالية</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="rounded-2xl border border-border/70 bg-background/80 p-4 space-y-2 shadow-sm">
                    <div className="flex items-center justify-between"><span className="text-muted-foreground">الوضع</span><strong>{formData.llmEnabled ? "مفعّل" : "معطل"}</strong></div>
                    <div className="flex items-center justify-between"><span className="text-muted-foreground">المزوّد</span><strong>{formData.llmProvider}</strong></div>
                    <div className="flex items-center justify-between"><span className="text-muted-foreground">النموذج المضبوط</span><strong>{formData.llmModel || "—"}</strong></div>
                    <div className="flex items-center justify-between"><span className="text-muted-foreground">النموذج الفعلي</span><strong>{availableModelsData?.effectiveModel || formData.llmModel || "—"}</strong></div>
                    <div className="flex items-center justify-between"><span className="text-muted-foreground">آخر اختبار</span><strong>{testStatusLabel}</strong></div>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-background/80 p-4 space-y-2 shadow-sm">
                    <p className="text-muted-foreground">رسالة آخر اختبار</p>
                    <p>{formData.llmLastTestMessage || "لا توجد رسالة بعد"}</p>
                    <p className="text-xs text-muted-foreground">{formData.llmLastTestAt ? `آخر تحديث: ${formData.llmLastTestAt}` : "لم يُجر اختبار بعد"}</p>
                    {lastSavedAt ? <p className="text-xs text-muted-foreground">آخر حفظ للإعدادات: {lastSavedAt}</p> : null}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>إعدادات المستخدمين والتسجيل</CardTitle>
                <CardDescription>إدارة التسجيل والحدود اليومية</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="registrationEnabled">السماح بالتسجيل</Label>
                    <p className="text-sm text-muted-foreground">السماح للمستخدمين الجدد بإنشاء حسابات</p>
                  </div>
                  <Switch id="registrationEnabled" checked={formData.registrationEnabled} onCheckedChange={(checked) => setFormData({ ...formData, registrationEnabled: checked })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dailyQuestionLimit">حد الأسئلة اليومية</Label>
                  <Input className="border-border bg-background" id="dailyQuestionLimit" type="number" min="1" value={formData.dailyQuestionLimit} onChange={(e) => setFormData({ ...formData, dailyQuestionLimit: Number(e.target.value || 50) })} />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="requireEmailVerification">تفعيل التحقق من البريد الإلكتروني</Label>
                    <p className="text-sm text-muted-foreground">طلب التحقق من البريد الإلكتروني عند التسجيل</p>
                  </div>
                  <Switch id="requireEmailVerification" checked={formData.requireEmailVerification} onCheckedChange={(checked) => setFormData({ ...formData, requireEmailVerification: checked })} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="welcome">
            <Card>
              <CardHeader>
                <CardTitle>رسائل الترحيب</CardTitle>
                <CardDescription>إدارة رسالة الترحيب للمستخدمين الجدد</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="welcomeMessageEnabled">تفعيل رسالة الترحيب</Label>
                    <p className="text-sm text-muted-foreground">عرض رسالة ترحيب للمستخدمين الجدد عند التسجيل</p>
                  </div>
                  <Switch id="welcomeMessageEnabled" checked={formData.welcomeMessageEnabled} onCheckedChange={(checked) => setFormData({ ...formData, welcomeMessageEnabled: checked })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="welcomeMessageTitle">عنوان الرسالة</Label>
                  <Input className="border-border bg-background" id="welcomeMessageTitle" value={formData.welcomeMessageTitle} onChange={(e) => setFormData({ ...formData, welcomeMessageTitle: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="welcomeMessageContent">محتوى الرسالة</Label>
                  <Textarea className="border-border bg-background" id="welcomeMessageContent" rows={6} value={formData.welcomeMessageContent} onChange={(e) => setFormData({ ...formData, welcomeMessageContent: e.target.value })} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle>البريد الإلكتروني</CardTitle>
                <CardDescription>إعدادات SMTP والإرسال</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="emailEnabled">تفعيل البريد الإلكتروني</Label>
                    <p className="text-sm text-muted-foreground">السماح للنظام بإرسال الرسائل البريدية</p>
                  </div>
                  <Switch id="emailEnabled" checked={formData.emailEnabled} onCheckedChange={(checked) => setFormData({ ...formData, emailEnabled: checked })} />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2"><Label htmlFor="smtpHost">SMTP Host</Label><Input className="border-border bg-background" id="smtpHost" value={formData.smtpHost} onChange={(e) => setFormData({ ...formData, smtpHost: e.target.value })} /></div>
                  <div className="space-y-2"><Label htmlFor="smtpPort">SMTP Port</Label><Input className="border-border bg-background" id="smtpPort" type="number" value={formData.smtpPort} onChange={(e) => setFormData({ ...formData, smtpPort: Number(e.target.value || 587) })} /></div>
                  <div className="space-y-2"><Label htmlFor="smtpUser">SMTP User</Label><Input className="border-border bg-background" id="smtpUser" value={formData.smtpUser} onChange={(e) => setFormData({ ...formData, smtpUser: e.target.value })} /></div>
                  <div className="space-y-2"><Label htmlFor="smtpPassword">SMTP Password</Label><Input className="border-border bg-background" id="smtpPassword" type="password" value={formData.smtpPassword} onChange={(e) => setFormData({ ...formData, smtpPassword: e.target.value })} /></div>
                  <div className="space-y-2"><Label htmlFor="emailFromAddress">From Address</Label><Input className="border-border bg-background" id="emailFromAddress" value={formData.emailFromAddress} onChange={(e) => setFormData({ ...formData, emailFromAddress: e.target.value })} /></div>
                  <div className="space-y-2"><Label htmlFor="emailFromName">From Name</Label><Input className="border-border bg-background" id="emailFromName" value={formData.emailFromName} onChange={(e) => setFormData({ ...formData, emailFromName: e.target.value })} /></div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="maintenance">
            <Card>
              <CardHeader>
                <CardTitle>إعدادات الصيانة</CardTitle>
                <CardDescription>تفعيل وضع الصيانة وإدارة الرسالة الظاهرة للمستخدمين</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="maintenanceMode">وضع الصيانة</Label>
                    <p className="text-sm text-muted-foreground">عند التفعيل سيظهر تنبيه الصيانة للمستخدمين</p>
                  </div>
                  <Switch id="maintenanceMode" checked={formData.maintenanceMode} onCheckedChange={(checked) => setFormData({ ...formData, maintenanceMode: checked })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maintenanceMessage">رسالة الصيانة</Label>
                  <Textarea className="border-border bg-background" id="maintenanceMessage" rows={6} value={formData.maintenanceMessage} onChange={(e) => setFormData({ ...formData, maintenanceMessage: e.target.value })} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3">
          <Button type="submit" className="rounded-xl" disabled={updateMutation.isPending || !isDirty}>{updateMutation.isPending ? "جاري الحفظ..." : "حفظ جميع الإعدادات"}</Button>
        </div>
      </form>
    </div>
  );
}

import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { DynamicSection } from "@/components/DynamicSection";
import { PageHead } from "@/components/PageHead";
import { getAppHref, getLoginUrl } from "@/const";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Streamdown } from "streamdown";
import {
  BadgeCheck,
  BookOpen,
  Brain,
  Building2,
  FileSearch,
  Gauge,
  HelpCircle,
  LayoutDashboard,
  Link2,
  Loader2,
  LogIn,
  LogOut,
  MessageSquare,
  Mic,
  Search,
  Send,
  Settings2,
  Shield,
  Sparkles,
  Users,
  Workflow,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";

function DynamicSectionsContainer() {
  const { data: sections = [], isLoading } = trpc.homeSections.listPublished.useQuery();

  if (isLoading) {
    return (
      <div className="py-16 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (sections.length === 0) return null;

  return (
    <>
      {sections.map((section) => (
        <DynamicSection key={section.id} section={section} />
      ))}
    </>
  );
}

type HomeMessage = {
  role: "user" | "assistant";
  content: string;
};

type FeatureCard = {
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
};

type QuickLinkCard = {
  title: string;
  description: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  authRedirect?: string;
};

const heroMetrics = [
  { value: "موثّق", label: "إجابات مؤسَّسة على مصادر ومعرفة معتمدة" },
  { value: "مرن", label: "إعدادات تلقائية ومتقدمة بحسب نوع المستخدم" },
  { value: "مترابط", label: "جاهز للربط مع المعرفة والبحث والمراجعة" },
] as const;

const capabilityCards: FeatureCard[] = [
  {
    title: "إجابات مُسندة بالمراجع",
    description: "يبني الرد على قاعدة معرفة ومصادر منظّمة بدل الإجابات العامة غير الموثقة.",
    icon: BadgeCheck,
  },
  {
    title: "فهم أسئلة الأوقاف والسياق القانوني",
    description: "مصمم لأسئلة الوقف والإدارة والمرجعية القانونية والفقهية ضمن تجربة عربية رسمية.",
    icon: Brain,
  },
  {
    title: "بحث ذكي ومراجعة معرفة",
    description: "يتكامل مع المكتبة المعرفية والبحث والمراجعة لتغذية الردود الدقيقة وتحسين الحوكمة.",
    icon: FileSearch,
  },
  {
    title: "أوضاع استخدام متعددة",
    description: "من سؤال سريع إلى تحليل وثيقة أو بحث معمّق أو تشغيل موجّه للموظفين بحسب المسار.",
    icon: Workflow,
  },
  {
    title: "إعدادات ذكية سهلة",
    description: "وضع تلقائي للمستخدمين غير المتخصصين مع إعدادات متقدمة للمشرفين والخبراء عند الحاجة.",
    icon: Settings2,
  },
  {
    title: "جاهزية للصوت والملفات",
    description: "الواجهة مهيأة للتوسع في المرفقات والصوت والتلخيص والمخرجات القابلة للتصدير.",
    icon: Mic,
  },
];

const quickLinksBase: QuickLinkCard[] = [
  {
    title: "المحادثة الكاملة",
    description: "افتح بيئة المحادثة المخصصة واستكمل أسئلتك ومحادثاتك السابقة.",
    href: "/chat",
    icon: MessageSquare,
    authRedirect: "/chat",
  },
  {
    title: "المكتبة المعرفية",
    description: "استعرض المعرفة المعتمدة والمحتوى المرتبط بالأوقاف والمرجعيات.",
    href: "/knowledge-base",
    icon: BookOpen,
  },
  {
    title: "البحث المتقدم",
    description: "ابحث في الوثائق والمعرفة والمحتوى المنظم للوصول الأسرع للمعلومة.",
    href: "/search",
    icon: Search,
  },
  {
    title: "المراجع والإحالات",
    description: "راجع المسارات المرجعية والروابط والمواد المساندة المرتبطة بالمحتوى.",
    href: "/references",
    icon: Link2,
  },
  {
    title: "الأسئلة الشائعة",
    description: "ابدأ من أكثر الأسئلة تداولًا قبل الانتقال إلى المحادثة أو البحث المعمق.",
    href: "/faqs",
    icon: HelpCircle,
  },
  {
    title: "واجهة الإدارة",
    description: "للوصول إلى الإعدادات والمعرفة والمراجعة ولوحات المتابعة عند توفر الصلاحية.",
    href: "/admin/dashboard",
    icon: Building2,
    authRedirect: "/admin/dashboard",
  },
];

const promptQuestions = [
  "ما شروط صحة الوقف في الفقه الإسلامي والقانون الفلسطيني؟",
  "كيف أبدأ في توثيق وقف جديد وما الجهات والإجراءات المرتبطة؟",
  "أريد تلخيصًا رسميًا لمفهوم نظارة الوقف ومسؤولياتها.",
  "ما الفرق بين السؤال العام والبحث المعرفي داخل المساعد؟",
  "كيف أستخدم الإعدادات التلقائية والمتقدمة بما يناسب دوري؟",
  "ما أبرز الخدمات التي يمكن أن ينفذها المساعد داخل المنصة؟",
  "كيف أراجع المراجع والروابط المرتبطة بإجابة المساعد؟",
  "ما أفضل نقطة دخول لي: المحادثة أم المعرفة أم البحث؟",
  "هل يمكن للمساعد توجيهي إلى الصفحة الصحيحة داخل النظام؟",
] as const;

const smartEntryCards = [
  {
    title: "افتح المحادثة",
    description: "للسؤال المباشر والمتابعة التفاعلية داخل واجهة المحادثة الكاملة.",
    icon: MessageSquare,
    href: "/chat",
  },
  {
    title: "ابدأ من المعرفة",
    description: "للوصول إلى المحتوى المعرفي والمراجع المعتمدة قبل طرح السؤال أو بعده.",
    icon: BookOpen,
    href: "/knowledge-base",
  },
  {
    title: "انتقل إلى البحث",
    description: "للبحث في الوثائق والمعرفة والمحتوى المنظم للوصول الأدق للمعلومة.",
    icon: Search,
    href: "/search",
  },
] as const;

const workflows = [
  {
    title: "ابدأ من الصفحة الرئيسية",
    description: "اقرأ المدخل المؤسسي المختصر ثم اختر مسار الاستخدام الأنسب لك.",
  },
  {
    title: "اختر نقطة الدخول الصحيحة",
    description: "محادثة، معرفة، بحث، أو إدارة؛ دون تنقل عشوائي بين الصفحات.",
  },
  {
    title: "انتقل إلى العمق عند الحاجة",
    description: "ابدأ سريعًا ثم تابع من الصفحات المتخصصة أو من المحادثة الكاملة.",
  },
] as const;

export default function Home() {
  const { isAuthenticated, logout } = useAuth();
  const { settings } = useSiteSettings();

  const [message, setMessage] = useState("");
  const [guestMessageCount, setGuestMessageCount] = useState(0);
  const [showLimitDialog, setShowLimitDialog] = useState(false);
  const [chatMessages, setChatMessages] = useState<HomeMessage[]>([]);
  const [conversationId, setConversationId] = useState<number | null>(null);

  const MAX_GUEST_MESSAGES = 3;
  const createConversationMutation = trpc.chat.createConversation.useMutation();
  const chatMutation = trpc.chat.sendMessage.useMutation();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const siteName = settings?.siteName?.trim() || "PalWaqf AI";
  const siteDescription =
    settings?.siteDescription?.trim() ||
    "واجهة رسمية موحدة للمحادثة الذكية والبحث والمعرفة والمراجع ضمن بيئة الأوقاف.";

  const pageHead = (
    <PageHead
      pageName="home"
      defaultTitle="المساعد الذكي المتخصص في الأوقاف الإسلامية في فلسطين"
      defaultDescription="واجهة رسمية احترافية للمساعد الذكي، تجمع بين المحادثة والبحث والمعرفة والمراجع ضمن تجربة عربية موحدة."
    />
  );

  const fullChatHref = useMemo(() => {
    if (message.trim() && isAuthenticated) {
      return `/chat?message=${encodeURIComponent(message.trim())}`;
    }
    return isAuthenticated ? getAppHref("/chat") : getLoginUrl("/chat");
  }, [isAuthenticated, message]);

  const loginToChatHref = useMemo(() => getLoginUrl("/chat"), []);
  const loginToAdminHref = useMemo(() => getLoginUrl("/admin/dashboard"), []);

  const visibleQuickLinks = useMemo(() => {
    return quickLinksBase.filter((item) => (item.href === "/admin/dashboard" ? isAuthenticated : true));
  }, [isAuthenticated]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages, chatMutation.isPending]);

  const askQuestion = (question: string) => {
    setMessage(question);
    textareaRef.current?.focus();
  };

  const clearChat = () => {
    setChatMessages([]);
    setConversationId(null);
  };

  const handleLogout = async () => {
    await logout();
    window.location.assign(getAppHref("/"));
  };

  const handleSend = async () => {
    const currentMessage = message.trim();
    if (!currentMessage) return;

    if (!isAuthenticated) {
      if (guestMessageCount >= MAX_GUEST_MESSAGES) {
        setShowLimitDialog(true);
        return;
      }
      setGuestMessageCount((prev) => prev + 1);
    }

    setChatMessages((prev) => [...prev, { role: "user", content: currentMessage }]);
    setMessage("");

    if (!isAuthenticated) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "هذه معاينة سريعة للمساعد. للوصول إلى المحادثة الكاملة، والمراجع، وسجل المحادثات، يرجى تسجيل الدخول أو الانتقال إلى واجهة المحادثة الكاملة.",
        },
      ]);
      return;
    }

    try {
      let convId = conversationId;
      if (!convId) {
        const newConv = await createConversationMutation.mutateAsync({
          title: currentMessage.slice(0, 100),
          category: "general",
        });
        convId = newConv.id;
        setConversationId(convId);
      }

      if (!convId) throw new Error("تعذر إنشاء المحادثة");

      const response = await chatMutation.mutateAsync({
        conversationId: convId,
        message: currentMessage,
      });

      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response.assistantMessage?.content || "تعذر توليد الرد في هذه اللحظة.",
        },
      ]);
    } catch (error) {
      console.error("Home assistant preview error:", error);
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "حدث خطأ أثناء معالجة الطلب. يمكنك المتابعة من واجهة المحادثة الكاملة أو إعادة المحاولة.",
        },
      ]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <>
      {pageHead}
      <div dir="rtl" className="public-page-shell rebuild-home-page">
        <section className="rebuild-home-hero py-14 md:py-18 lg:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="rebuild-home-shell mx-auto max-w-6xl text-center">
              <div className="flex justify-center">
                <div className="rebuild-home-badge">
                  <Sparkles className="h-4 w-4" />
                  <span>واجهة رئيسية رسمية للمساعد الذكي</span>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <h1 className="text-3xl font-bold leading-tight md:text-4xl lg:text-5xl">
                  {siteName}
                  <span className="rebuild-home-accent mt-3 block">
                    مساعد ذكي احترافي لخدمة المعرفة والبحث والاستشارات الوقفية
                  </span>
                </h1>
                <p className="mx-auto max-w-4xl text-base leading-8 text-muted-foreground md:text-lg">
                  {siteDescription}
                </p>
              </div>

              <div className="rebuild-home-metrics mt-8 grid gap-3 sm:grid-cols-3">
                {heroMetrics.map((metric) => (
                  <div key={metric.label} className="rebuild-home-metric rounded-2xl p-4">
                    <div className="text-lg font-bold text-primary">{metric.value}</div>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">{metric.label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
                <Button asChild size="lg" className="rebuild-home-primary-cta min-w-[220px] text-base">
                  <a href={fullChatHref}>
                    <MessageSquare className="ml-2 h-5 w-5 text-current" />
                    ابدأ المحادثة الكاملة
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline" className="rebuild-home-secondary-cta min-w-[220px] text-base">
                  <a href={getAppHref("/search")}>
                    <Search className="ml-2 h-5 w-5 text-current" />
                    ابدأ من البحث الذكي
                  </a>
                </Button>
                {isAuthenticated ? (
                  <>
                    <Button asChild size="lg" variant="outline" className="rebuild-home-secondary-cta min-w-[220px] text-base">
                      <a href={getAppHref("/knowledge-base")}>
                        <BookOpen className="ml-2 h-5 w-5 text-current" />
                        استعراض المعرفة
                      </a>
                    </Button>
                    <Button size="lg" variant="outline" className="rebuild-home-secondary-cta min-w-[220px] text-base" onClick={handleLogout}>
                      <LogOut className="ml-2 h-5 w-5 text-current" />
                      تسجيل الخروج
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild size="lg" className="rebuild-home-secondary-solid min-w-[220px] text-base">
                      <a href={loginToChatHref}>
                        <LogIn className="ml-2 h-5 w-5 text-current" />
                        تسجيل الدخول
                      </a>
                    </Button>
                    <div className="rebuild-home-pill">
                      <Shield className="h-4 w-4" />
                      {MAX_GUEST_MESSAGES - guestMessageCount} رسائل معاينة متبقية
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        <main className="pb-12 md:pb-16">
          <div className="container mx-auto space-y-8 px-4 md:px-6">
            <section className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
              <Card className="rebuild-home-card rounded-[1.8rem] border-border/70">
                <CardHeader className="pb-4">
                  <div className="rebuild-home-section-badge">
                    <Gauge className="h-4 w-4" />
                    لوحة دخول ذكية
                  </div>
                  <CardTitle className="pt-2 text-2xl">ابدأ من المسار المناسب بدل التنقل العشوائي</CardTitle>
                  <CardDescription className="text-sm leading-7">
                    اختر نقطة الدخول الصحيحة: محادثة كاملة، معرفة، بحث، أو انتقال إداري بعد الدخول. الهدف هو تقليل التشتت وتوجيه المستخدم منذ البداية.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5 pt-0">
                  <div className="grid gap-4 md:grid-cols-3">
                    {smartEntryCards.map((item) => {
                      const Icon = item.icon;
                      const href = item.href === "/chat" && !isAuthenticated ? loginToChatHref : getAppHref(item.href);
                      return (
                        <a key={item.title} href={href} className="rebuild-home-entry-card rounded-2xl p-5 text-right">
                          <div className="mb-4 flex items-center gap-3">
                            <div className="rebuild-home-icon-box h-11 w-11 shrink-0">
                              <Icon className="h-5 w-5 text-current" />
                            </div>
                            <h3 className="text-base font-bold text-foreground">{item.title}</h3>
                          </div>
                          <p className="text-sm leading-7 text-muted-foreground">{item.description}</p>
                        </a>
                      );
                    })}
                  </div>

                  <div className="space-y-3 rounded-2xl border border-border/70 bg-background/70 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Settings2 className="h-4 w-4 text-primary" />
                      مسارات استخدام واضحة
                    </div>
                    <div className="space-y-3">
                      <div className="rebuild-home-trust-line">
                        <span>الوضع التلقائي</span>
                        <span>للزائر والمستخدم غير المتخصص</span>
                      </div>
                      <div className="rebuild-home-trust-line">
                        <span>الوضع المتقدم</span>
                        <span>للخبراء والمشرفين وفرق المعرفة</span>
                      </div>
                      <div className="rebuild-home-trust-line">
                        <span>الدخول الإداري</span>
                        <span>{isAuthenticated ? "متاح من لوحة التحكم" : "بعد تسجيل الدخول بصلاحية مناسبة"}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rebuild-home-card rounded-[1.8rem] border-border/70">
                <CardHeader className="pb-4">
                  <div className="rebuild-home-section-badge rebuild-home-section-badge--alt">
                    <Brain className="h-4 w-4" />
                    لماذا هذه الواجهة؟
                  </div>
                  <CardTitle className="pt-2 text-2xl">مدخل رسمي واحد للمساعد بدل تعدد البوابات</CardTitle>
                  <CardDescription className="text-sm leading-7">
                    صُممت هذه الصفحة لتكون نقطة الانطلاق الرسمية، وتوحّد المعرفة والبحث والمحادثة والمراجع ضمن تجربة عربية واضحة ومتماسكة.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 pt-0">
                  {capabilityCards.slice(0, 3).map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.title} className="rebuild-home-row rounded-2xl p-4">
                        <div className="flex items-start gap-3">
                          <div className="rebuild-home-icon-box rebuild-home-icon-box--gold h-10 w-10 shrink-0">
                            <Icon className="h-5 w-5 text-current" />
                          </div>
                          <div className="space-y-1">
                            <h3 className="font-bold text-foreground">{item.title}</h3>
                            <p className="text-sm leading-7 text-muted-foreground">{item.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </section>

            <section className="mx-auto grid max-w-6xl gap-6 xl:grid-cols-12 xl:items-start">
              <div className="xl:col-span-8">
                <Card className="rebuild-home-card rounded-[1.85rem] border-border/70">
                  <CardHeader className="gap-4 border-b border-border/70 pb-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="rebuild-home-section-badge">
                          <MessageSquare className="h-4 w-4" />
                          مساحة المساعد الذكي
                        </div>
                        <CardTitle className="pt-2 text-2xl">اختبر السؤال هنا ثم انتقل عند الحاجة</CardTitle>
                        <CardDescription className="text-sm leading-7">
                          هذه معاينة أولية للمساعد. يمكنك تجربة السؤال الآن أو فتح المحادثة الكاملة عندما تحتاج إلى متابعة أطول أو سجل محادثات أو مراجع.
                        </CardDescription>
                      </div>
                      {chatMessages.length > 0 ? (
                        <Button variant="outline" size="sm" onClick={clearChat} className="w-full lg:w-auto">
                          مسح المعاينة
                        </Button>
                      ) : null}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-5 pt-5">
                    <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                      <div
                        ref={chatContainerRef}
                        className="flex max-h-[320px] min-h-[240px] flex-col gap-4 overflow-y-auto rounded-xl bg-background/50 p-4"
                      >
                        {chatMessages.length === 0 ? (
                          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                            <div className="rebuild-home-icon-box h-14 w-14">
                              <Sparkles className="h-7 w-7 text-current" />
                            </div>
                            <div className="space-y-2">
                              <h3 className="text-lg font-bold text-foreground">واجهة أولية للمساعد الذكي</h3>
                              <p className="mx-auto max-w-2xl text-sm leading-7 text-muted-foreground">
                                اكتب سؤالك هنا، أو اختر واحدًا من الأسئلة الجاهزة، أو افتح المحادثة الكاملة عندما تحتاج إلى متابعة أطول.
                              </p>
                            </div>
                          </div>
                        ) : (
                          <>
                            {chatMessages.map((chatMessage, index) => (
                              <div
                                key={`${chatMessage.role}-${index}`}
                                className={cn(
                                  "flex gap-3 rounded-2xl p-4",
                                  chatMessage.role === "user"
                                    ? "mr-auto max-w-[88%] bg-primary text-primary-foreground"
                                    : "ml-auto max-w-[94%] bg-muted text-foreground"
                                )}
                              >
                                <div className="mt-1 shrink-0">
                                  {chatMessage.role === "user" ? (
                                    <Users className="h-4 w-4 text-current" />
                                  ) : (
                                    <Sparkles className="h-4 w-4 text-primary" />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1 text-sm leading-7">
                                  {chatMessage.role === "assistant" ? (
                                    <div className="prose prose-sm max-w-none break-words dark:prose-invert [&_*]:break-words">
                                      <Streamdown>{chatMessage.content}</Streamdown>
                                    </div>
                                  ) : (
                                    <p className="break-words">{chatMessage.content}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                            {chatMutation.isPending ? (
                              <div className="ml-auto flex max-w-[94%] items-center gap-3 rounded-2xl bg-muted p-4 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                جاري توليد الرد...
                              </div>
                            ) : null}
                          </>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Textarea
                        ref={textareaRef}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="اكتب سؤالك أو القضية أو المسار الذي تريد أن يساعدك فيه المساعد..."
                        className="min-h-[108px] max-h-[180px] resize-none rounded-2xl border-border/80 bg-background/80 text-right leading-7"
                        style={{ overflow: "hidden" }}
                      />
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <p className="text-xs leading-6 text-muted-foreground">
                          Enter للإرسال السريع، وShift + Enter لسطر جديد. ويمكنك الانتقال إلى المحادثة الكاملة في أي وقت.
                        </p>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Button asChild variant="outline">
                            <a href={fullChatHref}>
                              <MessageSquare className="ml-2 h-4 w-4" />
                              فتح المحادثة الكاملة
                            </a>
                          </Button>
                          <Button onClick={() => void handleSend()} disabled={!message.trim() || chatMutation.isPending} className="rebuild-home-primary-cta">
                            <Send className="ml-2 h-4 w-4 text-current" />
                            إرسال
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="rebuild-home-prompts-grid grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {promptQuestions.map((prompt) => (
                        <button key={prompt} type="button" onClick={() => askQuestion(prompt)} className="rebuild-home-prompt-button">
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6 xl:col-span-4">
                <Card className="rebuild-home-card rounded-[1.8rem] border-border/70">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl">روابط تشغيل سريعة</CardTitle>
                    <CardDescription className="leading-7">
                      انتقالات أساسية مختصرة إلى أهم صفحات النظام دون امتداد طولي زائد.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2 pt-0">
                    {visibleQuickLinks.map((item) => {
                      const Icon = item.icon;
                      const href = !isAuthenticated && item.authRedirect ? getLoginUrl(item.authRedirect) : getAppHref(item.href);
                      return (
                        <a key={item.href} href={href} className="rebuild-home-quicklink rounded-2xl p-4">
                          <div className="flex items-start gap-3">
                            <div className="rebuild-home-icon-box h-10 w-10 shrink-0">
                              <Icon className="h-5 w-5 text-current" />
                            </div>
                            <div className="min-w-0 space-y-1">
                              <h3 className="font-bold text-foreground">{item.title}</h3>
                              <p className="line-clamp-2 text-sm leading-7 text-muted-foreground">{item.description}</p>
                            </div>
                          </div>
                        </a>
                      );
                    })}
                  </CardContent>
                </Card>

                <Card className="rebuild-home-card rounded-[1.8rem] border-border/70">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl">كيف تعمل الواجهة الرئيسية؟</CardTitle>
                    <CardDescription className="leading-7">
                      ترتيب واضح يبدأ بالمعلومة المؤسسية، ثم اختيار المسار، ثم اختبار السؤال أو الانتقال إلى الصفحات المتخصصة.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3 pt-0">
                    {workflows.map((workflow, index) => (
                      <div key={workflow.title} className="rebuild-home-row rounded-2xl p-4">
                        <div className="mb-2 flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                            {index + 1}
                          </div>
                          <h3 className="font-bold text-foreground">{workflow.title}</h3>
                        </div>
                        <p className="text-sm leading-7 text-muted-foreground">{workflow.description}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </section>

            <section className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-3">
              {capabilityCards.slice(3).map((item) => {
                const Icon = item.icon;
                return (
                  <Card key={item.title} className="rebuild-home-card rounded-[1.8rem] border-border/70 h-full">
                    <CardContent className="flex h-full flex-col space-y-4 p-6">
                      <div className="rebuild-home-icon-box rebuild-home-icon-box--gold h-12 w-12">
                        <Icon className="h-6 w-6 text-current" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold text-foreground">{item.title}</h3>
                        <p className="text-sm leading-7 text-muted-foreground">{item.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </section>

            <DynamicSectionsContainer />
          </div>
        </main>

        <Dialog open={showLimitDialog} onOpenChange={setShowLimitDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>بلغت حد المعاينة السريعة</DialogTitle>
              <DialogDescription>
                يمكنك الاستمرار عبر تسجيل الدخول للوصول إلى المحادثة الكاملة وسجل المحادثات والبحث والمراجع المرتبطة.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setShowLimitDialog(false)}>
                لاحقًا
              </Button>
              <Button asChild className="rebuild-home-primary-cta">
                <a href={loginToChatHref}>
                  <LogIn className="ml-2 h-4 w-4 text-current" />
                  تسجيل الدخول
                </a>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

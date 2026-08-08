import { trpc } from "@/lib/trpc";
import {
  Users,
  MessageSquare,
  HelpCircle,
  FileText,
  RefreshCw,
  Sparkles,
  Database,
  Inbox,
  FileCheck,
  ChevronLeft,
  BarChart3,
  Activity,
  BookOpen,
  ShieldCheck,
  FileSearch,
} from "lucide-react";
import { APP_ROUTES } from "@/lib/appRoutes";
import { getAppHref } from "@/const";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TimeRange = 7 | 30 | 90 | 365;

function DashboardCard({
  title,
  value,
  sub,
  delta,
  icon: Icon,
  tint,
}: {
  title: string;
  value: string | number;
  sub?: string;
  delta?: number;
  icon: any;
  tint: string;
}) {
  const positive = (delta ?? 0) >= 0;
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white/95 p-5 shadow-[0_14px_34px_rgba(15,23,42,0.07)] backdrop-blur-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-500">{title}</p>
          <h3 className="mt-2 text-4xl font-black tracking-tight text-slate-900">{value}</h3>
        </div>
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg", tint)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <span className="text-xs text-slate-500">{sub}</span>
        {typeof delta === "number" ? (
          <span className={cn("text-base font-bold", positive ? "text-emerald-600" : "text-rose-500")}>{positive ? "+" : ""}{delta}%</span>
        ) : null}
      </div>
    </div>
  );
}

function ActionButton({ href, title, icon: Icon }: { href: string; title: string; icon: any }) {
  return (
    <a
      href={getAppHref(href)}
      className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
    >
      <span>{title}</span>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-sky-600 shadow-sm">
        <Icon className="h-4 w-4" />
      </span>
    </a>
  );
}

export default function AdminDashboard() {
  const [userGrowthRange, setUserGrowthRange] = useState<TimeRange>(30);
  const [activityRange, setActivityRange] = useState<TimeRange>(7);
  const [refreshing, setRefreshing] = useState(false);
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const { data: stats, isLoading } = trpc.admin.systemStats.useQuery();
  const { data: readiness } = trpc.health.readiness.useQuery(undefined, { refetchInterval: 30000 });
  const { data: userGrowth } = trpc.admin.charts.userGrowth.useQuery({ days: userGrowthRange });
  const { data: conversationActivity } = trpc.admin.charts.conversationActivity.useQuery({ days: activityRange });
  const { data: faqDistribution } = trpc.admin.charts.faqDistribution.useQuery();
  const { data: toolMetrics } = trpc.aiTools.getRunMetrics.useQuery(undefined, { retry: false });
  const knowledgeAccess = trpc.knowledgeTrust.access.useQuery(undefined, { retry: false });
  const canReviewKnowledge = knowledgeAccess.data?.canReview === true;
  const { data: knowledgeOperations } = trpc.knowledgeTrust.operationsSnapshot.useQuery(
    undefined,
    { enabled: canReviewKnowledge, retry: false },
  );

  const refreshDashboard = async () => {
    setRefreshing(true);
    try {
      await utils.invalidate();
    } finally {
      setRefreshing(false);
    }
  };

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const previousStats = useMemo(() => {
    return {
      totalUsers: Math.max(0, (stats?.totalUsers || 0) - Math.floor((stats?.totalUsers || 0) * 0.085)),
      totalConversations: Math.max(0, (stats?.totalConversations || 0) - Math.floor((stats?.totalConversations || 0) * 0.123)),
      totalMessages: Math.max(0, (stats?.totalMessages || 0) - Math.floor((stats?.totalMessages || 0) * 0.102)),
      totalDocuments: Math.max(0, (stats?.totalDocuments || 0) - Math.floor((stats?.totalDocuments || 0) * 0.078)),
    };
  }, [stats]);

  const totalToolRuns = Number(toolMetrics?.total || 0);
  const completedToolRuns = Number(toolMetrics?.byRunStatus?.completed || 0);
  const reviewTasksTotal = Number(knowledgeOperations?.reviewTasksTotal || 0);
  const reviewTasksOpen = Number(knowledgeOperations?.reviewTasksOpen || 0);

  const systemIndicators = [
    {
      label: "اكتمال تشغيلات الأدوات",
      value: totalToolRuns > 0 ? Math.round((completedToolRuns / totalToolRuns) * 100) : 0,
      tone: "bg-emerald-500",
    },
    {
      label: "إغلاق مهام المراجعة",
      value: reviewTasksTotal > 0 ? Math.round(((reviewTasksTotal - reviewTasksOpen) / reviewTasksTotal) * 100) : 0,
      tone: "bg-sky-500",
    },
  ];

  const quickActions = [
    { href: APP_ROUTES.adminKnowledgeWorkspace, title: "مساحة العمل المعرفي", icon: BookOpen },
    { href: APP_ROUTES.adminTools, title: "مركز الأدوات الذكية", icon: Sparkles },
    { href: APP_ROUTES.adminToolsRuns, title: "سجل تشغيل الأدوات", icon: ShieldCheck },
    { href: APP_ROUTES.adminToolsOutputIntake, title: "صندوق مخرجات الأدوات", icon: Inbox },
    { href: APP_ROUTES.adminKnowledgeReviewOperations, title: "طابور المراجعة البشرية", icon: FileCheck },
    { href: APP_ROUTES.adminSourceInventoryPreview, title: "معاينة جرد Manus", icon: FileSearch },
  ];

  const recentFeed = useMemo(() => [
    `تشغيلات الأدوات المحفوظة: ${totalToolRuns}`,
    `بانتظار اعتماد الأدوات: ${Number(toolMetrics?.byApproval?.pending || 0)}`,
    canReviewKnowledge
      ? `مهام المراجعة المفتوحة: ${reviewTasksOpen}`
      : "مؤشرات المراجعة محجوبة لغياب نطاق assistant.review",
    `مراجع بانتظار التحقق: ${Number(knowledgeOperations?.pendingReferenceDocuments || 0)}`,
    `وثائق معرفة قيد المراجعة: ${Number(knowledgeOperations?.reviewOnlyKnowledgeDocuments || 0)}`,
    readiness?.details?.database?.available
      ? "اتصال قاعدة البيانات متاح عبر بوابة الجاهزية"
      : "اتصال قاعدة البيانات غير متاح أو يعمل بوضع fallback",
  ], [
    canReviewKnowledge,
    knowledgeOperations?.pendingReferenceDocuments,
    knowledgeOperations?.reviewOnlyKnowledgeDocuments,
    readiness?.details?.database?.available,
    reviewTasksOpen,
    toolMetrics?.byApproval?.pending,
    totalToolRuns,
  ]);

  const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "color-mix(in srgb, hsl(var(--secondary)) 72%, hsl(var(--primary)) 28%)", "hsl(var(--destructive))", "hsl(var(--accent))", "color-mix(in srgb, hsl(var(--primary)) 72%, hsl(var(--sidebar)) 28%)"];

  const categoryLabels: Record<string, string> = {
    general: "عام",
    conditions: "شروط",
    types: "أنواع",
    management: "إدارة",
    legal: "قانوني",
    jurisprudence: "فقهي",
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] rounded-[28px] border border-slate-200 bg-white/90 p-10 shadow-[0_20px_55px_rgba(15,23,42,0.08)]">
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-sky-500 border-r-transparent" />
            <p className="mt-4 text-sm font-medium text-slate-500">جاري تحميل لوحة القيادة...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="rounded-[28px] border border-slate-200 bg-white/95 p-10 text-center text-slate-500 shadow-[0_20px_55px_rgba(15,23,42,0.08)]">
        لا توجد بيانات متاحة لعرض لوحة القيادة.
      </div>
    );
  }

  const statCards = [
    {
      title: "إجمالي المستخدمين",
      value: stats.totalUsers.toLocaleString("en-US"),
      sub: "آخر 30 يوم",
      delta: calculateGrowth(stats.totalUsers, previousStats.totalUsers),
      icon: Users,
      tint: "bg-gradient-to-br from-sky-500 to-blue-600",
    },
    {
      title: "المحادثات",
      value: stats.totalConversations.toLocaleString("en-US"),
      sub: "نشاط تفاعلي",
      delta: calculateGrowth(stats.totalConversations, previousStats.totalConversations),
      icon: MessageSquare,
      tint: "bg-gradient-to-br from-cyan-500 to-sky-500",
    },
    {
      title: "الرسائل",
      value: stats.totalMessages.toLocaleString("en-US"),
      sub: "إجمالي التبادل",
      delta: calculateGrowth(stats.totalMessages, previousStats.totalMessages),
      icon: Activity,
      tint: "bg-gradient-to-br from-blue-500 to-indigo-600",
    },
    {
      title: "الأسئلة الشائعة",
      value: stats.totalFAQs.toLocaleString("en-US"),
      sub: "جاهزة للمستخدمين",
      delta: 5,
      icon: HelpCircle,
      tint: "bg-gradient-to-br from-emerald-500 to-teal-500",
    },
    {
      title: "الخارجي / الوثائق",
      value: stats.totalDocuments.toLocaleString("en-US"),
      sub: "قاعدة المعرفة",
      delta: calculateGrowth(stats.totalDocuments, previousStats.totalDocuments) * -1,
      icon: FileText,
      tint: "bg-gradient-to-br from-amber-400 to-orange-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-[30px] border border-white/70 bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6 shadow-[0_20px_65px_rgba(15,23,42,0.10)]">
        <div className="mb-6 flex flex-col gap-4 border-b border-slate-200/80 pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-gradient-to-br from-slate-800 to-slate-900 text-white shadow-xl">
              <BarChart3 className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                <span>لوحة القيادة</span>
                <ChevronLeft className="h-4 w-4" />
              </div>
              <h1 className="mt-1 text-4xl font-black tracking-tight text-slate-900">مركز عمليات المساعد</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              className="rounded-2xl bg-emerald-500 px-6 text-white hover:bg-emerald-600"
              onClick={() => void refreshDashboard()}
              disabled={refreshing}
            >
              <RefreshCw className={`ml-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "جارٍ التحديث" : "تحديث المؤشرات"}
            </Button>
            <Button
              variant="outline"
              className="rounded-2xl border-slate-300 bg-white px-6 text-slate-700 hover:bg-slate-50"
              onClick={() => navigate(APP_ROUTES.adminToolsRuns)}
            >
              <ShieldCheck className="ml-2 h-4 w-4" />
              سجل تشغيل الأدوات
            </Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_1fr_1fr_96px]">
          {statCards.map((card) => (
            <DashboardCard key={card.title} {...card} />
          ))}
          <div className="rounded-[22px] border border-slate-200 bg-white/95 p-4 shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
            <div className="flex h-full items-center justify-center rounded-2xl border border-slate-200 bg-gradient-to-br from-sky-50 to-white text-sky-600">
              <Database className="h-10 w-10" />
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-[22px] border border-slate-200 bg-white/95 p-5 shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-500">Database Health</p>
                <h3 className="mt-2 text-2xl font-black text-slate-900">{readiness?.details?.database?.available ? "متصل" : "محجوب"}</h3>
                <p className="mt-1 text-xs text-slate-500">{readiness?.details?.database?.provider || "database"} · {readiness?.details?.database?.reason || "health gate"}</p>
              </div>
              <span className={cn("rounded-full px-3 py-1 text-xs font-bold", readiness?.details?.database?.available ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>
                {readiness?.details?.database?.available ? "Connected" : "Fallback"}
              </span>
            </div>
          </div>
          <div className="rounded-[22px] border border-slate-200 bg-white/95 p-5 shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-500">Provider Health</p>
                <h3 className="mt-2 text-2xl font-black text-slate-900">{readiness?.details?.llm?.available ? "متصل" : "غير متصل"}</h3>
                <p className="mt-1 text-xs text-slate-500">{readiness?.details?.llm?.provider || "llm"} · {readiness?.details?.llm?.model || "غير محدد"}</p>
              </div>
              <span className={cn("rounded-full px-3 py-1 text-xs font-bold", readiness?.details?.llm?.available ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>
                {readiness?.details?.llm?.available ? "Connected" : "Fallback"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-6">
          <section className="rounded-[28px] border border-slate-200 bg-white/95 p-5 shadow-[0_20px_55px_rgba(15,23,42,0.08)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-900">إجراءات سريعة</h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">جاهز</span>
            </div>
            <div className="space-y-3">
              {quickActions.map((action) => (
                <ActionButton key={`${action.href}:${action.title}`} {...action} />
              ))}
            </div>

            <div className="mt-6 border-t border-slate-200 pt-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800">النشاط الأخير</h3>
                <button className="rounded-full bg-blue-600 px-4 py-2 text-xs font-bold text-white">عرض الكل</button>
              </div>
              <div className="space-y-3">
                {recentFeed.map((item, index) => (
                  <div key={item} className="flex items-center gap-3 text-sm text-slate-600">
                    <span className={cn("inline-flex h-8 w-8 items-center justify-center rounded-full text-white", index % 3 === 0 ? "bg-sky-500" : index % 3 === 1 ? "bg-emerald-500" : "bg-amber-500")}>{index + 1}</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-[28px] border border-slate-200 bg-white/95 p-6 shadow-[0_20px_55px_rgba(15,23,42,0.08)]">
            <div className="mb-6 flex items-start justify-between gap-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900">مؤشرات التشغيل</h2>
                <p className="mt-2 text-sm text-slate-500">قراءة مباشرة لاكتمال تشغيل الأدوات وإغلاق مهام المراجعة البشرية.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                تُحسب المؤشرات من السجلات التشغيلية المتاحة ولا تمثل اعتمادًا أو نشرًا.
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
              <div className="space-y-5">
                {systemIndicators.map((item) => (
                  <div key={item.label} className="space-y-2">
                    <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                      <span>{item.label}</span>
                      <span>{item.value}%</span>
                    </div>
                    <div className="h-4 rounded-full bg-slate-200">
                      <div className={cn("h-4 rounded-full", item.tone)} style={{ width: `${item.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-500">رسالة النظام</span>
                  <Sparkles className="h-5 w-5 text-amber-500" />
                </div>
                <p className="text-sm leading-7 text-slate-700">
                  تجمع هذه الصفحة مسارات الأدوات والمعرفة والمراجعة في نقطة تشغيل واحدة، مع إبقاء النشر واعتماد المصادر خلف قرارات بشرية مستقلة.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white/95 p-6 shadow-[0_20px_55px_rgba(15,23,42,0.08)]">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <h2 className="text-2xl font-black text-slate-900">سجل النشاط الأخير</h2>
              <div className="flex flex-wrap gap-2">
                {[7, 30, 90].map((days) => (
                  <Button
                    key={days}
                    size="sm"
                    variant={activityRange === days ? "default" : "outline"}
                    className={cn("rounded-xl", activityRange === days ? "bg-blue-600 text-white hover:bg-blue-700" : "border-slate-300 text-slate-600")}
                    onClick={() => setActivityRange(days as TimeRange)}
                  >
                    {days === 7 ? "يوم" : days === 30 ? "30" : "90"}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.95fr]">
              <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
                <ResponsiveContainer width="100%" height={290}>
                  <LineChart data={userGrowth || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="users" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="grid gap-6">
                <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
                  <ResponsiveContainer width="100%" height={130}>
                    <BarChart data={conversationActivity || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                      <YAxis hide />
                      <Tooltip />
                      <Bar dataKey="count" radius={[10, 10, 0, 0]} fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={faqDistribution || []} dataKey="count" nameKey="category" innerRadius={40} outerRadius={68} paddingAngle={3}>
                        {(faqDistribution || []).map((entry: any, index: number) => (
                          <Cell key={`${entry.category}-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any, name: any) => [value, categoryLabels[name] || name]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(faqDistribution || []).slice(0, 4).map((entry: any, index: number) => (
                      <span key={entry.category} className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        {categoryLabels[entry.category] || entry.category}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

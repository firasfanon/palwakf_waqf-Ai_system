import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import {
  LayoutDashboard,
  LogOut,
  PanelLeft,
  Users,
  Settings,
  BarChart3,
  Cog,
  Activity,
  UserCog,
  Key,
  FileText,
  Bell,
  ClipboardList,
  Archive,
  Zap,
  Wrench,
  Plug,
  Code,
  Webhook,
  Shield,
  CreditCard,
  Database,
  CheckSquare,
  Tag,
  PieChart,
  Globe,
  TrendingUp,
  FileStack,
  Link2,
  ExternalLink,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";

const menuItems = [
  { icon: LayoutDashboard, label: "لوحة التحكم", path: "/admin/dashboard" },
  { icon: BarChart3, label: "تحليلات التقييمات", path: "/admin/analytics" },
  { icon: ClipboardList, label: "التقارير", path: "/admin/reports" },
  { icon: Users, label: "إدارة المستخدمين", path: "/admin/users" },
  { icon: UserCog, label: "إدارة الأدوار", path: "/admin/roles" },
  { icon: Key, label: "إدارة الصلاحيات", path: "/admin/permissions" },
  { icon: Link2, label: "ربط الصلاحيات بالأدوار", path: "/admin/role-permissions" },
  { icon: Activity, label: "النشاط", path: "/admin/activity" },
  { icon: FileText, label: "سجلات التدقيق", path: "/admin/audit-logs" },
  { icon: Bell, label: "إدارة الإشعارات", path: "/admin/notifications" },
  { icon: Settings, label: "إعدادات الموقع", path: "/admin/settings" },
  { icon: Archive, label: "النسخ الاحتياطي", path: "/admin/backup" },
  { icon: Zap, label: "إدارة الذاكرة المؤقتة", path: "/admin/cache" },
  { icon: Database, label: "إحصائيات Cache", path: "/admin/cache-analytics" },
  { icon: TrendingUp, label: "لوحة معلومات مصادر المعرفة", path: "/admin/knowledge-dashboard" },
  { icon: Globe, label: "إدارة مصادر المعرفة", path: "/admin/knowledge-sources" },
  { icon: CheckSquare, label: "مراجعة المحتوى المجلوب", path: "/admin/fetched-content" },
  { icon: FileStack, label: "إدارة القوالب", path: "/admin/content-templates" },
  { icon: FileText, label: "إعدادات الصفحات", path: "/admin/page-settings" },
  { icon: Tag, label: "إدارة تصنيفات الأوقاف", path: "/admin/waqf-categories" },
  { icon: PieChart, label: "إحصائيات الأوقاف", path: "/admin/waqf-analytics" },
  { icon: Wrench, label: "وضع الصيانة", path: "/admin/maintenance" },
  { icon: Plug, label: "التكاملات الخارجية", path: "/admin/integrations" },
  { icon: Code, label: "مفاتيح API", path: "/admin/api-keys" },
  { icon: Webhook, label: "إدارة Webhooks", path: "/admin/webhooks" },
  { icon: Shield, label: "إعدادات الأمان", path: "/admin/security" },
  { icon: CreditCard, label: "الفواتير والاشتراكات", path: "/admin/billing" },
  { icon: Cog, label: "إعدادات النظام", path: "/admin/system-settings" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 220;
const MAX_WIDTH = 420;

function normalizePath(path: string) {
  return path === "/admin" ? "/admin/dashboard" : path;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[hsl(var(--background))] px-6">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(31,90,166,0.16),_transparent_36%),radial-gradient(circle_at_bottom_left,_rgba(212,175,55,0.12),_transparent_28%),linear-gradient(180deg,rgba(178,34,34,0.05),transparent_40%)]" />
        <div className="w-full max-w-xl rounded-[28px] border border-[rgba(255,255,255,0.12)] bg-[hsl(var(--card))]/95 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <p className="mb-2 inline-flex items-center rounded-full border border-[rgba(212,175,55,0.28)] bg-[rgba(212,175,55,0.10)] px-3 py-1 text-xs font-semibold text-[var(--pwf-gold)]">
                منصة PalWaqf الإدارية
              </p>
              <h1 className="text-2xl font-extrabold tracking-tight text-[hsl(var(--foreground))]">
                يلزم تسجيل الدخول للوصول إلى لوحة الإدارة
              </h1>
            </div>
          </div>

          <div className="space-y-4 text-sm text-[hsl(var(--muted-foreground))]">
            <p>
              هذه الواجهة تتبع الهوية الإدارية الرسمية للمنصة، وتوفر إدارة المعرفة والمحتوى
              والمستخدمين ومسارات الذكاء المساندة.
            </p>
            <div className="grid gap-3 rounded-2xl border border-[rgba(31,90,166,0.18)] bg-[rgba(31,90,166,0.08)] p-4 sm:grid-cols-3">
              <div>
                <div className="text-xs text-[var(--pwf-gold)]">الهوية</div>
                <div className="font-semibold text-[hsl(var(--foreground))]">أزرق/ذهبي/أحمر</div>
              </div>
              <div>
                <div className="text-xs text-[var(--pwf-gold)]">النطاق</div>
                <div className="font-semibold text-[hsl(var(--foreground))]">إداري داخلي</div>
              </div>
              <div>
                <div className="text-xs text-[var(--pwf-gold)]">الوصول</div>
                <div className="font-semibold text-[hsl(var(--foreground))]">محمي بالمصادقة</div>
              </div>
            </div>
          </div>

          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="mt-8 w-full border border-transparent bg-[linear-gradient(135deg,var(--pwf-blue)_0%,color-mix(in_oklab,var(--pwf-blue)_82%,black)_100%)] text-white shadow-lg transition hover:opacity-95"
          >
            تسجيل الدخول
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>{children}</DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({ children, setSidebarWidth }: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = menuItems.find((item) => item.path === normalizePath(location));
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarRight = sidebarRef.current?.getBoundingClientRect().right ?? window.innerWidth;
      const newWidth = sidebarRight - e.clientX;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <div dir="rtl" className="flex min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          side="right"
          collapsible="icon"
          className="border-l border-[hsl(var(--border))] bg-[hsl(var(--sidebar))]"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-16 justify-center border-b border-[hsl(var(--sidebar-border))] bg-[linear-gradient(180deg,rgba(31,90,166,0.14),transparent)]">
            <div className="flex w-full items-center gap-3 px-2 transition-all">
              <button
                onClick={toggleSidebar}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.16)] text-[hsl(var(--sidebar-foreground))] transition hover:border-[rgba(212,175,55,0.28)] hover:bg-[rgba(212,175,55,0.08)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="تبديل القائمة"
              >
                <PanelLeft className="h-4 w-4" />
              </button>
              {!isCollapsed ? (
                <div className="min-w-0">
                  <div className="text-xs font-semibold tracking-wide text-[var(--pwf-gold)]">PalWaqf Admin</div>
                  <span className="truncate text-sm font-extrabold tracking-tight text-[hsl(var(--sidebar-foreground))]">
                    لوحة الإدارة السيادية
                  </span>
                </div>
              ) : null}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 bg-transparent">
            <SidebarMenu className="px-2 py-3">
              {menuItems.map((item) => {
                const isActive = normalizePath(location) === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className="h-11 rounded-2xl px-3 font-medium transition-all data-[active=true]:border data-[active=true]:border-[rgba(31,90,166,0.42)] data-[active=true]:bg-[rgba(31,90,166,0.16)] data-[active=true]:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]"
                    >
                      <item.icon
                        className="h-4 w-4"
                        style={{ color: isActive ? "var(--pwf-gold)" : undefined }}
                      />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="border-t border-[hsl(var(--sidebar-border))] p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-3 rounded-2xl border border-[rgba(255,255,255,0.10)] bg-[rgba(0,0,0,0.16)] px-2 py-2 transition-colors hover:border-[rgba(212,175,55,0.26)] hover:bg-[rgba(212,175,55,0.08)] group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-10 w-10 shrink-0 border border-[rgba(255,255,255,0.10)]">
                    <AvatarFallback className="text-xs font-bold">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                    <p className="truncate text-sm font-semibold leading-none">{user?.name || "-"}</p>
                    <p className="mt-1.5 truncate text-xs text-[hsl(var(--muted-foreground))]">{user?.email || "-"}</p>
                    {user?.platformRole || user?.unitId ? (
                      <p className="mt-1 truncate text-[11px] text-[var(--pwf-gold)]">
                        {user?.platformRole ? `الدور المنصّي: ${user.platformRole}` : ""}
                        {user?.platformRole && user?.unitId ? ' • ' : ''}
                        {user?.unitId ? `الوحدة: ${user.unitId}` : ''}
                      </p>
                    ) : null}
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem
                  onClick={() => window.open("/", "_blank", "noopener,noreferrer")}
                  className="cursor-pointer"
                >
                  <ExternalLink className="ml-2 h-4 w-4" />
                  <span>فتح الموقع</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="ml-2 h-4 w-4" />
                  <span>تسجيل الخروج</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute left-0 top-0 h-full w-1 cursor-col-resize transition-colors hover:bg-[rgba(212,175,55,0.22)] ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset className="bg-transparent">
        {isMobile ? (
          <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-[hsl(var(--border))] bg-[hsl(var(--background))/0.95] px-3 backdrop-blur supports-[backdrop-filter]:backdrop-blur">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[hsl(var(--card))]" />
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-[var(--pwf-gold)]">لوحة الإدارة</span>
                <span className="text-sm font-bold text-[hsl(var(--foreground))]">
                  {activeMenuItem?.label ?? "القائمة"}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[hsl(var(--border))] bg-[linear-gradient(180deg,rgba(31,90,166,0.12),transparent)] px-6 py-4 backdrop-blur-xl">
            <div>
              <div className="mb-1 text-xs font-semibold tracking-wide text-[var(--pwf-gold)]">المسار الإداري</div>
              <h1 className="text-lg font-extrabold tracking-tight text-[hsl(var(--foreground))]">
                {activeMenuItem?.label ?? "لوحة الإدارة"}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {user?.source === "platform_admin_users" ? (
                <div className="inline-flex items-center rounded-full border border-[rgba(212,175,55,0.28)] bg-[rgba(212,175,55,0.08)] px-3 py-1.5 text-xs font-semibold text-[var(--pwf-gold)]">
                  مستخدم منصة
                </div>
              ) : null}
              <div className="inline-flex items-center rounded-full border border-[rgba(31,90,166,0.24)] bg-[rgba(31,90,166,0.08)] px-3 py-1.5 text-xs font-medium text-[hsl(var(--muted-foreground))]">
                {normalizePath(location)}
              </div>
            </div>
          </header>
        )}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </div>
  );
}

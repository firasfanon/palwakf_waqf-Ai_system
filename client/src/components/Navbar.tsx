import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { Scale, Menu, X, Home, MessageSquare, BookOpen, HelpCircle, LayoutDashboard, Info, Mail , Settings, Shield, Users, FileText, Activity, ChevronDown, Building2, Gavel, FileCheck, ScrollText, Sparkles, Library, FolderOpen, BarChart3, Bell, Cog, Bookmark, Star, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useLocation } from "wouter";
import { useMemo, useState } from "react";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { hasAdminToolsAccess } from "@/lib/access";

export default function Navbar() {
  const { user, isAuthenticated } = useAuth();
  const { settings } = useSiteSettings();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Default menu items
  const defaultNavLinks = [
    { href: "/", label: "الرئيسية", icon: Home },
    { href: "/chat", label: "المحادثة", icon: MessageSquare },
    { href: "/knowledge-base", label: "قاعدة المعرفة", icon: BookOpen },
    { href: "/references", label: "مراجع الأراضي", icon: FileText },
    { href: "/about", label: "من نحن", icon: Info },
    { href: "/faqs", label: "الأسئلة الشائعة", icon: HelpCircle },
    { href: "/contact", label: "اتصل بنا", icon: Mail },
  ];

  const iconByHref: Record<string, any> = {
    "/": Home,
    "/chat": MessageSquare,
    "/knowledge": BookOpen,
    "/knowledge-base": BookOpen,
    "/references": FileText,
    "/about": Info,
    "/faqs": HelpCircle,
    "/contact": Mail,
    "/search": Search,
    "/bookmarks": Bookmark,
    "/favorites": Star,
    "/stats": BarChart3,
  };

  const navLinks = useMemo(() => {
    const normalizePublicHref = (href: string) => (href === "/knowledge" ? "/knowledge-base" : href);
    if (!settings?.menuItems) return defaultNavLinks;

    try {
      const parsed = JSON.parse(settings.menuItems);
      if (!Array.isArray(parsed) || parsed.length === 0) return defaultNavLinks;

      const normalized = parsed
        .filter((item: any) => item && typeof item.label === "string" && typeof item.href === "string")
        .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
        .map((item: any) => ({
          href: normalizePublicHref(item.href),
          label: item.label,
          icon: iconByHref[normalizePublicHref(item.href)] || iconByHref[item.href] || FileText,
        }));

      return normalized.length > 0 ? normalized : defaultNavLinks;
    } catch {
      return defaultNavLinks;
    }
  }, [settings?.menuItems]);

  return (
    <nav className="relative border-b sticky top-0 z-50 backdrop-blur-md bg-background/70 dark:bg-background/35">
      {/* brand sheen */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-primary/12 via-secondary/8 to-destructive/8 dark:from-primary/18 dark:via-secondary/10 dark:to-destructive/10" />
      <div className="container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 cursor-pointer">
              {settings?.logoUrl ? (
                <img 
                  src={settings.logoUrl} 
                  alt={settings.siteName} 
                  className="h-10 w-auto object-contain"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/15 border border-border/60">
                  <Scale className="w-6 h-6 text-primary" />
                </div>
              )}
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location === link.href || (link.href === "/knowledge-base" && location === "/knowledge");
              return (
                <Link 
                  key={link.href} 
                  href={link.href}
                  className={
                    "flex items-center gap-2 text-sm font-semibold transition-colors " +
                    (isActive ? "text-primary" : "text-foreground/80 hover:text-foreground")
                  }
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-muted-foreground">مرحباً، {user?.name}</span>
                
                {/* Admin Button/Dropdown - Desktop: Direct Link, Mobile: Dropdown */}
                {hasAdminToolsAccess(user) && (
                  <>
                    {/* Desktop: Direct link to Dashboard */}
                    <Button variant="outline" size="sm" asChild className="hidden lg:flex">
                      <Link href="/admin/dashboard">
                        <Shield className="w-4 h-4 ml-2" />
                        لوحة المسؤول
                      </Link>
                    </Button>
                    
                    {/* Tablet/Small Desktop: Dropdown Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild className="hidden md:flex lg:hidden">
                        <Button variant="outline" size="sm">
                          <Shield className="w-4 h-4 ml-2" />
                          لوحة المسؤول
                          <ChevronDown className="w-3 h-3 mr-2" />
                        </Button>
                      </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64">
                      <DropdownMenuLabel>إدارة النظام</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      
                      {/* لوحات التحكم */}
                      <DropdownMenuItem asChild>
                        <Link href="/admin/dashboard" className="cursor-pointer">
                          <LayoutDashboard className="w-4 h-4 ml-2" />
                          لوحة الإحصائيات
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/analytics" className="cursor-pointer">
                          <BarChart3 className="w-4 h-4 ml-2" />
                          التحليلات المتقدمة
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/cache-analytics" className="cursor-pointer">
                          <Star className="w-4 h-4 ml-2" />
                          إحصائيات Cache
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/interaction-stats" className="cursor-pointer">
                          <Bookmark className="w-4 h-4 ml-2" />
                          إحصائيات التفاعل
                        </Link>
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-xs">إدارة التفاعل</DropdownMenuLabel>
                      
                      <DropdownMenuItem asChild>
                        <Link href="/admin/notifications" className="cursor-pointer">
                          <Bell className="w-4 h-4 ml-2" />
                          إدارة الإشعارات
                        </Link>
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem asChild>
                        <Link href="/admin/comments" className="cursor-pointer">
                          <MessageSquare className="w-4 h-4 ml-2" />
                          إدارة التعليقات
                        </Link>
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-xs">إدارة البيانات</DropdownMenuLabel>
                      
                      {/* إدارة البيانات */}
                      <DropdownMenuItem asChild>
                        <Link href="/admin/properties" className="cursor-pointer">
                          <Building2 className="w-4 h-4 ml-2" />
                          إدارة العقارات
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/cases" className="cursor-pointer">
                          <Gavel className="w-4 h-4 ml-2" />
                          إدارة القضايا
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/rulings" className="cursor-pointer">
                          <FileCheck className="w-4 h-4 ml-2" />
                          إدارة الأحكام
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/deeds" className="cursor-pointer">
                          <ScrollText className="w-4 h-4 ml-2" />
                          إدارة الحجج
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/instructions" className="cursor-pointer">
                          <FileText className="w-4 h-4 ml-2" />
                          إدارة التعليمات
                        </Link>
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-xs">الأدوات والمكتبة</DropdownMenuLabel>
                      
                      {/* الأدوات */}
                      <DropdownMenuItem asChild>
                        <Link href="/admin/tools" className="cursor-pointer">
                          <Sparkles className="w-4 h-4 ml-2" />
                          الأدوات الذكية
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/library" className="cursor-pointer">
                          <Library className="w-4 h-4 ml-2" />
                          المكتبة الرقمية
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/knowledge" className="cursor-pointer">
                          <BookOpen className="w-4 h-4 ml-2" />
                          إدارة المراجع
                        </Link>
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-xs">إدارة المعرفة</DropdownMenuLabel>
                      
                      <DropdownMenuItem asChild>
                        <Link href="/admin/knowledge-dashboard" className="cursor-pointer">
                          <BarChart3 className="w-4 h-4 ml-2" />
                          لوحة معلومات مصادر المعرفة
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/knowledge-sources" className="cursor-pointer">
                          <BookOpen className="w-4 h-4 ml-2" />
                          إدارة مصادر المعرفة
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/fetched-content" className="cursor-pointer">
                          <FileText className="w-4 h-4 ml-2" />
                          مراجعة المحتوى المجلوب
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/data-fetching" className="cursor-pointer">
                          <Activity className="w-4 h-4 ml-2" />
                          جلب البيانات
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/files" className="cursor-pointer">
                          <FolderOpen className="w-4 h-4 ml-2" />
                          إدارة الملفات
                        </Link>
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-xs">النظام</DropdownMenuLabel>
                      
                      {/* النظام */}
                      <DropdownMenuItem asChild>
                        <Link href="/admin/users" className="cursor-pointer">
                          <Users className="w-4 h-4 ml-2" />
                          إدارة المستخدمين
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/content" className="cursor-pointer">
                          <FileText className="w-4 h-4 ml-2" />
                          إدارة المحتوى
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/notifications" className="cursor-pointer">
                          <Bell className="w-4 h-4 ml-2" />
                          الإشعارات
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/activity" className="cursor-pointer">
                          <Activity className="w-4 h-4 ml-2" />
                          سجل النشاط
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/settings" className="cursor-pointer">
                          <Settings className="w-4 h-4 ml-2" />
                          إعدادات الموقع
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/system-settings" className="cursor-pointer">
                          <Cog className="w-4 h-4 ml-2" />
                          إعدادات النظام
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}
                
                {/* Regular User Dashboard */}
                {user?.role !== "admin" && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/admin">
                      <LayoutDashboard className="w-4 h-4 ml-2" />
                      لوحة التحكم
                    </Link>
                  </Button>
                )}
                
                {/* Bookmarks & Favorites */}
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/bookmarks">
                    <Bookmark className="w-4 h-4" />
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/favorites">
                    <Star className="w-4 h-4" />
                  </Link>
                </Button>
              </>
            ) : (
              <Button size="sm" asChild>
                <a href={getLoginUrl()}>تسجيل الدخول</a>
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location === link.href || (link.href === "/knowledge-base" && location === "/knowledge");
                return (
                  <Link 
                    key={link.href} 
                    href={link.href}
                    className={`flex items-center gap-3 text-sm font-medium transition-colors hover:text-primary ${
                      isActive ? "text-primary" : "text-muted-foreground"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                );
              })}
              <div className="border-t pt-4 mt-2">
                {isAuthenticated ? (
                  <>
                    <p className="text-sm text-muted-foreground mb-3">مرحباً، {user?.name}</p>
                    
                    {/* Admin Links - Mobile */}
                    {hasAdminToolsAccess(user) && (
                      <div className="space-y-2 mb-3">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">إدارة النظام</p>
                        
                        {/* لوحات التحكم */}
                        <Button variant="outline" size="sm" asChild className="w-full justify-start">
                          <Link href="/admin/dashboard" onClick={() => setMobileMenuOpen(false)}>
                            <LayoutDashboard className="w-4 h-4 ml-2" />
                            لوحة الإحصائيات
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild className="w-full justify-start">
                          <Link href="/admin/analytics" onClick={() => setMobileMenuOpen(false)}>
                            <BarChart3 className="w-4 h-4 ml-2" />
                            التحليلات
                          </Link>
                        </Button>
                        
                        <div className="border-t my-2 pt-2">
                          <p className="text-xs font-semibold text-muted-foreground mb-2">إدارة البيانات</p>
                          <Button variant="outline" size="sm" asChild className="w-full justify-start">
                            <Link href="/admin/properties" onClick={() => setMobileMenuOpen(false)}>
                              <Building2 className="w-4 h-4 ml-2" />
                              العقارات
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild className="w-full justify-start">
                            <Link href="/admin/cases" onClick={() => setMobileMenuOpen(false)}>
                              <Gavel className="w-4 h-4 ml-2" />
                              القضايا
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild className="w-full justify-start">
                            <Link href="/admin/rulings" onClick={() => setMobileMenuOpen(false)}>
                              <FileCheck className="w-4 h-4 ml-2" />
                              الأحكام
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild className="w-full justify-start">
                            <Link href="/admin/deeds" onClick={() => setMobileMenuOpen(false)}>
                              <ScrollText className="w-4 h-4 ml-2" />
                              الحجج
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild className="w-full justify-start">
                            <Link href="/admin/instructions" onClick={() => setMobileMenuOpen(false)}>
                              <FileText className="w-4 h-4 ml-2" />
                              التعليمات
                            </Link>
                          </Button>
                        </div>
                        
                        <div className="border-t my-2 pt-2">
                          <p className="text-xs font-semibold text-muted-foreground mb-2">الأدوات</p>
                          <Button variant="outline" size="sm" asChild className="w-full justify-start">
                            <Link href="/admin/tools" onClick={() => setMobileMenuOpen(false)}>
                              <Sparkles className="w-4 h-4 ml-2" />
                              الأدوات الذكية
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild className="w-full justify-start">
                            <Link href="/admin/library" onClick={() => setMobileMenuOpen(false)}>
                              <Library className="w-4 h-4 ml-2" />
                              المكتبة
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild className="w-full justify-start">
                            <Link href="/admin/knowledge" onClick={() => setMobileMenuOpen(false)}>
                              <BookOpen className="w-4 h-4 ml-2" />
                              المراجع
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild className="w-full justify-start">
                            <Link href="/admin/files" onClick={() => setMobileMenuOpen(false)}>
                              <FolderOpen className="w-4 h-4 ml-2" />
                              الملفات
                            </Link>
                          </Button>
                        </div>
                        
                        <div className="border-t my-2 pt-2">
                          <p className="text-xs font-semibold text-muted-foreground mb-2">النظام</p>
                          <Button variant="outline" size="sm" asChild className="w-full justify-start">
                            <Link href="/admin/users" onClick={() => setMobileMenuOpen(false)}>
                              <Users className="w-4 h-4 ml-2" />
                              المستخدمين
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild className="w-full justify-start">
                            <Link href="/admin/content" onClick={() => setMobileMenuOpen(false)}>
                              <FileText className="w-4 h-4 ml-2" />
                              المحتوى
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild className="w-full justify-start">
                            <Link href="/admin/notifications" onClick={() => setMobileMenuOpen(false)}>
                              <Bell className="w-4 h-4 ml-2" />
                              الإشعارات
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild className="w-full justify-start">
                            <Link href="/admin/activity" onClick={() => setMobileMenuOpen(false)}>
                              <Activity className="w-4 h-4 ml-2" />
                              النشاط
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild className="w-full justify-start">
                            <Link href="/admin/settings" onClick={() => setMobileMenuOpen(false)}>
                              <Settings className="w-4 h-4 ml-2" />
                              الإعدادات
                            </Link>
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {/* Regular User Dashboard - Mobile */}
                    {user?.role !== "admin" && (
                      <Button variant="outline" size="sm" asChild className="w-full mb-2">
                        <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                          <LayoutDashboard className="w-4 h-4 ml-2" />
                          لوحة التحكم
                        </Link>
                      </Button>
                    )}
                  </>
                ) : (
                  <Button size="sm" asChild className="w-full">
                    <a href={getLoginUrl()}>تسجيل الدخول</a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

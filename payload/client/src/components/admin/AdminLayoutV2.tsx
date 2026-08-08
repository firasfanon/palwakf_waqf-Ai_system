/**
 * Admin Layout V2 (STRICT SAFE)
 *
 * Goals:
 * - RTL داخل /admin فقط.
 * - يطبّق هوية PalWakf للأدمن بشكل قطعي (خلفيات داكنة + Sidebar واضح).
 * - يمنع أي Redirect إلى الصفحة العامة بسبب role.
 * - يعرض المسار الحالي LTR داخل الـ Topbar.
 */

import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "wouter";
import { getAppHref } from "@/const";
import { APP_ROUTES } from "@/lib/appRoutes";
import { useAuth } from "@/_core/hooks/useAuth";
import { hasAdminToolsAccess } from "@/lib/access";
import { getAdminWorkspaceKind } from "@/config/governanceSurfaces";

import AdminSidebarV2 from "./AdminSidebarV2";
import { adminNavSections } from "@/config/adminNavV2";
import "@/styles/admin.css";

interface AdminLayoutV2Props {
  children: ReactNode;
}

type PageMeta = {
  section?: string;
  title: string;
  comingSoon?: boolean;
};

function normalizeAdminPath(path: string) {
  if (path === "/admin") return "/admin/dashboard";
  return path;
}

function getPageMeta(path: string): PageMeta {
  const current = normalizeAdminPath(path);

  for (const section of adminNavSections) {
    for (const item of section.items) {
      if (item.href === current) {
        return { section: section.title, title: item.title, comingSoon: item.comingSoon };
      }
      if (item.children?.length) {
        for (const child of item.children) {
          if (child.href === current) {
            return { section: section.title, title: child.title, comingSoon: child.comingSoon };
          }
        }
      }
      if (current.startsWith(item.href + "/")) {
        return { section: section.title, title: item.title };
      }
    }
  }

  if (current.startsWith("/admin/properties/")) return { section: "إدارة البيانات الوقفية", title: "تفاصيل العقار الوقفي" };
  if (current.startsWith("/admin/cases/")) return { section: "إدارة البيانات الوقفية", title: "تفاصيل القضية" };
  if (current.startsWith("/admin/rulings/")) return { section: "إدارة البيانات الوقفية", title: "تفاصيل الحكم القضائي" };

  return { title: "لوحة الإدارة" };
}

function clearInlineThemeOverrides() {
  // DISABLED: Clearing theme variables breaks admin.css which needs --card, --border, etc.
  // Admin scope will override colors via admin.css instead.
  // const root = document.documentElement;
  // for (const k of keys) root.style.removeProperty(k);
}

export default function AdminLayoutV2({ children }: AdminLayoutV2Props) {
  const [location] = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const { user, loading: authLoading } = useAuth({ redirectOnUnauthenticated: false });
  const isAdmin = hasAdminToolsAccess(user);

  // ✅ RTL only inside Admin + enforce admin scope styling.
  useEffect(() => {
    const html = document.documentElement;
    const prevDir = html.getAttribute("dir");

    document.body.classList.add("admin-scope");
    html.setAttribute("data-admin-root", "1");
    html.setAttribute("dir", "rtl");

    // IMPORTANT: if Site Settings previously injected HEX vars, remove them for Admin.
    clearInlineThemeOverrides();

    return () => {
      document.body.classList.remove("admin-scope");
      html.removeAttribute("data-admin-root");
      if (prevDir) html.setAttribute("dir", prevDir);
      else html.removeAttribute("dir");
    };
  }, []);

  const meta = useMemo(() => getPageMeta(location), [location]);
  const workspaceKind = useMemo(() => getAdminWorkspaceKind(normalizeAdminPath(location)), [location]);
  const showBack = useMemo(() => {
    const p = normalizeAdminPath(location);
    return p.startsWith("/admin/properties/") || p.startsWith("/admin/cases/") || p.startsWith("/admin/rulings/");
  }, [location]);

  // UX: when navigating via Sidebar, ensure new page starts at the top.
  useEffect(() => {
    setMobileSidebarOpen(false);
    // Scroll the admin scroll container (not window) because Admin uses internal scrolling.
    const el = contentRef.current;
    if (!el) return;
    el.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location]);

  if (authLoading) {
    return <div className="admin-layout" dir="rtl" data-admin-root="true"><main className="admin-main"><div className="admin-page"><div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">جارٍ التحقق من هوية الوصول الإداري…</div></div></main></div>;
  }

  if (!isAdmin) {
    return <div className="admin-layout" dir="rtl" data-admin-root="true"><main className="admin-main"><div className="admin-page"><div className="rounded-lg border border-destructive/40 p-6 text-center"><h1 className="text-xl font-bold">وصول إداري مرفوض</h1><p className="mt-2 text-sm text-muted-foreground">هذه المسارات مقصورة على أدوار الإدارة المعتمدة. لم تُحمّل أي بيانات إدارية أو تشغيلية.</p></div></div></main></div>;
  }

  const mobileDrawerOverlay = mobileSidebarOpen && typeof document !== "undefined"
    ? createPortal(
        <>
          <button
            type="button"
            className="admin-mobile-sidebar-scrim"
            aria-label="إغلاق قائمة الإدارة"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <AdminSidebarV2 mobileOpen={true} onMobileClose={() => setMobileSidebarOpen(false)} />
        </>,
        document.body,
      )
    : null;

  return (
    <div className="admin-layout" dir="rtl" data-admin-root="true" data-workspace-kind={workspaceKind} data-mobile-rail-guard="true" data-mobile-sidebar-open={mobileSidebarOpen ? "true" : "false"}>
      {/* Desktop sidebar stays in the Admin layout. The mobile drawer is portalled to body to escape shell clipping/containing blocks. */}
      <AdminSidebarV2 mobileOpen={false} onMobileClose={() => setMobileSidebarOpen(false)} />
      {mobileDrawerOverlay}

      <div className="admin-content" ref={contentRef} data-workspace-kind={workspaceKind}>
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              type="button"
              className="admin-mobile-menu-button"
              aria-label="فتح قائمة الإدارة"
              aria-expanded={mobileSidebarOpen}
              onClick={() => setMobileSidebarOpen(true)}
            >
              <span className="admin-mobile-menu-icon" aria-hidden="true">☰</span>
              <span>قائمة الإدارة</span>
            </button>

            <div className="admin-breadcrumbs">
              <span className="admin-crumb">لوحة الإدارة</span>
              {meta.section ? <span className="admin-sep">›</span> : null}
              {meta.section ? <span className="admin-crumb">{meta.section}</span> : null}
              <span className="admin-sep">›</span>
              <span className="admin-crumb current">{meta.title}</span>
              {workspaceKind === "governance" ? <span className="admin-path">حوكمة وتشغيل</span> : null}
            </div>

            <div className="admin-title-row">
              <h1 className="admin-page-title">{meta.title}</h1>
              {meta.comingSoon ? <span className="admin-badge-soon">قريبًا</span> : null}
            </div>
          </div>

          <div className="admin-topbar-actions">
            {showBack ? (
              <button type="button" className="admin-action admin-action-secondary" onClick={() => window.history.back()}>
                رجوع
              </button>
            ) : null}

            <button
              type="button"
              className="admin-action"
              onClick={() => window.open(getAppHref(APP_ROUTES.home), "_blank", "noopener,noreferrer")}
            >
              فتح الموقع
            </button>
          </div>
        </header>

        <main className="admin-main">
          <div className="admin-page">{children}</div>
        </main>
      </div>
    </div>
  );
}

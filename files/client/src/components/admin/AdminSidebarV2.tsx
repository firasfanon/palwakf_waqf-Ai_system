import { Link, useLocation } from "wouter";
import { adminNavSections } from "@/config/adminNavV2";
import { getAdminWorkspaceKind, splitAdminNavSections } from "@/config/governanceSurfaces";
import { ChevronDown, ChevronLeft, ChevronUp, Search, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

function normalizeAdminPath(path: string) {
  if (path === "/admin") return "/admin/dashboard";
  return path;
}

interface AdminSidebarV2Props {
  variant?: "desktop" | "mobile";
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function AdminSidebarV2({ variant = "desktop", mobileOpen = false, onMobileClose }: AdminSidebarV2Props) {
  const [location] = useLocation();
  const current = normalizeAdminPath(location);
  const [query, setQuery] = useState("");
  const searchId = variant === "mobile" ? "admin-sidebar-search-mobile" : "admin-sidebar-search-desktop";
  const split = useMemo(() => splitAdminNavSections(adminNavSections), []);
  const isGovernanceRoute = getAdminWorkspaceKind(current) === "governance";
  const [showGovernance, setShowGovernance] = useState(isGovernanceRoute);

  useEffect(() => {
    if (isGovernanceRoute) setShowGovernance(true);
  }, [isGovernanceRoute]);

  const allSections = useMemo(
    () => (showGovernance ? [...split.operational, ...split.governance] : split.operational),
    [showGovernance, split],
  );

  const autoExpanded = useMemo(() => {
    const expanded: string[] = [];
    for (const section of allSections) {
      for (const item of section.items) {
        if (!item.children?.length) continue;
        const anyActive = item.href === current || current.startsWith(`${item.href}/`) || item.children.some((child) => current === child.href || current.startsWith(`${child.href}/`));
        if (anyActive) expanded.push(item.title);
      }
    }
    return expanded;
  }, [allSections, current]);

  const [expandedSections, setExpandedSections] = useState<string[]>(autoExpanded);
  useEffect(() => {
    if (autoExpanded.length) setExpandedSections((previous) => Array.from(new Set([...previous, ...autoExpanded])));
  }, [autoExpanded]);

  const toggleSection = (title: string) => setExpandedSections((previous) => previous.includes(title) ? previous.filter((item) => item !== title) : [...previous, title]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return allSections;
    return allSections
      .map((section) => ({
        ...section,
        items: section.items
          .map((item) => {
            const selfMatch = item.title.toLowerCase().includes(normalized) || item.href.toLowerCase().includes(normalized);
            const children = item.children?.filter((child) => child.title.toLowerCase().includes(normalized) || child.href.toLowerCase().includes(normalized));
            if (children?.length) return { ...item, children };
            return selfMatch ? item : null;
          })
          .filter(Boolean) as typeof section.items,
      }))
      .filter((section) => section.items.length > 0);
  }, [allSections, query]);

  return (
    <aside
      className={cn("admin-sidebar", variant === "mobile" && "admin-sidebar-mobile", mobileOpen && "mobile-open")}
      data-sidebar-variant={variant}
      data-mobile-open={mobileOpen ? "true" : "false"}
      aria-label={variant === "mobile" ? "قائمة الإدارة على الهاتف" : "القائمة الجانبية"}
    >
      <div className="admin-sidebar-head">
        <button type="button" className="admin-sidebar-mobile-close" onClick={onMobileClose} aria-label="إغلاق قائمة الإدارة">إغلاق ×</button>
        <div className="admin-user-box">
          <div className="admin-user-copy">
            <span className="admin-user-kicker">مساحة العمل</span>
            <strong className="admin-user-name">المساعد الوقفي</strong>
          </div>
          <div className="admin-user-avatar"><Sparkles className="h-5 w-5" /></div>
        </div>
        <div className="admin-sidebar-path">{isGovernanceRoute ? "مركز الحوكمة" : "العمل اليومي"}</div>
        <div className="admin-sidebar-search-wrap">
          <Search className="admin-sidebar-search-icon h-4 w-4" />
          <input id={searchId} name={searchId} className="admin-sidebar-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="بحث في مساحة العمل..." aria-label="بحث في مساحة العمل" />
        </div>
      </div>

      <button type="button" className="admin-governance-toggle" onClick={() => setShowGovernance((value) => !value)} aria-expanded={showGovernance}>
        <span>{showGovernance ? "إخفاء صفحات الحوكمة" : "فتح مركز الحوكمة والأدلة"}</span>
        <ShieldCheck className="h-4 w-4" />
      </button>

      <nav className="admin-nav" data-admin-nav="true">
        {filtered.map((section) => (
          <div className="admin-nav-section" key={section.title}>
            <div className="admin-nav-section-title">{section.title}</div>
            <div className="admin-nav-items">
              {section.items.map((item) => {
                const hasChildren = Boolean(item.children?.length);
                const itemActive = item.href === current || current.startsWith(`${item.href}/`) || (hasChildren && item.children!.some((child) => current === child.href || current.startsWith(`${child.href}/`)));
                const isExpanded = expandedSections.includes(item.title);
                const Icon = item.icon;
                return (
                  <div key={item.title} className="admin-nav-item-wrap">
                    {hasChildren ? (
                      <button type="button" className={cn("admin-nav-item modern", itemActive && "active")} onClick={() => toggleSection(item.title)} aria-expanded={isExpanded}>
                        <span className="admin-nav-leading"><span className="admin-nav-glyph"><Icon className="h-4 w-4" /></span><span className="admin-nav-item-text">{item.title}</span></span>
                        <span className="admin-nav-item-icon">{isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
                      </button>
                    ) : (
                      <Link href={item.href} className={cn("admin-nav-item modern", itemActive && "active")} title={item.title} onClick={onMobileClose}>
                        <span className="admin-nav-leading"><span className="admin-nav-glyph"><Icon className="h-4 w-4" /></span><span className="admin-nav-item-text">{item.title}</span></span>
                        <span className="admin-nav-item-icon"><ChevronLeft size={16} /></span>
                      </Link>
                    )}
                    {hasChildren && isExpanded ? <div className="admin-nav-children">{item.children!.map((child) => {
                      const childActive = child.href === current || current.startsWith(`${child.href}/`);
                      const ChildIcon = child.icon;
                      return <Link key={child.title} href={child.href} className={cn("admin-nav-child modern", childActive && "active")} title={child.title} onClick={onMobileClose}><span className="admin-nav-leading"><span className="admin-nav-glyph"><ChildIcon className="h-4 w-4" /></span><span className="admin-nav-item-text">{child.title}</span></span></Link>;
                    })}</div> : null}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}

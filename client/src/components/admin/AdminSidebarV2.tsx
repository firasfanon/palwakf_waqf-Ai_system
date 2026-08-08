import { Link, useLocation } from "wouter";
import { adminNavSections, type NavSection } from "@/config/adminNavV2";
import { getAdminWorkspaceKind, splitAdminNavSections } from "@/config/governanceSurfaces";
import { ChevronDown, ChevronLeft, ChevronUp, Search, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

function normalizeAdminPath(path: string) {
  if (path === "/admin") return "/admin/dashboard";
  return path;
}

function sectionHasActivePath(section: NavSection, current: string) {
  return section.items.some((item) => {
    if (item.href === current || current.startsWith(`${item.href}/`)) return true;
    return item.children?.some((child) => child.href === current || current.startsWith(`${child.href}/`)) ?? false;
  });
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

  const activeSectionTitle = useMemo(
    () => allSections.find((section) => sectionHasActivePath(section, current))?.title ?? allSections[0]?.title ?? null,
    [allSections, current],
  );

  const [expandedCategoryTitles, setExpandedCategoryTitles] = useState<string[]>(() => activeSectionTitle ? [activeSectionTitle] : []);
  useEffect(() => {
    if (!activeSectionTitle) return;
    setExpandedCategoryTitles((previous) => previous.includes(activeSectionTitle) ? previous : [...previous, activeSectionTitle]);
  }, [activeSectionTitle]);

  const autoExpandedItems = useMemo(() => {
    const expanded: string[] = [];
    for (const section of allSections) {
      for (const item of section.items) {
        if (!item.children?.length) continue;
        const anyActive = item.href === current || current.startsWith(`${item.href}/`) || item.children.some((child) => current === child.href || current.startsWith(`${child.href}/`));
        if (anyActive) expanded.push(`${section.title}::${item.title}`);
      }
    }
    return expanded;
  }, [allSections, current]);

  const [expandedItems, setExpandedItems] = useState<string[]>(autoExpandedItems);
  useEffect(() => {
    if (autoExpandedItems.length) setExpandedItems((previous) => Array.from(new Set([...previous, ...autoExpandedItems])));
  }, [autoExpandedItems]);

  const toggleCategory = (title: string) => {
    setExpandedCategoryTitles((previous) => previous.includes(title) ? previous.filter((item) => item !== title) : [...previous, title]);
  };

  const toggleItem = (key: string) => {
    setExpandedItems((previous) => previous.includes(key) ? previous.filter((item) => item !== key) : [...previous, key]);
  };

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return allSections;

    return allSections
      .map((section) => ({
        ...section,
        items: section.items
          .map((item) => {
            const selfMatch = item.title.toLowerCase().includes(normalized) || item.href.toLowerCase().includes(normalized);
            const matchingChildren = item.children?.filter((child) => child.title.toLowerCase().includes(normalized) || child.href.toLowerCase().includes(normalized)) ?? [];

            if (item.children?.length) {
              if (selfMatch) return item;
              if (matchingChildren.length) return { ...item, children: matchingChildren };
              return null;
            }

            return selfMatch ? item : null;
          })
          .filter(Boolean) as typeof section.items,
      }))
      .filter((section) => section.items.length > 0);
  }, [allSections, query]);

  const hasActiveSearch = query.trim().length > 0;

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

      <nav className="admin-nav" data-admin-nav="true" aria-label="تصنيفات الإدارة">
        {filtered.map((section) => {
          const SectionIcon = section.icon;
          const sectionActive = sectionHasActivePath(section, current);
          const sectionExpanded = hasActiveSearch || expandedCategoryTitles.includes(section.title);
          const categoryContentId = `admin-nav-category-${section.title.replace(/[^a-zA-Z0-9\u0600-\u06FF]+/g, "-")}`;

          return (
            <section
              className={cn("admin-nav-section", sectionExpanded && "is-expanded", sectionActive && "is-active")}
              key={section.title}
              data-expanded={sectionExpanded ? "true" : "false"}
              data-active={sectionActive ? "true" : "false"}
            >
              <button
                type="button"
                className="admin-nav-category-toggle"
                onClick={() => toggleCategory(section.title)}
                aria-expanded={sectionExpanded}
                aria-controls={categoryContentId}
              >
                <span className="admin-nav-category-leading">
                  <span className="admin-nav-category-icon"><SectionIcon className="h-4 w-4" /></span>
                  <span className="admin-nav-category-copy">
                    <strong>{section.title}</strong>
                    <small>{section.items.length} {section.items.length === 1 ? "مسار" : "مسارات"}</small>
                  </span>
                </span>
                <span className="admin-nav-category-state">{sectionExpanded ? <ChevronUp size={17} /> : <ChevronDown size={17} />}</span>
              </button>

              {sectionExpanded ? (
                <div className="admin-nav-items" id={categoryContentId}>
                  {section.items.map((item) => {
                    const hasChildren = Boolean(item.children?.length);
                    const itemActive = item.href === current || current.startsWith(`${item.href}/`) || (hasChildren && item.children!.some((child) => current === child.href || current.startsWith(`${child.href}/`)));
                    const itemKey = `${section.title}::${item.href}`;
                    const itemExpanded = hasChildren && (hasActiveSearch || expandedItems.includes(itemKey));
                    const Icon = item.icon;

                    return (
                      <div key={item.href} className="admin-nav-item-wrap">
                        {hasChildren ? (
                          <button type="button" className={cn("admin-nav-item modern", itemActive && "active")} onClick={() => toggleItem(itemKey)} aria-expanded={itemExpanded}>
                            <span className="admin-nav-leading"><span className="admin-nav-glyph"><Icon className="h-4 w-4" /></span><span className="admin-nav-item-text">{item.title}</span></span>
                            <span className="admin-nav-item-icon">{itemExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
                          </button>
                        ) : (
                          <Link href={item.href} className={cn("admin-nav-item modern", itemActive && "active")} title={item.title} onClick={onMobileClose}>
                            <span className="admin-nav-leading"><span className="admin-nav-glyph"><Icon className="h-4 w-4" /></span><span className="admin-nav-item-text">{item.title}</span></span>
                            <span className="admin-nav-item-icon"><ChevronLeft size={16} /></span>
                          </Link>
                        )}
                        {hasChildren && itemExpanded ? <div className="admin-nav-children">{item.children!.map((child) => {
                          const childActive = child.href === current || current.startsWith(`${child.href}/`);
                          const ChildIcon = child.icon;
                          return <Link key={child.href} href={child.href} className={cn("admin-nav-child modern", childActive && "active")} title={child.title} onClick={onMobileClose}><span className="admin-nav-leading"><span className="admin-nav-glyph"><ChildIcon className="h-4 w-4" /></span><span className="admin-nav-item-text">{child.title}</span></span></Link>;
                        })}</div> : null}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </section>
          );
        })}
      </nav>
    </aside>
  );
}

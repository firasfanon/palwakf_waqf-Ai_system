import { useMemo } from "react";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { getAppHref } from "@/const";
import { Facebook, Twitter, Instagram, Linkedin, Youtube, Mail, MessageSquare, BookOpen, Search, Link2 } from "lucide-react";

export default function Footer() {
  const { settings } = useSiteSettings();

  const iconMap: Record<string, any> = {
    facebook: Facebook,
    twitter: Twitter,
    instagram: Instagram,
    linkedin: Linkedin,
    youtube: Youtube,
    email: Mail,
  };

  const socialLinks = useMemo(() => {
    try {
      return settings?.socialLinks ? JSON.parse(settings.socialLinks) : [];
    } catch {
      return [];
    }
  }, [settings?.socialLinks]);

  const siteName = settings?.siteName?.trim() || "PalWaqf AI";
  const footerText = settings?.footerText || `© ${new Date().getFullYear()} جميع الحقوق محفوظة`;

  const quickLinks = [
    { href: "/chat", label: "المحادثة", icon: MessageSquare },
    { href: "/knowledge-base", label: "المعرفة", icon: BookOpen },
    { href: "/search", label: "البحث", icon: Search },
    { href: "/references", label: "المراجع", icon: Link2 },
  ];

  return (
    <footer className="rebuild-footer border-t border-border/60">
      <div className="container mx-auto px-4 py-4 md:px-6 md:py-5">
        <div className="rebuild-footer-shell mx-auto max-w-6xl rounded-[1.1rem] px-4 py-3 md:px-6 md:py-4">
          <div className="rebuild-footer-row flex flex-col items-center justify-between gap-3 text-center lg:flex-row lg:text-right">
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-foreground md:text-base">{siteName}</h2>
              <p className="text-xs leading-6 text-muted-foreground md:text-sm">{footerText}</p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {quickLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <a key={item.href} href={getAppHref(item.href)} className="rebuild-footer-link">
                    <Icon className="h-4 w-4 text-current" />
                    <span>{item.label}</span>
                  </a>
                );
              })}
            </div>

            {settings?.showSocialLinks && socialLinks.length > 0 ? (
              <div className="flex flex-wrap items-center justify-center gap-2">
                {socialLinks.map((link: { platform: string; url: string }, index: number) => {
                  const Icon = iconMap[link.platform?.toLowerCase?.()] || Mail;
                  return (
                    <a
                      key={`${link.platform}-${index}`}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rebuild-footer-social"
                      aria-label={link.platform}
                    >
                      <Icon className="h-4 w-4 text-current" />
                    </a>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </footer>
  );
}

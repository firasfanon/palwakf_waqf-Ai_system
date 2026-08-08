import { Home } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// خريطة المسارات إلى العناوين العربية
const pathLabels: Record<string, string> = {
  // الصفحات الرئيسية
  "/": "الرئيسية",
  "/chat": "المحادثة",
  "/knowledge-base": "قاعدة المعرفة",
  "/knowledge": "قاعدة المعرفة",
  "/faqs": "الأسئلة الشائعة",
  "/about": "عن المشروع",
  "/contact": "اتصل بنا",
  "/search": "البحث",
  "/dashboard": "لوحة التحكم",
  
  // الصفحات الإدارية
  "/admin": "الإدارة",
  "/admin/dashboard": "لوحة التحكم",
  "/admin/users": "إدارة المستخدمين",
  "/admin/content": "إدارة المحتوى",
  "/admin/analytics": "تحليلات التقييمات",
  "/admin/settings": "إعدادات الموقع",
  "/admin/system-settings": "إعدادات النظام",
  "/admin/cache-analytics": "إحصائيات Cache",
  "/admin/activity": "النشاط",
  "/admin/fetched-content": "مراجعة المحتوى المجلوب",
  "/admin/data-fetching": "جلب البيانات",
  "/admin/fetch-logs": "سجل عمليات الجلب",
  
  // إدارة المعرفة
  "/admin/knowledge": "إدارة المراجع",
  "/admin/knowledge-review-operations": "عمليات المراجعة البشرية",
  "/manage-knowledge": "إدارة المعرفة",
  
  // إدارة القضايا والأحكام
  "/cases": "القضايا",
  "/rulings": "الأحكام",
  "/properties": "العقارات",
  "/deeds": "الوثائق",
  "/files": "الملفات",
  "/instructions": "التعليمات",
  
  // التحليلات
  "/analytics": "التحليلات",
  "/interaction-analytics": "تحليلات التفاعل",
  
  // أدوات الذكاء الصناعي
  "/ai-tools": "أدوات الذكاء الصناعي",
  "/admin/tools": "الأدوات الذكية",
  "/admin/tools/summarize": "التلخيص الذكي",
  "/admin/tools/extract": "استخراج المعلومات",
  "/admin/tools/classify": "التصنيف التلقائي",
  "/admin/tools/compare": "مقارنة الأحكام",
  "/admin/tools/predict": "توقع النتائج",
  "/admin/tools/precedents": "تحليل السوابق",
  "/admin/tools/guide": "دليل الأدوات",
  "/tools/summarize": "التلخيص",
  "/tools/extract": "الاستخراج",
  "/tools/classify": "التصنيف",
  "/tools/compare": "المقارنة",
  "/tools/predict": "التنبؤ",
  "/tools/precedents": "السوابق",
};

interface PageBreadcrumbsProps {
  /** المسار الحالي (اختياري، سيتم استخدام useLocation إذا لم يتم تحديده) */
  currentPath?: string;
  /** عنوان مخصص للصفحة الحالية (اختياري) */
  customLabel?: string;
}

export function PageBreadcrumbs({ currentPath, customLabel }: PageBreadcrumbsProps) {
  const [location] = useLocation();
  const path = currentPath || location;
  
  // تقسيم المسار إلى أجزاء
  const segments = path.split("/").filter(Boolean);
  
  // إذا كنا في الصفحة الرئيسية، لا نعرض Breadcrumbs
  if (segments.length === 0) {
    return null;
  }
  
  // بناء المسارات التراكمية
  const breadcrumbs = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const label = pathLabels[href] || segment;
    return { href, label };
  });
  
  return (
    <Breadcrumb className="mb-6" dir="rtl">
      <BreadcrumbList>
        {/* الصفحة الرئيسية */}
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/">
              <Home className="h-4 w-4" />
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        <BreadcrumbSeparator />
        
        {/* المسارات الوسيطة */}
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          
          return (
            <div key={crumb.href} className="flex items-center gap-1.5">
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{customLabel || crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={crumb.href}>{crumb.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              
              {!isLast && <BreadcrumbSeparator />}
            </div>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

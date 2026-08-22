/**
 * Admin Registry V2 (Single Source of Truth)
 *
 * - مصدر الحقيقة الوحيد لمسارات الأدمن + الـ Sidebar.
 * - يمنع تكرار تعريف الـ routes في App.tsx مقابل قائمة Sidebar.
 * - SAFE PATCH: لا يعيد هيكلة مجلدات، فقط يوحّد التعريفات.
 */

import React, { type ComponentType } from "react";

import {
  LayoutDashboard,
  Activity,
  BarChart3,
  Building2,
  Scale,
  Gavel,
  FileText,
  ClipboardList,
  Tags,
  Layers,
  LayoutTemplate,
  Home,
  Bell,
  MessageSquare,
  Settings,
  Brain,
  Library,
  Folder,
  PieChart,
  Database,
  DownloadCloud,
  CheckCircle,
  Sparkles,
  Tag,
  ScanText,
  FileDown,
  GitCompare,
  BookOpen,
  Target,
  HelpCircle,
  FileBarChart,
  Snowflake,
  Users,
  LineChart,
  UserCog,
  Shield,
  KeyRound,
  FileSearch,
  Search,
  ShieldCheck,
  Key,
  Sliders,
  Trash2,
  Wrench,
  HardDrive,
  Plug,
  Webhook,
  Map,
  Link2,
  Rocket,
  type LucideIcon,
} from "lucide-react";
import { APP_ROUTES } from "@/lib/appRoutes";

import ComingSoon from "@/pages/ComingSoon";
import MustakshifAiPage from "@/pages/admin/MustakshifAiPage";

// Admin pages (existing files)
import AdminDashboard from "@/pages/AdminDashboard";
import AdminActivity from "@/pages/AdminActivity";
import AnalyticsDashboard from "@/pages/AnalyticsDashboard";

import PropertiesManagement from "@/pages/PropertiesManagement";
import CasesManagement from "@/pages/CasesManagement";
import RulingsManagement from "@/pages/RulingsManagement";
import DeedsManagement from "@/pages/DeedsManagement";
import InstructionsManagement from "@/pages/InstructionsManagement";
import WaqfCategoriesManagement from "@/pages/WaqfCategoriesManagement";

import AdminContent from "@/pages/AdminContent";
import ContentTemplates from "@/pages/admin/ContentTemplates";
import HomeSectionsManagement from "@/pages/HomeSectionsManagement";
import NotificationsManagement from "@/pages/admin/NotificationsManagement";
import CommentsManagement from "@/pages/admin/CommentsManagement";
import SiteSettings from "@/pages/SiteSettings";

import ManageKnowledge from "@/pages/ManageKnowledge";
import DigitalLibrary from "@/pages/DigitalLibrary";
import FilesManagement from "@/pages/FilesManagement";
import KnowledgeDashboard from "@/pages/admin/KnowledgeDashboard";
import KnowledgeSourcesManagement from "@/pages/admin/KnowledgeSourcesManagement";
import SourceProvenanceRightsRegistry from "@/pages/admin/SourceProvenanceRightsRegistry";
import DataFetching from "@/pages/admin/DataFetching";
import FetchedContentReview from "@/pages/FetchedContentReview";
import FetchLogsManagement from "@/pages/admin/FetchLogsManagement";
import { KnowledgeSearch } from "@/pages/admin/KnowledgeSearch";
import KnowledgeReviewOperations from "@/pages/admin/KnowledgeReviewOperations";
import KnowledgeActivationCenter from "@/pages/admin/KnowledgeActivationCenter";
import LegacyProvenanceResolutionCenter from "@/pages/admin/LegacyProvenanceResolutionCenter";
import KnowledgeOperationsWorkspace from "@/pages/admin/KnowledgeOperationsWorkspace";
import KB08BPilotCandidate from "@/pages/admin/KB08BPilotCandidate";
import DeferredMegaBatchAAudit from "@/pages/admin/DeferredMegaBatchAAudit";
import ToolOutputIntake from "@/pages/admin/ToolOutputIntake";
import SourceInventoryPreview from "@/pages/admin/SourceInventoryPreview";
import RemoteStagingEvidence from "@/pages/admin/RemoteStagingEvidence";
import OperationsSearch from "@/pages/admin/OperationsSearch";
import Chat from "@/pages/Chat";

import AITools from "@/pages/AITools";
import ClassifyTool from "@/pages/ClassifyTool";
import ExtractTool from "@/pages/ExtractTool";
import SummarizeTool from "@/pages/SummarizeTool";
import CompareTool from "@/pages/CompareTool";
import PrecedentsTool from "@/pages/PrecedentsTool";
import PredictTool from "@/pages/PredictTool";
import ToolsGuide from "@/pages/ToolsGuide";
import AIToolRuns from "@/pages/AIToolRuns";

import Reports from "@/pages/admin/Reports";
import CacheAnalytics from "@/pages/CacheAnalytics";
import InteractionAnalytics from "@/pages/InteractionAnalytics";
import WaqfAnalytics from "@/pages/WaqfAnalytics";

import ManageUsers from "@/pages/ManageUsers";
import Roles from "@/pages/admin/Roles";
import Permissions from "@/pages/admin/Permissions";

import AuditLogs from "@/pages/admin/AuditLogs";
import Security from "@/pages/admin/Security";
import ApiKeys from "@/pages/admin/ApiKeys";

import AdminSystemSettings from "@/pages/AdminSystemSettings";
import AdminUsers from "@/pages/AdminUsers";
import Dashboard from "@/pages/Dashboard";

import Cache from "@/pages/admin/Cache";
import Maintenance from "@/pages/admin/Maintenance";
import Backup from "@/pages/admin/Backup";
import Integrations from "@/pages/admin/Integrations";
import Webhooks from "@/pages/admin/Webhooks";
import Billing from "@/pages/admin/Billing";
import PlatformBridgePage from "@/pages/admin/PlatformBridgePage";
import RolePermissions from "@/pages/admin/RolePermissions";
import PageSettings from "@/pages/admin/PageSettings";
import AdminPagesClassification from "@/pages/admin/AdminPagesClassification";

import PropertyDetails from "@/pages/PropertyDetails";
import CaseDetails from "@/pages/CaseDetails";
import RulingDetails from "@/pages/RulingDetails";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  disabled?: boolean;
  comingSoon?: boolean;
  hidden?: boolean;
  children?: NavItem[];
}

export interface NavSection {
  title: string;
  icon: LucideIcon;
  items: NavItem[];
}

export type AdminRouteEntry = {
  path: string;
  component: ComponentType<any>;
};

export type AdminPageLifecycle = "operational" | "empty_state_ready" | "backend_pending" | "stub_page" | "access_restricted";
export type AdminPageDataState = "connected" | "empty" | "pending_backend" | "static_stub" | "restricted";

export type AdminPageClassificationRecord = {
  sectionTitle: string;
  title: string;
  href: string;
  lifecycle: AdminPageLifecycle;
  dataState: AdminPageDataState;
  note: string;
};

type RegistryNavItem = NavItem & {
  component?: ComponentType<any>;
  hidden?: boolean;
  lifecycle?: AdminPageLifecycle;
  dataState?: AdminPageDataState;
  note?: string;
  children?: RegistryNavItem[];
};

type RegistryNavSection = Omit<NavSection, "items"> & {
  items: RegistryNavItem[];
};

// 9 أقسام: مرتبة من الأكثر استخداماً → الإعدادات الحساسة
export const adminRegistrySections: RegistryNavSection[] = [
  {
    title: "لوحة القيادة",
    icon: LayoutDashboard,
    items: [
      { title: "مركز العمل", href: APP_ROUTES.adminDashboard, icon: LayoutDashboard, component: AdminDashboard, lifecycle: "operational", dataState: "connected", note: "R10: الصفحة الرئيسية التشغيلية؛ تعرض العمل المفتوح وتشغيلات الأدوات والمسارات اليومية بدل الإحصاءات التقنية." },
      { title: "المساعد", href: APP_ROUTES.adminAssistant, icon: MessageSquare, component: Chat, lifecycle: "operational", dataState: "connected", note: "R10: المساعد الحقيقي داخل Admin Workspace بدل فصل Chat عن العمل اليومي." },
      { title: "البحث الموحد", href: APP_ROUTES.adminOperationsSearch, icon: Search, component: OperationsSearch, lifecycle: "operational", dataState: "connected", note: "R10: بحث موحد في المعرفة والمصادر وتشغيلات الأدوات." },
      { title: "سجل النشاط", href: "/admin/activity", icon: Activity, component: AdminActivity, lifecycle: "operational", dataState: "connected", note: "تم ربطه بـ admin.activityLog لقراءة المحادثات والرسائل والأسئلة أو تشغيلات الأدوات ك fallback." },
      { title: "التحليلات والتقييمات", href: "/admin/analytics", icon: BarChart3, component: AnalyticsDashboard, lifecycle: "operational", dataState: "connected", note: "تم تفعيل analytics.* لقراءة التقييمات والأسئلة المتكررة وأفضل الإجابات واقتراحات التحسين." },
{ title: "أدلة Staging وRBAC/RLS", href: "/admin/staging-evidence", icon: ShieldCheck, component: RemoteStagingEvidence, lifecycle: "operational", dataState: "connected", note: "لقطة server-side آمنة لبوابة Mega Batch 29A؛ لا تمنح اعتماد إنتاج ولا تعرض أسرارًا." },
{ title: "سجل تدقيق Mega Batch A المؤجل", href: "/admin/governance/deferred-mega-batch-a-audit", icon: ShieldCheck, component: DeferredMegaBatchAAudit, lifecycle: "operational", dataState: "connected", note: "سجل دليل منفصل للبنود المؤجلة من Mega Batch A؛ لا يغير اعتماد أي دفعة ولا ينفذ إجراءات معرفة." },
    ],
  },
  {
    title: "إدارة البيانات الوقفية",
    icon: Building2,
    items: [
      { title: "إدارة العقارات الوقفية", href: "/admin/properties", icon: Building2, component: PropertiesManagement , lifecycle: "operational", dataState: "connected", note: "تم تفعيل properties.* للقراءة والإنشاء والتحديث والحذف الآمن ضمن Mega Batch 27D مع بقاء الربط السيادي النهائي عبر waqf_asset_id ضمن منصة PalWakf." },
      { title: "مستكشف الأراضي + AI", href: "/admin/mustakshif-ai", icon: Map, component: MustakshifAiPage , lifecycle: "stub_page", dataState: "static_stub", note: "مؤجلة رسميًا لحين ربط مستكشف الأراضي/AI بالمالك السيادي في PalWakf؛ ليست backend_pending داخل المساعد." },
      { title: "إدارة القضايا الوقفية", href: "/admin/cases", icon: Scale, component: CasesManagement , lifecycle: "operational", dataState: "connected", note: "تم تفعيل cases.* للقراءة والإنشاء والتحديث والحذف الآمن ضمن Mega Batch 27D كمسار إداري مساعد." },
      { title: "إدارة الأحكام القضائية", href: "/admin/rulings", icon: Gavel, component: RulingsManagement , lifecycle: "operational", dataState: "connected", note: "تم تفعيل rulings.* للقراءة والإنشاء والتحديث والحذف ضمن Mega Batch 27D." },
      { title: "إدارة الحجج الوقفية", href: "/admin/deeds", icon: FileText, component: DeedsManagement , lifecycle: "operational", dataState: "connected", note: "تم تفعيل deeds.* للقراءة والإنشاء والتحديث والحذف ضمن Mega Batch 27D." },
      { title: "التعليمات الوزارية", href: "/admin/instructions", icon: ClipboardList, component: InstructionsManagement , lifecycle: "operational", dataState: "connected", note: "تم تفعيل instructions.* للتعليمات الوزارية قراءة وكتابة آمنة ضمن Mega Batch 27D." },
      { title: "تصنيفات الأوقاف", href: "/admin/waqf-categories", icon: Tags, component: WaqfCategoriesManagement , lifecycle: "operational", dataState: "connected", note: "تم تفعيل waqfCategories.* مع عدّ العقارات حسب التصنيف ضمن Mega Batch 27D." },
    ],
  },
  {
    title: "المحتوى والإعلام",
    icon: Layers,
    items: [
      { title: "إدارة المحتوى", href: "/admin/content", icon: Layers, component: AdminContent, lifecycle: "operational", dataState: "connected", note: "تم تفعيل admin.content للفهرسة والتحديث والتعطيل الآمن للأسئلة والمراجع." },
      { title: "إدارة القوالب", href: "/admin/content-templates", icon: LayoutTemplate, component: ContentTemplates , lifecycle: "operational", dataState: "connected", note: "تم تفعيل contentTemplates.* للقراءة والإنشاء والتحديث والاستنساخ والحذف ضمن Mega Batch 27D." },
      { title: "أقسام الصفحة الرئيسية", href: "/admin/home-sections", icon: Home, component: HomeSectionsManagement , lifecycle: "operational", dataState: "connected", note: "تم تفعيل homeSections.* للإدارة والنشر/الإخفاء والترتيب ضمن Mega Batch 27D." },
      { title: "الإشعارات", href: "/admin/notifications", icon: Bell, component: NotificationsManagement , lifecycle: "operational", dataState: "connected", note: "تم تفعيل notifications.* لقراءة وإنشاء وحذف الإشعارات ضمن Mega Batch 27D." },
      { title: "إدارة التعليقات", href: "/admin/comments", icon: MessageSquare, component: CommentsManagement , lifecycle: "operational", dataState: "connected", note: "تم تفعيل comments.* للمراجعة والاعتماد والرفض والحذف ضمن Mega Batch 27D." },
      { title: "إعدادات الموقع", href: "/admin/settings", icon: Settings, component: SiteSettings , lifecycle: "operational", dataState: "connected", note: "إعدادات الموقع مربوطة عبر siteSettings.* وتبقى تحت مراقبة runtime evidence." },
    ],
  },
  {
    title: "المعرفة والمكتبة",
    icon: Brain,
    items: [
      { title: "إدارة قاعدة المعرفة", href: "/admin/knowledge", icon: Brain, component: ManageKnowledge , lifecycle: "operational", dataState: "connected", note: "إدارة قاعدة المعرفة مربوطة عبر knowledge.* وملفات PDF ومسار المراجعة." },
{ title: "مساحة العمل المعرفي", href: APP_ROUTES.adminKnowledgeWorkspace, icon: Brain, component: KnowledgeOperationsWorkspace, lifecycle: "operational", dataState: "connected", note: "مساحة يومية موحدة لمسارات المصدر والمرجع والمعرفة والمراجعة دون حوكمة ثقيلة." },
      { title: "المكتبة الرقمية", href: "/admin/library", icon: Library, component: DigitalLibrary , lifecycle: "operational", dataState: "connected", note: "تم تفعيل digitalLibrary.list فوق وثائق المعرفة ضمن Mega Batch 27D." },
      { title: "إدارة الملفات", href: "/admin/files", icon: Folder, component: FilesManagement , lifecycle: "operational", dataState: "connected", note: "تم تفعيل files.* للقراءة والربط وفك الربط والحذف الآمن عبر ملفات الوثائق." },
      { title: "لوحة معلومات المصادر", href: "/admin/knowledge-dashboard", icon: PieChart, component: KnowledgeDashboard , lifecycle: "operational", dataState: "connected", note: "لوحة مصادر المعرفة مربوطة بإحصاءات knowledgeSources.*." },
      { title: "مصادر المعرفة", href: "/admin/knowledge-sources", icon: Database, component: KnowledgeSourcesManagement , lifecycle: "operational", dataState: "connected", note: "مصادر المعرفة مربوطة بقراءة وإنشاء وتحديث وتعطيل وجلب يدوي عبر knowledgeSources.*." },
      { title: "سجل المصادر وحقوق النشر", href: APP_ROUTES.adminSourceProvenanceRights, icon: Scale, component: SourceProvenanceRightsRegistry, lifecycle: "operational", dataState: "connected", note: "سجل منشأ وحقوق محكوم: يعرض الرابط وتاريخه والمواد المرتبطة؛ تعديلات الرابط والحقوق لا تتاح قبل تطبيق Schema/RPC ووجود صلاحية assistant.source.manage أو سلطة Super Admin." },
      { title: "معاينة جرد Manus", href: APP_ROUTES.adminSourceInventoryPreview, icon: FileSearch, component: SourceInventoryPreview, lifecycle: "operational", dataState: "connected", note: "معاينة محلية مؤقتة لملف جرد المصادر والحقوق؛ لا رفع ولا كتابة ولا اعتماد تلقائي." },
      { title: "أدوات الجلب التلقائي", href: "/admin/data-fetching", icon: DownloadCloud, component: DataFetching , lifecycle: "operational", dataState: "connected", note: "تم تفعيل fetcher.* كمسار آمن للجلب اليدوي/المؤجل دون تشغيل شبكي غير معتمد تلقائيًا." },
      { title: "مراجعة المحتوى المجلوب", href: "/admin/fetched-content", icon: CheckCircle, component: FetchedContentReview , lifecycle: "operational", dataState: "connected", note: "مراجعة المحتوى المجلوب مربوطة عبر fetchedContent.* وsmartProcessing/pdfExtraction." },
      { title: "سجل عمليات الجلب", href: "/admin/fetch-logs", icon: FileSearch, component: FetchLogsManagement , lifecycle: "operational", dataState: "connected", note: "تم تفعيل fetchLogs.* للقراءة والإحصاءات ضمن Mega Batch 27D." },
      { title: "بحث المعرفة", href: "/admin/knowledge-search", icon: Brain, component: KnowledgeSearch, lifecycle: "operational", dataState: "connected", note: "تم إصلاح خطأ SelectItem بقيم غير صالحة وأصبحت الصفحة مستقرة." },
      { title: "عمليات المراجعة البشرية", href: APP_ROUTES.adminKnowledgeReviewOperations, icon: ShieldCheck, component: KnowledgeReviewOperations, lifecycle: "operational", dataState: "connected", note: "مركز تشغيلي محكوم لتسوية مهام التصنيف، توثيق المصدر والاستشهاد، معالجة KB08B، وعقود KB09 دون نشر تلقائي." },
      { title: "تفعيل المعرفة والإنتاجية", href: APP_ROUTES.adminKnowledgeActivation, icon: Rocket, component: KnowledgeActivationCenter, lifecycle: "operational", dataState: "connected", note: "تدقيق شامل للمعرفة القائمة، فرز فجوات المصدر والاستشهاد والربط، ثم قرارات اعتماد موثقة." },
      { title: "إعادة بناء منشأ المعرفة", href: "/admin/legacy-provenance", icon: ShieldCheck, component: LegacyProvenanceResolutionCenter, lifecycle: "operational", dataState: "connected", note: "V1.1: lineage موروث حتمي، أدلة nested، واستبعاد آثار الاختبار دون اعتماد مصدر أو فتح Chat." },
{ title: "مرشحو KB08B المحدودون", href: "/admin/kb08b-pilot", icon: ClipboardList, component: KB08BPilotCandidate, lifecycle: "operational", dataState: "connected", note: "عينة عشرة سجلات للقراءة والمراجعة فقط؛ لا Mapping أو Promotion من هذه الصفحة." },
    ],
  },
  {
    title: "التشغيل الذكي",
    icon: Sparkles,
    items: [
      {
        title: "مركز الأدوات الذكية",
        href: APP_ROUTES.adminTools,
        icon: Sparkles,
        component: AITools,
        lifecycle: "operational",
        dataState: "connected",
        note: "بوابة موحدة للأدوات الذكية مع مؤشرات تشغيل واعتماد وسيادة تخزين.",
        children: [
          { title: "التصنيف التلقائي", href: APP_ROUTES.adminToolsClassify, icon: Tag, component: ClassifyTool, lifecycle: "operational", dataState: "connected", note: "الأداة مربوطة بتشغيلات assistant.ai_tool_runs ويمكن حفظ الناتج كمسودة معرفة." },
          { title: "استخراج المعلومات", href: APP_ROUTES.adminToolsExtract, icon: ScanText, component: ExtractTool, lifecycle: "operational", dataState: "connected", note: "أول أداة أُغلقت end-to-end مع حفظ التشغيل والربط بالمعرفة." },
          { title: "التلخيص الذكي", href: APP_ROUTES.adminToolsSummarize, icon: FileDown, component: SummarizeTool, lifecycle: "operational", dataState: "connected", note: "الأداة تعمل وتحفظ التشغيل ويمكن تحويل الناتج إلى مسودة معرفة." },
          { title: "مقارنة الأحكام", href: APP_ROUTES.adminToolsCompare, icon: GitCompare, component: CompareTool, lifecycle: "operational", dataState: "connected", note: "تشغيل سيادي محفوظ مع قابلية مبدئية لتحويل النتيجة إلى معرفة." },
          { title: "تحليل السوابق", href: APP_ROUTES.adminToolsPrecedents, icon: BookOpen, component: PrecedentsTool, lifecycle: "operational", dataState: "connected", note: "تشغيل سيادي محفوظ مع مخرجات تحليل اتجاهات وتوصيات." },
          { title: "توقع النتائج", href: APP_ROUTES.adminToolsPredict, icon: Target, component: PredictTool, lifecycle: "operational", dataState: "connected", note: "تشغيل سيادي محفوظ مع تقدير احتمالي وعوامل مؤثرة." },
          { title: "سجل التشغيل والاعتماد", href: APP_ROUTES.adminToolsRuns, icon: ShieldCheck, component: AIToolRuns, lifecycle: "operational", dataState: "connected", note: "مركز متابعة التشغيلات الذكية وحالات الاعتماد والروابط المرتبطة." },
{ title: "صندوق مخرجات الأدوات", href: APP_ROUTES.adminToolsOutputIntake, icon: CheckCircle, component: ToolOutputIntake, lifecycle: "operational", dataState: "connected", note: "فرز يومي لمخرجات الأدوات القابلة للمراجعة دون تحويل تلقائي إلى معرفة." },
          { title: "دليل الاستخدام", href: APP_ROUTES.adminToolsGuide, icon: HelpCircle, component: ToolsGuide, lifecycle: "operational", dataState: "connected", note: "يوثق استخدام الأدوات الذكية ويعمل كطبقة إرشادية." },
        ],
      },
    ],
  },
  {
    title: "التقارير والتحليلات",
    icon: FileBarChart,
    items: [
      { title: "التقارير", href: "/admin/reports", icon: FileBarChart, component: Reports , lifecycle: "operational", dataState: "connected", note: "تم تفعيل reports.summary كمدخل تقارير موحد ضمن Mega Batch 27D." },
      { title: "إحصائيات Cache", href: "/admin/cache-analytics", icon: Snowflake, component: CacheAnalytics , lifecycle: "operational", dataState: "connected", note: "تم إغلاق فجوات cache.getMostFrequent/cleanExpired/updateSuggestedQuestions ضمن Mega Batch 27D." },
      { title: "إحصائيات التفاعل", href: "/admin/interaction-analytics", icon: Users, component: InteractionAnalytics , lifecycle: "operational", dataState: "connected", note: "تم إضافة alias interaction فوق interactionStats لإغلاق صفحة التحليلات التفاعلية." },
      { title: "إحصائيات الأوقاف", href: "/admin/waqf-analytics", icon: LineChart, component: WaqfAnalytics , lifecycle: "operational", dataState: "connected", note: "تم تفعيل waqfAnalytics.getStatistics فوق إحصاءات الوقف القديمة كمرحلة انتقالية." },
      { title: "تصنيف صفحات الإدارة", href: APP_ROUTES.adminPagesClassification, icon: FileBarChart, component: AdminPagesClassification, lifecycle: "operational", dataState: "connected", note: "لوحة فرز إداري لتمييز الصفحات العاملة والصفحات التي ما تزال stub أو بانتظار backend." },
    ],
  },
  {
    title: "المستخدمون والصلاحيات",
    icon: UserCog,
    items: [
      { title: "إدارة المستخدمين", href: "/admin/users", icon: UserCog, component: ManageUsers, lifecycle: "operational", dataState: "connected", note: "تم تفعيل admin.users للقراءة والتصفية وتغيير الدور والتعطيل الآمن بدل الحذف الهدّام." },
      { title: "الأدوار", href: "/admin/roles", icon: Shield, component: Roles , lifecycle: "operational", dataState: "connected", note: "تم تفعيل roles.* مع ربط الصلاحيات ضمن Mega Batch 27D." },
      { title: "الصلاحيات", href: "/admin/permissions", icon: KeyRound, component: Permissions , lifecycle: "operational", dataState: "connected", note: "تم تفعيل permissions.* قراءة وكتابة ضمن Mega Batch 27D." },
    ],
  },
  {
    title: "الأمان والتدقيق",
    icon: ShieldCheck,
    items: [
      { title: "سجل التدقيق", href: "/admin/audit-logs", icon: FileSearch, component: AuditLogs , lifecycle: "operational", dataState: "connected", note: "تم تحويلها من placeholder إلى auditSnapshot يقرأ آخر الأنشطة من backend ضمن Mega Batch 27D." },
      { title: "الأمان", href: "/admin/security", icon: ShieldCheck, component: Security , lifecycle: "operational", dataState: "connected", note: "تم تحويلها من placeholder إلى securitySnapshot لقراءة حالة الحراس والأدوار والصلاحيات دون كشف أسرار." },
      { title: "مفاتيح API", href: "/admin/api-keys", icon: Key, component: ApiKeys , lifecycle: "operational", dataState: "connected", note: "تم تحويلها من placeholder إلى apiKeysSnapshot يعرض metadata فقط دون أي قيم سرية." },
    ],
  },
  {
    title: "الصيانة والتشغيل",
    icon: Wrench,
    items: [
      { title: "إعدادات النظام", href: "/admin/system-settings", icon: Sliders, component: AdminSystemSettings , lifecycle: "operational", dataState: "connected", note: "إعدادات النظام مربوطة عبر systemSettings.* وعمليات الصيانة الآمنة." },
      { title: "إدارة Cache", href: "/admin/cache", icon: Trash2, component: Cache, lifecycle: "operational", dataState: "connected", note: "تم تحويلها من placeholder إلى قراءة backend عبر admin.operations.cacheSnapshot." },
      { title: "وضع الصيانة", href: "/admin/maintenance", icon: Wrench, component: Maintenance , lifecycle: "operational", dataState: "connected", note: "تم تحويلها إلى maintenanceSnapshot يقرأ حالة الخادم وقاعدة البيانات وCache مع تعطيل الإجراءات الحساسة." },
      { title: "النسخ الاحتياطي", href: "/admin/backup", icon: HardDrive, component: Backup, lifecycle: "operational", dataState: "connected", note: "تم تفعيلها كـ manifest حوكمي آمن دون dump أو restore هدّام من الواجهة." },
      { title: "التكاملات", href: "/admin/integrations", icon: Plug, component: Integrations, lifecycle: "operational", dataState: "connected", note: "تم تحويلها إلى قراءة حالة فعلية من admin.operations.integrationsSnapshot." },
      { title: "جسر المنصة", href: "/admin/platform-bridge", icon: Link2, component: PlatformBridgePage , lifecycle: "operational", dataState: "connected", note: "جسر المنصة مربوطة عبر platformBridge.* للقراءة السيادية فقط." },
      { title: "Webhooks", href: "/admin/webhooks", icon: Webhook, component: Webhooks, lifecycle: "operational", dataState: "connected", note: "تم ربطها بخريطة أحداث داخلية عبر admin.operations.webhooksSnapshot دون إرسال خارجي تلقائي." },
    ],
  },
];

function stripForNav(item: RegistryNavItem): NavItem {
  const { component, hidden, children, ...rest } = item;
  const navRest = rest as NavItem;

  // ✅ Safety: if a leaf route has no component, treat it as Coming Soon.
  // For parent items with children, we keep it expandable even if its own page isn't ready.
  if (!component && !children?.length) {
    navRest.comingSoon = true;
    navRest.disabled = true;
  }

  if (children?.length) {
    navRest.children = children.filter((c) => !c.hidden).map(stripForNav);
  }
  return navRest;
}


export const adminPageClassificationRecords: AdminPageClassificationRecord[] = adminRegistrySections.flatMap((section) =>
  section.items.flatMap((item) => {
    const baseRecord: AdminPageClassificationRecord = {
      sectionTitle: section.title,
      title: item.title,
      href: item.href,
      lifecycle: item.lifecycle ?? "backend_pending",
      dataState: item.dataState ?? "pending_backend",
      note: item.note ?? "تحتاج مراجعة إضافية لتحديد وضعها التشغيلي بدقة.",
    };

    const childRecords = ((item.children ?? []) as RegistryNavItem[]).map((child) => ({
      sectionTitle: section.title,
      title: child.title,
      href: child.href,
      lifecycle: child.lifecycle ?? "backend_pending",
      dataState: child.dataState ?? "pending_backend",
      note: child.note ?? "تحتاج مراجعة إضافية لتحديد وضعها التشغيلي بدقة.",
    }));

    return [baseRecord, ...childRecords];
  })
);

export const adminNavSections: NavSection[] = adminRegistrySections.map((section) => ({
  title: section.title,
  icon: section.icon,
  items: section.items.filter((i) => !i.hidden).map(stripForNav),
}));

function resolveRouteComponent(item: RegistryNavItem): ComponentType<any> | null {
  if (item.component) return item.component;
  if (item.comingSoon) return () => React.createElement(ComingSoon, { title: item.title });

  // ✅ Default: if it's a leaf (no children) and has no component,
  // still register a route that renders ComingSoon instead of falling into the router catch-all.
  if (!item.children?.length) {
    return () => React.createElement(ComingSoon, { title: item.title });
  }

  // Parent items with children may act as groups; do not force a route unless explicitly provided.
  return null;
}

function flattenRoutes(items: RegistryNavItem[], out: AdminRouteEntry[]) {
  for (const item of items) {
    const comp = resolveRouteComponent(item);
    if (comp) out.push({ path: item.href, component: comp });
    if (item.children?.length) {
      flattenRoutes(item.children, out);
    }
  }
}

const extraRoutes: AdminRouteEntry[] = [
  // aliases / legacy
  { path: "/admin", component: AdminDashboard },
  { path: "/admin/users-old", component: AdminUsers },
  { path: "/admin/old-dashboard", component: Dashboard },

  // admin internal pages (not in sidebar)
  { path: "/admin/role-permissions", component: RolePermissions },
  { path: "/admin/page-settings", component: PageSettings },
  { path: "/admin/billing", component: Billing },

  // details
  { path: "/admin/properties/:id", component: PropertyDetails },
  { path: "/admin/cases/:id", component: CaseDetails },
  { path: "/admin/rulings/:id", component: RulingDetails },
];

export const adminRouteEntries: AdminRouteEntry[] = (() => {
  const out: AdminRouteEntry[] = [];
  // keep /admin alias first
  out.push(extraRoutes[0]);
  // registry routes
  for (const section of adminRegistrySections) {
    flattenRoutes(section.items, out);
  }
  // remaining extras
  out.push(...extraRoutes.slice(1));
  return out;
})();

// Helper function to get all routes (for router configuration)
export function getAllAdminRoutes(): string[] {
  const routes: string[] = [];

  adminNavSections.forEach((section) => {
    section.items.forEach((item) => {
      routes.push(item.href);
      if (item.children) {
        item.children.forEach((child) => {
          routes.push(child.href);
        });
      }
    });
  });

  return routes;
}

// Helper function to check if a route is coming soon
export function isComingSoon(href: string): boolean {
  for (const section of adminRegistrySections) {
    for (const item of section.items) {
      if (item.href === href) return item.comingSoon || false;
      if (item.children?.length) {
        for (const child of item.children) {
          if (child.href === href) return child.comingSoon || false;
        }
      }
    }
  }
  return false;
}

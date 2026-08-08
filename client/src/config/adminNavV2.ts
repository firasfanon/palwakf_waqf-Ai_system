/**
 * Admin Dashboard V2 - Navigation Configuration
 *
 * SAFE PATCH:
 * - جعل مصدر الحقيقة واحد (Registry) حتى لا تختفي صفحات جاهزة مرة أخرى.
 * - هذا الملف يبقى بنفس الاسم/المسار للحفاظ على التوافق مع بقية النظام.
 */

export {
  adminNavSections,
  getAllAdminRoutes,
  isComingSoon,
} from "./adminRegistryV2";

export type { NavItem, NavSection } from "./adminRegistryV2";

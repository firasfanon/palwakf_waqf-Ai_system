export const APP_ROUTES = {
  home: "/",
  references: "/references",
  chat: "/chat",
  bookmarks: "/bookmarks",
  favorites: "/favorites",
  export: "/export",
  stats: "/stats",
  faqs: "/faqs",
  about: "/about",
  contact: "/contact",
  search: "/search",
  knowledge: "/knowledge-base",
  knowledgeLegacy: "/knowledge",
  advancedSearch: "/advanced-search",
  adminDashboard: "/admin/dashboard",
  adminTools: "/admin/tools",
  adminToolsClassify: "/admin/tools/classify",
  adminToolsExtract: "/admin/tools/extract",
  adminToolsSummarize: "/admin/tools/summarize",
  adminToolsCompare: "/admin/tools/compare",
  adminToolsPrecedents: "/admin/tools/precedents",
  adminToolsPredict: "/admin/tools/predict",
  adminToolsRuns: "/admin/tools/runs",
  adminToolsGuide: "/admin/tools/guide",
  adminToolsOutputIntake: "/admin/tools/output-intake",
  adminKnowledgeWorkspace: "/admin/knowledge-workspace",
  adminKnowledgeReviewOperations: "/admin/knowledge-review-operations",
  adminKnowledgeActivation: "/admin/knowledge-activation",
  adminSourceProvenanceRights: "/admin/source-provenance-rights",
  adminSourceInventoryPreview: "/admin/source-inventory-preview",
  adminPagesClassification: "/admin/page-classification",
} as const;

export type AdminToolRouteKey =
  | "classify"
  | "extract"
  | "summarize"
  | "compare"
  | "precedents"
  | "predict"
  | "runs"
  | "guide";

export function getAdminToolRoute(key: AdminToolRouteKey) {
  switch (key) {
    case "classify":
      return APP_ROUTES.adminToolsClassify;
    case "extract":
      return APP_ROUTES.adminToolsExtract;
    case "summarize":
      return APP_ROUTES.adminToolsSummarize;
    case "compare":
      return APP_ROUTES.adminToolsCompare;
    case "precedents":
      return APP_ROUTES.adminToolsPrecedents;
    case "predict":
      return APP_ROUTES.adminToolsPredict;
    case "runs":
      return APP_ROUTES.adminToolsRuns;
    case "guide":
      return APP_ROUTES.adminToolsGuide;
    default:
      return APP_ROUTES.adminTools;
  }
}

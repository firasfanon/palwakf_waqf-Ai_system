import { platformBridgeConfig } from "./config";

export type IntegrationClassification =
  | "direct_link"
  | "transform"
  | "centralize"
  | "local_only"
  | "defer";

export type SourceOfTruthDecision =
  | "platform"
  | "assistant_local"
  | "shared_governance"
  | "derived_only"
  | "pending";

export type PlatformCounterpart = {
  key?: keyof typeof platformBridgeConfig.objects;
  schema?: string;
  table?: string;
};

export type SourceOfTruthMatrixEntry = {
  entity: string;
  localTable: string | null;
  purpose: string;
  maturity: "working" | "partial" | "deferred" | "operational";
  classification: IntegrationClassification;
  sourceOfTruth: SourceOfTruthDecision;
  platformCounterpart: PlatformCounterpart | null;
  keyFields: string[];
  sharedFields: string[];
  recommendedAction: string;
  notes: string;
};

const platformObject = (key: keyof typeof platformBridgeConfig.objects): PlatformCounterpart => ({
  key,
  schema: platformBridgeConfig.objects[key]!.schema,
  table: platformBridgeConfig.objects[key]!.table,
});

export const sourceOfTruthMatrix: SourceOfTruthMatrixEntry[] = [
  {
    entity: "users_local_projection",
    localTable: "users",
    purpose: "Legacy local projection used historically by assistant workflows before platform identity adoption.",
    maturity: "partial",
    classification: "transform",
    sourceOfTruth: "platform",
    platformCounterpart: platformObject("adminUsers"),
    keyFields: ["id", "openId", "email", "role", "isActive"],
    sharedFields: ["email", "role", "isActive"],
    recommendedAction: "Stop using local users as identity source. Keep only as temporary projection if legacy foreign keys still need it during transition.",
    notes: "Platform admin_users becomes the identity authority; local users must not remain the source of truth.",
  },
  {
    entity: "admin_users",
    localTable: null,
    purpose: "Identity, RBAC scope, and administrative ownership for assistant-facing workflows.",
    maturity: "working",
    classification: "direct_link",
    sourceOfTruth: "platform",
    platformCounterpart: platformObject("adminUsers"),
    keyFields: ["id", "auth_user_id", "email", "role", "unit_id", "is_active"],
    sharedFields: ["id", "email", "role", "unit_id", "is_active"],
    recommendedAction: "Read directly from platform and never redefine locally.",
    notes: "Assistant must consume identity and role scope from platform only.",
  },
  {
    entity: "org_units",
    localTable: null,
    purpose: "Organizational scope for knowledge ownership, review responsibility, and assistant context.",
    maturity: "working",
    classification: "direct_link",
    sourceOfTruth: "platform",
    platformCounterpart: platformObject("orgUnits"),
    keyFields: ["id", "slug", "name_ar", "name_en", "unit_type", "parent_id"],
    sharedFields: ["id", "slug", "name_ar", "name_en", "unit_type"],
    recommendedAction: "Read directly from platform core schema.",
    notes: "No local duplication for sovereign organization data.",
  },
  {
    entity: "waqf_assets",
    localTable: null,
    purpose: "Central operational waqf entity that all downstream intelligence should reference, never redefine.",
    maturity: "working",
    classification: "centralize",
    sourceOfTruth: "platform",
    platformCounterpart: platformObject("waqfAssets"),
    keyFields: ["id", "national_asset_code", "name_ar", "endowment_id", "status", "asset_type"],
    sharedFields: ["id", "national_asset_code", "name_ar", "status", "asset_type"],
    recommendedAction: "Consume as source of truth from platform and link by waqf_asset_id.",
    notes: "Assistant may enrich but must not own or duplicate waqf asset identity.",
  },
  {
    entity: "endowment_names",
    localTable: null,
    purpose: "Reference waqf/endowment parent context for documents, retrieval, and contextual prompting.",
    maturity: "working",
    classification: "direct_link",
    sourceOfTruth: "platform",
    platformCounterpart: platformObject("endowments"),
    keyFields: ["id", "name_ar", "name_en", "status", "type"],
    sharedFields: ["id", "name_ar", "status", "type"],
    recommendedAction: "Read from platform waqf schema and link by endowment_id only.",
    notes: "Assistant uses it as context, not as a local master table.",
  },
  {
    entity: "knowledge_documents",
    localTable: "knowledge_documents",
    purpose: "Approved knowledge corpus used for retrieval, chat context, and institutional reference.",
    maturity: "working",
    classification: "centralize",
    sourceOfTruth: "shared_governance",
    platformCounterpart: null,
    keyFields: ["id", "title", "content", "category", "status", "source_id", "approved_at"],
    sharedFields: ["id", "title", "category", "status", "source_id", "approved_at"],
    recommendedAction: "Move toward a shared governed knowledge layer in the unified database.",
    notes: "Must be clearly separated from staging/review content.",
  },
  {
    entity: "knowledge_sources",
    localTable: "knowledge_sources",
    purpose: "Registry of approved or configured content sources feeding ingestion and review workflows.",
    maturity: "working",
    classification: "centralize",
    sourceOfTruth: "shared_governance",
    platformCounterpart: null,
    keyFields: ["id", "name", "type", "url", "is_active"],
    sharedFields: ["id", "name", "type", "url", "is_active"],
    recommendedAction: "Centralize in platform knowledge layer to avoid duplicate source registries.",
    notes: "Assistant can manage ingestion settings but not create parallel master registries.",
  },
  {
    entity: "fetched_content",
    localTable: "fetched_content",
    purpose: "Staging/review content before promotion into approved knowledge.",
    maturity: "working",
    classification: "transform",
    sourceOfTruth: "assistant_local",
    platformCounterpart: null,
    keyFields: ["id", "source_id", "title", "content", "status", "ai_category", "intake_route"],
    sharedFields: ["id", "source_id", "status", "intake_route"],
    recommendedAction: "Keep operationally local but governed; promote only approved records into shared knowledge.",
    notes: "This is review/staging state and must not be confused with approved knowledge.",
  },
  {
    entity: "fetch_logs",
    localTable: "fetch_logs",
    purpose: "Operational ingestion logs and diagnostics.",
    maturity: "operational",
    classification: "local_only",
    sourceOfTruth: "assistant_local",
    platformCounterpart: null,
    keyFields: ["id", "source_id", "status", "items_found", "items_created", "created_at"],
    sharedFields: ["source_id", "status", "created_at"],
    recommendedAction: "Keep local and expose only derived analytics when needed.",
    notes: "Operational telemetry, not institutional master data.",
  },
  {
    entity: "classification_ratings",
    localTable: "classification_ratings",
    purpose: "Quality loop for AI classification accuracy.",
    maturity: "partial",
    classification: "local_only",
    sourceOfTruth: "assistant_local",
    platformCounterpart: null,
    keyFields: ["id", "fetched_content_id", "reviewer_id", "rating", "notes"],
    sharedFields: ["fetched_content_id", "reviewer_id", "rating"],
    recommendedAction: "Keep local to assistant operations until enterprise feedback model is needed.",
    notes: "Feeds model and pipeline quality, not platform-wide source of truth.",
  },
  {
    entity: "land_references",
    localTable: "land_references",
    purpose: "Reference reports, legal documents, and land/waqf reference materials.",
    maturity: "working",
    classification: "transform",
    sourceOfTruth: "shared_governance",
    platformCounterpart: platformObject("references"),
    keyFields: ["id", "title", "region", "type", "year", "author"],
    sharedFields: ["id", "title", "region", "type", "year"],
    recommendedAction: "Map and reconcile with platform reference layer before centralizing.",
    notes: "Needs careful dedupe and semantic alignment if platform already stores references.",
  },
  {
    entity: "site_settings",
    localTable: "site_settings",
    purpose: "Site-level visual and content settings.",
    maturity: "working",
    classification: "transform",
    sourceOfTruth: "shared_governance",
    platformCounterpart: null,
    keyFields: ["key", "value", "scope", "updated_at"],
    sharedFields: ["key", "scope", "updated_at"],
    recommendedAction: "Split into shared platform settings vs assistant-local tuning keys.",
    notes: "Do not centralize assistant tuning blindly with platform-wide UI settings.",
  },
  {
    entity: "content_templates",
    localTable: "content_templates",
    purpose: "Reusable content and workflow templates.",
    maturity: "working",
    classification: "transform",
    sourceOfTruth: "shared_governance",
    platformCounterpart: null,
    keyFields: ["id", "name", "type", "category", "usage_count"],
    sharedFields: ["id", "name", "type", "category"],
    recommendedAction: "Centralize only shared institutional templates; keep assistant-internal templates local.",
    notes: "Needs scope separation to avoid template sprawl.",
  },
  {
    entity: "conversations",
    localTable: "conversations",
    purpose: "Assistant chat sessions.",
    maturity: "working",
    classification: "local_only",
    sourceOfTruth: "assistant_local",
    platformCounterpart: null,
    keyFields: ["id", "user_id", "title", "created_at", "updated_at"],
    sharedFields: ["user_id", "created_at"],
    recommendedAction: "Keep local unless platform later standardizes conversational memory as shared capability.",
    notes: "Operational interaction history, not central platform master data yet.",
  },
  {
    entity: "messages",
    localTable: "messages",
    purpose: "Message-level conversational content for assistant sessions.",
    maturity: "working",
    classification: "local_only",
    sourceOfTruth: "assistant_local",
    platformCounterpart: null,
    keyFields: ["id", "conversation_id", "role", "content", "created_at"],
    sharedFields: ["conversation_id", "role", "created_at"],
    recommendedAction: "Keep local to assistant subsystem.",
    notes: "Should not be mixed with approved knowledge or audit data.",
  },
  {
    entity: "ratings",
    localTable: "ratings",
    purpose: "Generic entity ratings and feedback loop.",
    maturity: "partial",
    classification: "transform",
    sourceOfTruth: "pending",
    platformCounterpart: null,
    keyFields: ["id", "entity_type", "entity_id", "user_id", "rating"],
    sharedFields: ["entity_type", "entity_id", "user_id", "rating"],
    recommendedAction: "Keep assistant-local now; centralize only if platform defines a shared feedback model.",
    notes: "Separate from message-level ratings.",
  },
  {
    entity: "message_ratings",
    localTable: null,
    purpose: "Message-level assistant feedback.",
    maturity: "deferred",
    classification: "defer",
    sourceOfTruth: "pending",
    platformCounterpart: null,
    keyFields: ["message_id", "user_id", "rating"],
    sharedFields: ["message_id", "user_id", "rating"],
    recommendedAction: "Defer until message-level governance is required.",
    notes: "Not required for first integration cutover.",
  },
  {
    entity: "fetched_content_review_events",
    localTable: "fetched_content_review_events",
    purpose: "Review and approval trace for staging content.",
    maturity: "working",
    classification: "transform",
    sourceOfTruth: "shared_governance",
    platformCounterpart: null,
    keyFields: ["id", "fetched_content_id", "event_type", "event_source", "route", "created_at"],
    sharedFields: ["fetched_content_id", "event_type", "route", "created_at"],
    recommendedAction: "Promote concept into platform review governance tables during integration phase 2.",
    notes: "Critical for audit and lifecycle traceability.",
  },
];

export function getSourceOfTruthReadinessSummary() {
  const counts = sourceOfTruthMatrix.reduce(
    (acc, entry) => {
      acc.classification[entry.classification] = (acc.classification[entry.classification] ?? 0) + 1;
      acc.sourceOfTruth[entry.sourceOfTruth] = (acc.sourceOfTruth[entry.sourceOfTruth] ?? 0) + 1;
      return acc;
    },
    {
      total: sourceOfTruthMatrix.length,
      classification: {} as Record<IntegrationClassification, number>,
      sourceOfTruth: {} as Record<SourceOfTruthDecision, number>,
    }
  );

  return counts;
}

export type MegaERole =
  | "PROGRAM_OWNER"
  | "SYSTEM_ACCESS_ADMIN"
  | "DEVELOPER_ENGINEER"
  | "SOURCE_RESEARCHER"
  | "INGESTION_OPERATOR"
  | "DATA_GOVERNANCE_STEWARD"
  | "LEGAL_STATUS_REVIEWER"
  | "WAQF_DEED_REVIEWER"
  | "FIQH_SHARIA_REVIEWER"
  | "HISTORICAL_EVIDENCE_REVIEWER"
  | "RIGHTS_REVIEWER"
  | "SECURITY_PRIVACY_REVIEWER"
  | "PROGRAM_ACCEPTANCE_REVIEWER"
  | "AUDITOR_READ_ONLY"
  | "RESEARCH_USER"
  | "PUBLIC_USER_FUTURE"
  | "RELEASE_OPERATOR";

export type MegaEAction =
  | "READ_PRIVATE_REFERENCE"
  | "PRESERVE_PRIVATE_REFERENCE"
  | "PROPOSE_SOURCE_ADMISSION"
  | "RUN_PRIVATE_PILOT"
  | "VIEW_SENSITIVE_DEED"
  | "ADMINISTER_IDENTITY_BINDINGS"
  | "SPECIALIST_DECISION_APPROVE"
  | "AUDIT_READ"
  | "RELEASE_EXECUTE"
  | "LIVE_SHARED_DB_MUTATION"
  | "MAIN_MERGE"
  | "BASELINE_PROMOTION"
  | "PRODUCTION_PUBLIC_RELEASE";

export type MegaEAccessDisposition =
  | "ALLOW"
  | "DENY"
  | "SEPARATE_AUTH_REQUIRED";

export type MegaEAccessDecision = {
  disposition: MegaEAccessDisposition;
  reasons: string[];
};

const separateAuthorityActions = new Set<MegaEAction>([
  "LIVE_SHARED_DB_MUTATION",
  "MAIN_MERGE",
  "BASELINE_PROMOTION",
  "PRODUCTION_PUBLIC_RELEASE",
  "RELEASE_EXECUTE",
]);

const privateReaders = new Set<MegaERole>([
  "PROGRAM_OWNER",
  "SYSTEM_ACCESS_ADMIN",
  "DEVELOPER_ENGINEER",
  "SOURCE_RESEARCHER",
  "INGESTION_OPERATOR",
  "DATA_GOVERNANCE_STEWARD",
  "LEGAL_STATUS_REVIEWER",
  "WAQF_DEED_REVIEWER",
  "FIQH_SHARIA_REVIEWER",
  "HISTORICAL_EVIDENCE_REVIEWER",
  "RIGHTS_REVIEWER",
  "SECURITY_PRIVACY_REVIEWER",
  "PROGRAM_ACCEPTANCE_REVIEWER",
  "AUDITOR_READ_ONLY",
  "RESEARCH_USER",
]);

const preservationRoles = new Set<MegaERole>([
  "DEVELOPER_ENGINEER",
  "INGESTION_OPERATOR",
  "DATA_GOVERNANCE_STEWARD",
]);

const proposalRoles = new Set<MegaERole>([
  "DEVELOPER_ENGINEER",
  "SOURCE_RESEARCHER",
  "INGESTION_OPERATOR",
  "DATA_GOVERNANCE_STEWARD",
]);

const pilotRoles = new Set<MegaERole>([
  "DEVELOPER_ENGINEER",
  "PROGRAM_ACCEPTANCE_REVIEWER",
  "SECURITY_PRIVACY_REVIEWER",
]);

const sensitiveReaders = new Set<MegaERole>([
  "WAQF_DEED_REVIEWER",
  "SECURITY_PRIVACY_REVIEWER",
]);

const identityAdmins = new Set<MegaERole>(["SYSTEM_ACCESS_ADMIN"]);

const specialistRoles = new Set<MegaERole>([
  "LEGAL_STATUS_REVIEWER",
  "WAQF_DEED_REVIEWER",
  "FIQH_SHARIA_REVIEWER",
  "HISTORICAL_EVIDENCE_REVIEWER",
  "RIGHTS_REVIEWER",
  "SECURITY_PRIVACY_REVIEWER",
  "PROGRAM_ACCEPTANCE_REVIEWER",
]);

export function evaluateMegaEAccess(input: {
  role: MegaERole;
  action: MegaEAction;
  requestedSpecialistRole?: MegaERole | null;
  territory?: string | null;
  reviewerTerritories?: string[];
}): MegaEAccessDecision {
  const reasons: string[] = [];

  if (separateAuthorityActions.has(input.action)) {
    return {
      disposition: "SEPARATE_AUTH_REQUIRED",
      reasons: ["separate_authority_boundary"],
    };
  }

  if (input.role === "PUBLIC_USER_FUTURE") {
    return { disposition: "DENY", reasons: ["public_role_not_activated"] };
  }

  if (input.role === "AUDITOR_READ_ONLY") {
    if (
      input.action === "READ_PRIVATE_REFERENCE" ||
      input.action === "AUDIT_READ"
    ) {
      return { disposition: "ALLOW", reasons: ["auditor_read_only"] };
    }
    return { disposition: "DENY", reasons: ["auditor_mutation_prohibited"] };
  }

  switch (input.action) {
    case "READ_PRIVATE_REFERENCE":
      return privateReaders.has(input.role)
        ? { disposition: "ALLOW", reasons: ["private_read_role"] }
        : { disposition: "DENY", reasons: ["private_read_not_granted"] };
    case "PRESERVE_PRIVATE_REFERENCE":
      return preservationRoles.has(input.role)
        ? { disposition: "ALLOW", reasons: ["private_preservation_role"] }
        : {
            disposition: "DENY",
            reasons: ["private_preservation_not_granted"],
          };
    case "PROPOSE_SOURCE_ADMISSION":
      return proposalRoles.has(input.role)
        ? { disposition: "ALLOW", reasons: ["proposal_role"] }
        : { disposition: "DENY", reasons: ["proposal_not_granted"] };
    case "RUN_PRIVATE_PILOT":
      return pilotRoles.has(input.role)
        ? { disposition: "ALLOW", reasons: ["private_pilot_role"] }
        : { disposition: "DENY", reasons: ["private_pilot_not_granted"] };
    case "VIEW_SENSITIVE_DEED":
      return sensitiveReaders.has(input.role)
        ? { disposition: "ALLOW", reasons: ["sensitive_deed_role"] }
        : { disposition: "DENY", reasons: ["sensitive_deed_not_granted"] };
    case "ADMINISTER_IDENTITY_BINDINGS":
      return identityAdmins.has(input.role)
        ? { disposition: "ALLOW", reasons: ["identity_admin_role"] }
        : { disposition: "DENY", reasons: ["identity_admin_not_granted"] };
    case "SPECIALIST_DECISION_APPROVE": {
      if (!specialistRoles.has(input.role)) {
        return {
          disposition: "DENY",
          reasons: ["specialist_authority_not_granted"],
        };
      }
      if (
        input.requestedSpecialistRole &&
        input.requestedSpecialistRole !== input.role
      ) {
        reasons.push("specialist_role_mismatch");
      }
      if (
        input.role === "LEGAL_STATUS_REVIEWER" &&
        input.territory &&
        !(input.reviewerTerritories || []).includes(input.territory)
      ) {
        reasons.push("territory_scope_mismatch");
      }
      return reasons.length
        ? { disposition: "DENY", reasons }
        : { disposition: "ALLOW", reasons: ["specialist_role_scope_match"] };
    }
    case "AUDIT_READ":
      return privateReaders.has(input.role)
        ? { disposition: "ALLOW", reasons: ["audit_read_role"] }
        : { disposition: "DENY", reasons: ["audit_read_not_granted"] };
    default:
      return { disposition: "DENY", reasons: ["action_not_granted"] };
  }
}

export type SensitiveDeedView = {
  deedId: string;
  title: string;
  beneficiaryIds: string[];
  witnessEntityIds: string[];
  nazirEntityIds: string[];
  sensitiveFieldsRedacted: boolean;
};

export function projectSensitiveDeedForRole(input: {
  role: MegaERole;
  deed: {
    deedId: string;
    title: string;
    beneficiaryIds: string[];
    witnessEntityIds: string[];
    nazirEntityIds: string[];
  };
}): SensitiveDeedView {
  const allowed =
    evaluateMegaEAccess({
      role: input.role,
      action: "VIEW_SENSITIVE_DEED",
    }).disposition === "ALLOW";
  if (allowed) {
    return {
      ...input.deed,
      beneficiaryIds: [...input.deed.beneficiaryIds],
      witnessEntityIds: [...input.deed.witnessEntityIds],
      nazirEntityIds: [...input.deed.nazirEntityIds],
      sensitiveFieldsRedacted: false,
    };
  }
  return {
    deedId: input.deed.deedId,
    title: input.deed.title,
    beneficiaryIds: [],
    witnessEntityIds: [],
    nazirEntityIds: [],
    sensitiveFieldsRedacted: true,
  };
}

export function buildMegaENegativeAuthorizationMatrix(): Array<{
  role: MegaERole;
  action: MegaEAction;
  expected: MegaEAccessDisposition;
}> {
  const roles: MegaERole[] = [
    "PROGRAM_OWNER",
    "SYSTEM_ACCESS_ADMIN",
    "DEVELOPER_ENGINEER",
    "SOURCE_RESEARCHER",
    "INGESTION_OPERATOR",
    "DATA_GOVERNANCE_STEWARD",
    "LEGAL_STATUS_REVIEWER",
    "WAQF_DEED_REVIEWER",
    "FIQH_SHARIA_REVIEWER",
    "HISTORICAL_EVIDENCE_REVIEWER",
    "RIGHTS_REVIEWER",
    "SECURITY_PRIVACY_REVIEWER",
    "PROGRAM_ACCEPTANCE_REVIEWER",
    "AUDITOR_READ_ONLY",
    "RESEARCH_USER",
    "PUBLIC_USER_FUTURE",
    "RELEASE_OPERATOR",
  ];
  const protectedActions: MegaEAction[] = [
    "LIVE_SHARED_DB_MUTATION",
    "MAIN_MERGE",
    "BASELINE_PROMOTION",
    "PRODUCTION_PUBLIC_RELEASE",
  ];
  return roles.flatMap(role =>
    protectedActions.map(action => ({
      role,
      action,
      expected: "SEPARATE_AUTH_REQUIRED" as const,
    }))
  );
}

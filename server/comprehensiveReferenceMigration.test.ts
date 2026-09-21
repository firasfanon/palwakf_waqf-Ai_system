import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  resolve(process.cwd(), "sql", "WAQF_AI_COMPREHENSIVE_WAQF_REFERENCE_V1.sql"),
  "utf8"
);

const expectedTables = [
  "source_collections",
  "source_collection_members",
  "reference_artifacts",
  "reference_artifact_versions",
  "preservation_events",
  "legal_instruments",
  "legal_instrument_versions",
  "legal_instrument_territory_status",
  "legal_instrument_relations",
  "legal_status_evidence",
  "waqf_deeds",
  "waqf_conditions",
  "waqf_assets",
  "waqf_deed_assets",
  "waqf_deed_relations",
  "waqf_asset_rights",
  "waqf_title_chain_events",
  "waqf_beneficiaries",
  "parcel_crosswalk_candidates",
  "jurisdiction_rules",
  "evidence_conflicts",
  "collection_crawl_checkpoints",
  "reference_governance_events",
  "reference_admission_decisions",
];

describe("comprehensive reference migration source", () => {
  it("declares every required MEGA_A table", () => {
    for (const table of expectedTables) {
      expect(sql.toLowerCase()).toContain(
        `create table if not exists assistant.${table}`
      );
    }
  });

  it("enables RLS and removes public/anon/authenticated table privileges", () => {
    for (const table of expectedTables) {
      expect(sql.toLowerCase()).toContain(
        `alter table assistant.${table} enable row level security`
      );
      expect(sql.toLowerCase()).toContain(
        `revoke all on assistant.${table} from public, anon, authenticated`
      );
    }
  });

  it("does not introduce public runtime RPCs or automatic chat release", () => {
    expect(sql).not.toMatch(
      /grant\s+execute[\s\S]+?to\s+(?:anon|authenticated)/i
    );
    expect(sql).not.toMatch(
      /chat_eligible\s+boolean\s+not\s+null\s+default\s+true/i
    );
    expect(sql).toContain(
      "DO NOT APPLY TO SHARED SUPABASE WITHOUT SEPARATE AUTHORITY"
    );
  });

  it("keeps canonical and chat decisions default-false", () => {
    expect(sql).toMatch(/canonical_reference boolean not null default false/i);
    expect(sql).toMatch(/chat_eligible boolean not null default false/i);
  });

  it("separates preservation, quote and download rights from RAG/public state", () => {
    expect(sql).toMatch(/preservation_allowed boolean not null default false/i);
    expect(sql).toMatch(/quote_allowed boolean not null default false/i);
    expect(sql).toMatch(/download_allowed boolean not null default false/i);
  });
});

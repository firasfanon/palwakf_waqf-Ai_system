import { describe, expect, it } from "vitest";
import {
  filterPublicKnowledgeDocuments,
  isLegacyReviewContentUatEnabled,
  mapLegacyReviewContentPayload,
  resolveAssistantSupabaseConfig,
  scorePublicKnowledgeSearch,
} from "./canonicalRuntimeBinding";

describe("canonical runtime binding policy", () => {
  it("recognizes standard Supabase anon variables without service-role credentials", () => {
    const config = resolveAssistantSupabaseConfig({
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_ANON_KEY: "anon-key",
    } as NodeJS.ProcessEnv);

    expect(config).toEqual({
      url: "https://example.supabase.co",
      key: "anon-key",
    });
  });

  it("keeps legacy review content UAT opt-in", () => {
    expect(
      isLegacyReviewContentUatEnabled({
        LEGACY_CONTENT_UAT_ENABLED: "true",
      } as NodeJS.ProcessEnv),
    ).toBe(true);
    expect(isLegacyReviewContentUatEnabled({} as NodeJS.ProcessEnv)).toBe(false);
  });

  it("allows approved public production browse rows while excluding review-only, test, internal and learning candidates", () => {
    const rows = [
      {
        id: "good",
        title: "مرجع قانوني",
        status: "approved",
        category: "law",
        metadataJson: {
          visibility_scope: "public",
          content_status: "production",
        },
      },
      {
        id: "candidate",
        title: "مرشح تعلم وقفي",
        status: "review_only",
        category: "law",
        toolOrigin: "waqf_research_answer",
        metadataJson: {
          visibility_scope: "public",
          content_status: "production",
        },
      },
      {
        id: "test",
        title: "Minimal Test Document",
        status: "approved",
        category: "law",
        metadataJson: {
          visibility_scope: "public",
          content_status: "test",
        },
      },
      {
        id: "internal",
        title: "إجراء داخلي",
        status: "approved",
        category: "law",
        metadataJson: {
          visibility_scope: "internal",
          content_status: "production",
        },
      },
    ];

    expect(filterPublicKnowledgeDocuments(rows).map((row) => row.id)).toEqual([
      "good",
    ]);
  });

  it("maps recovered FAQ and Suggested Question records as review-only UAT data", () => {
    const faq = mapLegacyReviewContentPayload("faqs", {
      question: "ما هو الوقف؟",
      answer: "جواب",
      category: "general",
      order: 2,
    });
    const suggested = mapLegacyReviewContentPayload("suggested_questions", {
      question: "ما شروط الوقف؟",
      category: "legal",
      display_order: 3,
    });

    expect(faq).toMatchObject({
      id: -2,
      isActive: true,
      reviewOnly: true,
      question: "ما هو الوقف؟",
    });
    expect(suggested).toMatchObject({
      id: -3,
      isActive: true,
      reviewOnly: true,
      question: "ما شروط الوقف؟",
    });
  });

  it("assigns a positive deterministic public search score", () => {
    expect(
      scorePublicKnowledgeSearch("قانون", {
        title: "قانون الأراضي العثماني",
        content: "نص",
      }),
    ).toBeGreaterThan(0);
  });
});

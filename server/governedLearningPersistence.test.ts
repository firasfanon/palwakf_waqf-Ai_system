import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const routersSource = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
const knowledgeOperationsSource = readFileSync(new URL("./knowledgeOperations.ts", import.meta.url), "utf8");

describe("governed learning persistence closure", () => {
  it("does not silently swallow waqf research ai_tool_run persistence failures", () => {
    expect(routersSource).toContain("const learningPersistence = await runtimeCreateAiToolRun({");
    expect(routersSource).not.toContain("void runtimeCreateAiToolRun({");
    expect(routersSource).not.toContain("}).catch(() => undefined);");
    expect(routersSource).toContain("[chat.sendMessage] ai_tool_run persistence failed");
    expect(routersSource).toContain("diagnosticCode: 'ai_tool_run_persistence_failed'");
    expect(routersSource).toContain("learningPersistenceStatus: learningPersistence.status");
  });

  it("keeps the governed materialization wrapper and controlled review router binding", () => {
    expect(knowledgeOperationsSource).toContain("rpc_materialize_research_learning_candidate_v1");
    expect(routersSource).toContain("materializeResearchLearningCandidate: adminProcedure");
    expect(routersSource).toContain("requireAssistantMaturityOperation('controlled_review')");
    expect(routersSource).toContain("'knowledgeIngestion.materializeResearchLearningCandidate'");
  });
});

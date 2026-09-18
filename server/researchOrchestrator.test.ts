import { describe, expect, it } from "vitest";
import { auditResearchAnswer } from "./researchOrchestrator";

describe("research evidence audit", () => {
  it("accepts valid internal and external citations", () => {
    const audit = auditResearchAnswer("[ثابت بالمصدر] حكم [مرجع 1]. دعم [مصدر خارجي 2].", 2, 2);
    expect(audit.valid).toBe(true);
    expect(audit.citedInternal).toEqual([1]);
    expect(audit.citedExternal).toEqual([2]);
    expect(audit.evidenceStateCounts.established).toBe(1);
  });
  it("rejects hallucinated citation indexes", () => {
    const audit = auditResearchAnswer("ادعاء [مرجع 4] وآخر [مصدر خارجي 3]", 2, 1);
    expect(audit.valid).toBe(false);
    expect(audit.invalidTokens).toEqual(["[مرجع 4]", "[مصدر خارجي 3]"]);
  });
  it("counts evidence states", () => {
    const audit = auditResearchAnswer("[استنتاج تحليلي] أ. [مختلف فيه] ب. [غير محسوم] ج.", 0, 0);
    expect(audit.evidenceStateCounts).toEqual({ established: 0, inference: 1, contested: 1, unresolved: 1 });
  });
});

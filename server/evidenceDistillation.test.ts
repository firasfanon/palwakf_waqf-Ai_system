import { describe, expect, it } from "vitest";
import { auditCompactEvidencePack, auditSemanticRetention, compactClaimFragments, compactEvidencePack, distillEvidenceClaims, requiredEvidenceSourceIndexes, verifyEvidenceClaims } from "./evidenceDistillation";

const question = "هل تنطبق المادة الثانية من قانون الأراضي العثماني على وقف خاصكي سلطان إذا اعتُبر وقف تخصيصات؟ وما الدليل على طبيعة إنشائه؟";
const rows = [
  {id:"law",kind:"legal",authority:"reference",content:"المادة (1) تقسم الأراضي. المادة (2) الأراضي المملوكة أربعة أنواع: الأول العرصات والثاني الأراضي التي أفرزت من الأراضي الأميرية وملكت تمليكا صحيحا. المادة (3) الأراضي الأميرية. المادة (4) الأراضي الموقوفة قسمان. القسم الأول الوقف الصحيح. القسم الثاني الأراضي المفرزة من الأراضي الأميرية التي أوقفها السلاطين أو أوقفها آخرون بالإذن السلطاني، ووقفيتها عبارة عن تخصيص منافع، ومع بقاء رقبتها عائدة إلى بيت المال تجري عليها أحكام الأراضي الأميرية. المادة (5) أحكام أخرى."},
  {id:"appeal",kind:"legal",authority:"reference",content:"اسباب الاستئناف: اخطأت المحكمة في اعتبار نوع الارض هو وقف خاسكي سلطان. المحكمة بعد التدقيق والمداولة وبالرجوع الى الاراضي الموقوفة وهي نوعان، الوقف الصحيح ووقف التخصيصات. ومن خلال الرجوع الى السند نجد بان نوع الارض هي وقف خاسكي سلطان وبقيت نوع الارض وقف خاسكي سلطان، وان دخول وقف التخصيصات ضمن البلدية لا يزيل عنها صفتها كوقف تخصيصات."},
  {id:"cass",kind:"legal",authority:"reference",content:"يستند الطعن في مجمله للأسباب التالية: محكمة الاستئناف اخطأت عندما قضت بالحكر. المحكمة بالتدقيق وبعد المداولة وفي الموضوع، وبإنزال صحيح حكم القانون على الوقائع المذكورة، يتعين الاشارة إلى أن الفرق بين الوقف الصحيح ووقف التخصيصات وفق حكم المادة (4)، أما وقف التخصيصات فهو تخصيص منافع لقطعة مفرزة من الأراضي الأميرية من طرف السلاطين أو بإذنهم لجهة خيرية مع بقاء رقبتها لبيت المال. لهذه الاسباب نقرر قبول الطعن موضوعا ونقض الحكم المطعون فيه."},
  {id:"study",kind:"academic",authority:"scholarly",content:"This article studies Early-Ottoman Palestinian toponymy. As our test case, we used the toponyms recorded in the endowment deed (waqfiyya) of the Jerusalem soup kitchen established by Haseki Sultan, dated 958 AH / 1552 C.E."}
];

describe("legal evidence distillation", () => {
  it("separates pleadings from court reasoning and retains required legal structure", () => {
    const claims = distillEvidenceClaims(question, rows, 6000);
    const audit = auditSemanticRetention(question, claims);
    expect(verifyEvidenceClaims(claims, rows)).toBe(true);
    expect(audit.valid).toBe(true);
    expect(audit.partyArgumentLeak).toBe(false);
    expect(audit.missing).toEqual([]);
    expect(claims.some(c => c.legalRole === "court_reasoning" && c.sourceId === "appeal")).toBe(true);
    expect(claims.some(c => c.legalRole === "court_reasoning" && c.sourceId === "cass")).toBe(true);
  });

  it("retains article 2, article 4 qualifier, Haseki link, and historical creation evidence", () => {
    const claims = distillEvidenceClaims(question, rows, 6000);
    const pack = compactEvidencePack(claims);
    expect(pack).toContain("المادة (2)");
    expect(pack).toContain("المادة (4)");
    expect(pack).toContain("مع بقاء");
    expect(pack).toMatch(/خاصكي سلطان|Haseki Sultan/);
    expect(pack).toMatch(/waqfiyya|1552/);
    expect(auditCompactEvidencePack(question, claims, 4).valid).toBe(true);
    for (const claim of claims) {
      for (const fragment of compactClaimFragments(claim)) {
        expect(claim.exactQuote).toContain(fragment);
      }
    }
  });

  it("fails semantic retention when decisive qualifier is silently removed everywhere", () => {
    const weakened = rows.map((r, i) => {
      if (i === 0) return {...r, content:r.content.replace("ومع بقاء رقبتها عائدة إلى بيت المال تجري عليها أحكام الأراضي الأميرية.", "")};
      if (i === 2) return {...r, content:r.content.replace("مع بقاء رقبتها لبيت المال", "")};
      return r;
    });
    const claims = distillEvidenceClaims(question, weakened, 6000);
    const audit = auditSemanticRetention(question, claims);
    const compactAudit = auditCompactEvidencePack(question, claims, 4);
    expect(audit.valid).toBe(false);
    expect(audit.missing).toContain("LEGAL_QUALIFIER");
    expect(compactAudit.valid).toBe(false);
    expect(compactAudit.missing).toContain("LEGAL_QUALIFIER");
  });

  it("selects only semantically required evidence sources for a focused legal question", () => {
    const claims = [
      {claimId:"R1",sourceId:"maqam:cassation-1383-2019",sourceIndex:1,sourceType:"legal",authorityClass:"reference",legalRole:"court_reasoning" as const,exactQuote:"تقضي بتسجيل رقبة العقار للوقف وملكية حق المنفعة بمقتضى التحكير للمدعي",qualifiers:[],applicabilityStatus:"case_specific" as const,verificationStatus:"verbatim_match" as const},
      {claimId:"R2",sourceId:"other-case",sourceIndex:2,sourceType:"legal",authorityClass:"reference",legalRole:"court_reasoning" as const,exactQuote:"نص قانوني غير لازم للسؤال",qualifiers:[],applicabilityStatus:"case_specific" as const,verificationStatus:"verbatim_match" as const},
    ];
    expect(requiredEvidenceSourceIndexes(
      "ما أثر الحكر على رقبة العقار وحق المنفعة وفق نقض 1383/2019؟",
      claims,
    )).toEqual([1]);
  });

  it("extracts article 2 from the correct legal instrument rather than by article number alone", () => {
    const shariaRows = [{
      id:"maqam:sharia-procedure-art2",
      kind:"legal",
      authority:"reference",
      content:"المادة رقم 2 من قانون أصول المحاكمات الشرعية رقم (31) لسنة 1959م اختصاصات المحاكم الشرعية تنظر المحاكم الشرعية وتفصل في المواد التالية: 1- الوقف وإنشاؤه من قبل المسلمين وشروطه والتولية عليه واستبداله. 2- الدعاوى المتعلقة بالنزاع بين وقفين أو بصحة الوقف وما يترتب عليه من حقوق.",
    }];
    const q2 = "ما سند اختصاص المحاكم الشرعية في إنشاء الوقف وصحته وفق المادة 2 من قانون أصول المحاكمات الشرعية؟";
    const claims = distillEvidenceClaims(q2, shariaRows, 2000);
    expect(claims).toHaveLength(1);
    expect(claims[0].legalRole).toBe("statute");
    expect(claims[0].citationPointer).toBe("المادة (2)");
    expect(claims[0].exactQuote).toContain("اختصاصات المحاكم الشرعية");
    expect(claims[0].exactQuote).toContain("الوقف وإنشاؤه");
    expect(claims[0].exactQuote).toContain("بصحة الوقف");
    expect(claims[0].exactQuote).not.toContain("الأراضي المملوكة");
  });
});

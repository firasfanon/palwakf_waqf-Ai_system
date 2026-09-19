import type { EvidenceClaim } from "./evidenceDistillation";
import type { ResearchSourceResult } from "./researchSources";

export type LegalSkillDefect =
  | "ARTICLE_2_ARTICLE_4_CONFLATION"
  | "HASEKI_CLASSIFICATION_OVERCLAIM"
  | "PARTY_ARGUMENT_AS_COURT_REASONING"
  | "HISTORICAL_2014_1552_CONFLATION"
  | "CASSATION_DIRECT_HASEKI_MISAPPLICATION"
  | "UNSUPPORTED_AUTHORITY_OR_FACT"
  | "CITATION_SOURCE_MISMATCH";

export type LegalSkillAudit = {
  valid: boolean;
  defects: LegalSkillDefect[];
  details: Array<{ defect: LegalSkillDefect; sentence: string }>;
};

const normalize = (value: string) =>
  value
    .replace(/ـ/g, "")
    .replace(/&nbsp;|\u00a0/gi, " ")
    .replace(/[إأآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim();

const words = (value: string) =>
  normalize(value)
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(w => w.length >= 3 && !new Set([
      "الماده","المحكمه","مصدر","خارجي","هذه","هذا","التي","الذي","ذلك","بان","كما","وقد","ومن","علي","الى","انه","انها","فهو","فهي"
    ]).has(w));

function overlapScore(left: string, right: string) {
  const a = new Set(words(left));
  const b = new Set(words(right));
  if (!a.size || !b.size) return 0;
  let hit = 0;
  for (const token of a) if (b.has(token)) hit++;
  return hit / Math.max(1, Math.min(a.size, b.size));
}

function sentencesOf(draft: string) {
  return draft
    .split(/\n+|(?<=[.!؟])\s+/u)
    .map(x => x.trim())
    .filter(Boolean);
}

function citedIndexes(sentence: string) {
  return [...sentence.matchAll(/\[مصدر خارجي\s+(\d+)\]/g)].map(m => Number(m[1]));
}

function hasConditionalGuard(value: string) {
  return /(اذا|إذا|إن\s+ثبت|ان\s+ثبت|بافتراض|على\s+فرض|في\s+حال|لا\s+يمكن|لا\s+يثبت|لا\s+تكفي|لا\s+يكفي|غير\s+محسوم|ليس\s+دليلا|لا\s+يجزم)/u.test(value);
}

function claimsForSources(claims: EvidenceClaim[], indexes: number[]) {
  const set = new Set(indexes);
  return claims.filter(c => set.has(c.sourceIndex));
}

function claimText(claims: EvidenceClaim[]) {
  return claims.map(c => `${c.citationPointer || ""} ${c.exactQuote}`).join(" ");
}

function signatureSupported(sentence: string, citedClaims: EvidenceClaim[]) {
  const s = normalize(sentence);
  if (!citedClaims.length) return false;

  if (/(وقفيه|waqfiyya|endowment deed|1552|958\s*(?:هـ|ah))/iu.test(s)) {
    return citedClaims.some(c => c.legalRole === "historical_evidence" && /(waqfiyya|endowment deed|1552|958\s*AH)/iu.test(c.exactQuote));
  }
  if (/الماده\s*\(?2\)?/u.test(s)) {
    return citedClaims.some(c => c.citationPointer === "المادة (2)");
  }
  if (/(خاصكي|خاسكي)\s+سلطان/u.test(s)) {
    return citedClaims.some(c => /(خاصكي|خاسكي)\s+سلطان/u.test(c.exactQuote));
  }
  if (/الماده\s*\(?4\)?/u.test(s) || /(وقف\s+(?:ال)?تخصيصات|تخصيص\s+منافع|بيت\s+المال)/u.test(s)) {
    return citedClaims.some(c => c.citationPointer === "المادة (4)" || /(وقف\s+(?:ال)?تخصيصات|تخصيص\s+منافع|بيت\s+المال)/u.test(c.exactQuote));
  }
  return citedClaims.some(c => overlapScore(sentence, c.exactQuote) >= 0.45);
}

function partySegment(content: string) {
  const n = normalize(content);
  const marker = n.search(/المحكمه\s+بعد\s+التدقيق\s+والمداوله|المحكمه\s+بالتدقيق\s+وبعد\s+المداوله/u);
  return marker >= 0 ? n.slice(0, marker) : "";
}

function courtClaimSupport(sentence: string, citedClaims: EvidenceClaim[]) {
  return citedClaims
    .filter(c => c.legalRole === "court_reasoning" || c.legalRole === "court_holding")
    .reduce((best, c) => Math.max(best, overlapScore(sentence, c.exactQuote)), 0);
}

export function auditLegalDraftWithSkillRules(
  draft: string,
  claims: EvidenceClaim[],
  sources: ResearchSourceResult[],
): LegalSkillAudit {
  const defects = new Set<LegalSkillDefect>();
  const details: LegalSkillAudit["details"] = [];

  const add = (defect: LegalSkillDefect, sentence: string) => {
    defects.add(defect);
    if (!details.some(d => d.defect === defect && d.sentence === sentence)) details.push({ defect, sentence });
  };

  for (const sentence of sentencesOf(draft)) {
    const n = normalize(sentence);
    const indexes = citedIndexes(sentence);
    const citedClaims = claimsForSources(claims, indexes);
    const citedText = normalize(claimText(citedClaims));
    let suppressGenericCitationMismatch = false;

    if (
      /الماده\s*\(?2\)?/u.test(n) &&
      /(وقف\s+التخصيصات|تخصيص\s+منافع|بيت\s+المال)/u.test(n)
    ) {
      add("ARTICLE_2_ARTICLE_4_CONFLATION", sentence);
    }

    if (
      /(خاصكي|خاسكي)\s+سلطان/u.test(n) &&
      /(وقف\s+(?:ال)?تخصيصات|وقف\s+غير\s+صحيح)/u.test(n) &&
      !hasConditionalGuard(n)
    ) {
      add("HASEKI_CLASSIFICATION_OVERCLAIM", sentence);
    }

    if (
      /2014/u.test(n) &&
      /(تاريخ\s+الانشاء|تاريخ\s+انشاء|انشاء\s+الوقف|الدليل\s+التاريخي|وقفيه|waqfiyya)/iu.test(n)
    ) {
      add("HISTORICAL_2014_1552_CONFLATION", sentence);
      suppressGenericCitationMismatch = true;
    }

    if (
      indexes.includes(3) &&
      /(خاصكي|خاسكي)\s+سلطان/u.test(n) &&
      !claims.some(c => c.sourceIndex === 3 && /(خاصكي|خاسكي)\s+سلطان/u.test(normalize(c.exactQuote)))
    ) {
      add("CASSATION_DIRECT_HASEKI_MISAPPLICATION", sentence);
      suppressGenericCitationMismatch = true;
    }

    if (
      /\b1550\b/u.test(n) &&
      !citedText.includes("1550")
    ) {
      add("UNSUPPORTED_AUTHORITY_OR_FACT", sentence);
      suppressGenericCitationMismatch = true;
    }
    if (
      /(حجه\s+سلطانيه|فرمان\s+سلطاني|براءه\s+سلطانيه)/u.test(n) &&
      !/(حجه\s+سلطانيه|فرمان\s+سلطاني|براءه\s+سلطانيه)/u.test(citedText)
    ) {
      add("UNSUPPORTED_AUTHORITY_OR_FACT", sentence);
      suppressGenericCitationMismatch = true;
    }

    if (
      /(قررت\s+المحكمه|المحكمه\s+قررت|قضت\s+المحكمه|خلصت\s+المحكمه)/u.test(n) &&
      indexes.length
    ) {
      const citedSources = sources.filter((_, idx) => indexes.includes(idx + 1));
      const partyScore = citedSources.reduce((best, row) => Math.max(best, overlapScore(sentence, partySegment(row.content || ""))), 0);
      const courtScore = courtClaimSupport(sentence, citedClaims);
      if (partyScore >= 0.55 && partyScore > courtScore + 0.12) {
        add("PARTY_ARGUMENT_AS_COURT_REASONING", sentence);
        suppressGenericCitationMismatch = true;
      }
    }

    if (indexes.length && !suppressGenericCitationMismatch && !signatureSupported(sentence, citedClaims)) {
      add("CITATION_SOURCE_MISMATCH", sentence);
    }
  }

  return { valid: defects.size === 0, defects: [...defects], details };
}

import type { EvidenceClaim } from "./evidenceDistillation";
import type { ResearchSourceResult } from "./researchSources";

export type LegalSkillDefect =
  | "ARTICLE_2_ARTICLE_4_CONFLATION"
  | "HASEKI_CLASSIFICATION_OVERCLAIM"
  | "PARTY_ARGUMENT_AS_COURT_REASONING"
  | "HISTORICAL_2014_1552_CONFLATION"
  | "CASSATION_DIRECT_HASEKI_MISAPPLICATION"
  | "UNSUPPORTED_AUTHORITY_OR_FACT"
  | "CITATION_SOURCE_MISMATCH"
  | "PROVISION_CONTENT_MISATTRIBUTION"
  | "STATUTE_IDENTITY_CONFLATION"
  | "BLANKET_GEOGRAPHIC_INFERENCE"
  | "RIGHT_TYPE_CONFLATION";

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
  // Citations are attached to answer lines/claim blocks, and one line may contain
  // multiple grammatical sentences before its final citation. Keep the line intact
  // so the citation ownership audit does not detach a cited qualification from the
  // source that supports the whole claim block.
  return draft
    .split(/\n+/u)
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

  if (/^حدود\s+الحكم/u.test(s) && /البلديه/u.test(s)) {
    return citedClaims.some(c =>
      (c.legalRole === "court_reasoning" || c.legalRole === "court_holding") &&
      /البلديه/u.test(normalize(c.exactQuote))
    );
  }
  if (/^حدود\s+النص/u.test(s) && /الماده\s*\(?2\)?/u.test(s)) {
    return citedClaims.some(c =>
      c.legalRole === "statute" &&
      articleNumber(c.citationPointer || c.exactQuote) === "2"
    );
  }
  if (/^حدود\s+الدليل\s+التاريخي/u.test(s)) {
    return citedClaims.some(c => c.legalRole === "historical_evidence");
  }

  const explicitWaqfiyya = /(?:^|[\s(،:])وقفيه(?:$|[\s).،:])/u.test(s);
  const historicalWaqfiyyaContext =
    (explicitWaqfiyya && /(مؤرخ|بتاريخ|وثيق|حجه|سنه|\b\d{3,4}\s*(?:هـ|م)\b)/u.test(s)) ||
    /(waqfiyya|endowment deed|1552|958\s*(?:هـ|ah))/iu.test(s);
  if (historicalWaqfiyyaContext) {
    return citedClaims.some(c =>
      c.legalRole === "historical_evidence" &&
      /(?:waqfiyya|endowment deed|1552|958\s*AH)/iu.test(c.exactQuote)
    );
  }
  if (/^المحكمه\s*[:：]/u.test(s)) {
    const courtClaims = citedClaims.filter(c =>
      c.legalRole === "court_reasoning" || c.legalRole === "court_holding"
    );
    if (courtClaims.some(c => overlapScore(sentence, c.exactQuote) >= 0.25)) return true;
  }

  const provisionNumber = articleNumber(s);
  const provisionAssertion =
    Boolean(provisionNumber) &&
    (Boolean(instrumentReference(sentence)) || /^الماده\s*\(?\d{1,3}\)?/u.test(s));
  if (provisionNumber && provisionAssertion) {
    return citedClaims.some(c => {
      const pointer = c.citationPointer || "";
      const sameProvision =
        articleNumber(pointer) === provisionNumber ||
        Boolean(pointer && s.includes(normalize(pointer)));
      return sameProvision && overlapScore(sentence, c.exactQuote) >= 0.2;
    });
  }
  if (/(خاصكي|خاسكي)\s+سلطان/u.test(s)) {
    return citedClaims.some(c => /(خاصكي|خاسكي)\s+سلطان/u.test(c.exactQuote));
  }
  if (/(وقف\s+(?:ال)?تخصيصات|تخصيص\s+منافع|بيت\s+المال)/u.test(s)) {
    return citedClaims.some(c => /(وقف\s+(?:ال)?تخصيصات|تخصيص\s+منافع|بيت\s+المال)/u.test(c.exactQuote));
  }
  return citedClaims.some(c => overlapScore(sentence, c.exactQuote) >= 0.45);
}

function partySegment(content: string) {
  const n = normalize(content);
  const marker = n.search(/المحكمه(?:\s*[:：]|\s+بعد\s+التدقيق\s+والمداوله|\s+بالتدقيق\s+وبعد\s+المداوله)/u);
  return marker >= 0 ? n.slice(0, marker) : "";
}

function courtClaimSupport(sentence: string, citedClaims: EvidenceClaim[]) {
  return citedClaims
    .filter(c => c.legalRole === "court_reasoning" || c.legalRole === "court_holding")
    .reduce((best, c) => Math.max(best, overlapScore(sentence, c.exactQuote)), 0);
}

function articleNumber(value: string): string | null {
  return normalize(value).match(/الماده\s*\(?(\d{1,3})\)?/u)?.[1] || null;
}

function instrumentReference(value: string): string | null {
  const n = normalize(value);
  return n.match(/الماده\s*\(?\d{1,3}\)?\s+من\s+(قانون\s+[^\[.،؛]+)/u)?.[1]?.trim() || null;
}

function sourceRowsForIndexes(sources: ResearchSourceResult[], indexes: number[]) {
  return indexes.map(index => sources[index - 1]).filter(Boolean);
}

function articleClaimScore(sentence: string, citedClaims: EvidenceClaim[], number: string, sameArticle: boolean) {
  return citedClaims
    .filter(c => {
      const pointerNumber = articleNumber(c.citationPointer || "");
      return sameArticle ? pointerNumber === number : Boolean(pointerNumber && pointerNumber !== number);
    })
    .reduce((best, c) => Math.max(best, overlapScore(sentence, c.exactQuote)), 0);
}

function hasInstrumentIdentityMismatch(sentence: string, indexes: number[], sources: ResearchSourceResult[]) {
  const n = normalize(sentence);
  // A court-reasoning line may accurately quote or discuss a statute while its
  // citation correctly points to the judgment carrying that reasoning.
  if (/^المحكمه\s*[:：]/u.test(n)) return false;
  const instrument = instrumentReference(sentence);
  if (!instrument || !indexes.length) return false;
  const rows = sourceRowsForIndexes(sources, indexes);
  if (!rows.length) return false;
  return rows.every(row => overlapScore(instrument, row.title) < 0.45);
}

function hasBlanketInferenceAgainstSource(sentence: string, citedClaims: EvidenceClaim[]) {
  const n = normalize(sentence);
  if (!/جميع/u.test(n) || !/وقف/u.test(n)) return false;
  if (/(رفض|رفضت|فرضيات|غير\s+قائم\s+على\s+اساس\s+واقعي|لا\s+يصح|لا\s+يمكن|لم\s+تعتبر)/u.test(n)) return false;
  const rejectionClaims = citedClaims.filter(c =>
    (c.legalRole === "court_reasoning" || c.legalRole === "court_holding") &&
    /(فرضيات|غير\s+قائم\s+على\s+اساس\s+واقعي|الواقع\s+يشير\s+الى\s+عكس)/u.test(normalize(c.exactQuote))
  );
  return rejectionClaims.some(c => overlapScore(sentence, c.exactQuote) >= 0.25);
}

function hasHukrRightTypeConflation(sentence: string, citedClaims: EvidenceClaim[]) {
  const n = normalize(sentence);
  const source = normalize(claimText(citedClaims));
  const sourceSeparatesRights =
    /رقبه\s+العقار[^.]{0,80}الوقف/u.test(source) &&
    /(حق\s+(?:الحكر|المنفعه)|الحكر\s*"?\s*\(?المنفعه\)?)/u.test(source);
  if (!sourceSeparatesRights) return false;
  const sentenceSeparatesRights =
    /رقبه\s+العقار[^.]{0,35}(?:للوقف|باسم\s+الوقف)/u.test(n) &&
    /(حق\s+(?:الحكر|المنفعه)|الحكر)[^.]{0,90}(?:للمدعي|للمحتكر|باسم\s+المدعي)/u.test(n);
  if (sentenceSeparatesRights) return false;
  return /(رقبه\s+العقار[^.]{0,50}(?:للمحتكر|للمدعي)|الحكر[^.]{0,80}(?:ينقل|يمنح)[^.]{0,50}(?:ملكيه\s+الرقبه|رقبه\s+العقار))/u.test(n);
}

function hasDateCitationMismatch(sentence: string, citedClaims: EvidenceClaim[]) {
  const n = normalize(sentence);
  if (!/(?:بتاريخ|مؤرخ|مؤرخه|تاريخ|وقفيه|waqfiyya|endowment deed)/iu.test(n)) return false;
  const years = [...n.matchAll(/\b(1[0-9]{3}|20[0-9]{2})\b/g)].map(m => m[1]);
  if (!years.length) return false;
  const source = normalize(claimText(citedClaims));
  return years.some(year => !source.includes(year));
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

    const provisionNumber = articleNumber(sentence);
    const provisionAssertion =
      Boolean(provisionNumber) &&
      (Boolean(instrumentReference(sentence)) || /^الماده\s*\(?\d{1,3}\)?/u.test(n));
    const specificArticle2Takhsisat =
      provisionNumber === "2" &&
      /(وقف\s+التخصيصات|تخصيص\s+منافع|بيت\s+المال)/u.test(n) &&
      citedClaims.some(c =>
        articleNumber(c.citationPointer || "") === "4" &&
        /(وقف\s+(?:ال)?تخصيصات|تخصيص\s+منافع|بيت\s+المال)/u.test(normalize(c.exactQuote))
      );

    if (provisionNumber && provisionAssertion && citedClaims.length && !specificArticle2Takhsisat) {
      const sameScore = articleClaimScore(sentence, citedClaims, provisionNumber, true);
      const otherScore = articleClaimScore(sentence, citedClaims, provisionNumber, false);
      if (otherScore >= 0.25 && otherScore > sameScore + 0.15) {
        add("PROVISION_CONTENT_MISATTRIBUTION", sentence);
        suppressGenericCitationMismatch = true;
      }
    }

    if (hasInstrumentIdentityMismatch(sentence, indexes, sources)) {
      add("STATUTE_IDENTITY_CONFLATION", sentence);
      suppressGenericCitationMismatch = true;
    }

    if (hasBlanketInferenceAgainstSource(sentence, citedClaims)) {
      add("BLANKET_GEOGRAPHIC_INFERENCE", sentence);
      suppressGenericCitationMismatch = true;
    }

    if (hasHukrRightTypeConflation(sentence, citedClaims)) {
      add("RIGHT_TYPE_CONFLATION", sentence);
      suppressGenericCitationMismatch = true;
    }

    if (specificArticle2Takhsisat) {
      add("ARTICLE_2_ARTICLE_4_CONFLATION", sentence);
      suppressGenericCitationMismatch = true;
    }

    if (
      /(خاصكي|خاسكي)\s+سلطان/u.test(n) &&
      /(وقف\s+(?:ال)?تخصيصات|وقف\s+غير\s+صحيح)/u.test(n) &&
      !hasConditionalGuard(n) &&
      !citedClaims.some(c =>
        /(خاصكي|خاسكي)\s+سلطان/u.test(normalize(c.exactQuote)) &&
        /(وقف\s+(?:ال)?تخصيصات|وقف\s+غير\s+صحيح)/u.test(normalize(c.exactQuote))
      )
    ) {
      add("HASEKI_CLASSIFICATION_OVERCLAIM", sentence);
    }

    if (
      /2014/u.test(n) &&
      /(تاريخ\s+الانشاء|تاريخ\s+انشاء|انشاء\s+الوقف|الدليل\s+التاريخي|وقفيه|waqfiyya)/iu.test(n) &&
      citedClaims.some(c => /2014/u.test(c.exactQuote) && /تسويه|التسويه/u.test(normalize(c.exactQuote))) &&
      !citedClaims.some(c => c.legalRole === "historical_evidence" && /2014/u.test(c.exactQuote))
    ) {
      add("HISTORICAL_2014_1552_CONFLATION", sentence);
      suppressGenericCitationMismatch = true;
    }

    if (
      /1543\s*\/\s*2016/u.test(n) &&
      /(خاصكي|خاسكي)\s+سلطان/u.test(n) &&
      indexes.length > 0 &&
      !citedClaims.some(c => /(خاصكي|خاسكي)\s+سلطان/u.test(normalize(c.exactQuote)))
    ) {
      add("CASSATION_DIRECT_HASEKI_MISAPPLICATION", sentence);
      suppressGenericCitationMismatch = true;
    }

    if (instrumentReference(sentence) && indexes.length === 0) {
      add("UNSUPPORTED_AUTHORITY_OR_FACT", sentence);
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

    if (indexes.length && !suppressGenericCitationMismatch && hasDateCitationMismatch(sentence, citedClaims)) {
      add("CITATION_SOURCE_MISMATCH", sentence);
      suppressGenericCitationMismatch = true;
    }

    if (indexes.length && !suppressGenericCitationMismatch && !signatureSupported(sentence, citedClaims)) {
      add("CITATION_SOURCE_MISMATCH", sentence);
    }
  }

  return { valid: defects.size === 0, defects: [...defects], details };
}

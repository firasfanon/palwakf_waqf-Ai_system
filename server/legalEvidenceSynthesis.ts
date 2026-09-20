import { invokeLLM } from "./_core/llm";
import { compactClaimFragments, type EvidenceClaim } from "./evidenceDistillation";

export type LegalSynthesisSectionKind = "statute_scope" | "controlling_rule" | "entity_application" | "historical_creation";

export type LegalSynthesisSectionPlan = {
  kind: LegalSynthesisSectionKind;
  label: string;
  claims: EvidenceClaim[];
  citations: number[];
  preferredModels: string[];
  maxTokens: number;
  instruction: string;
};

export type LegalSectionSynthesis = {
  kind: LegalSynthesisSectionKind;
  text: string;
  citations: number[];
  model: string;
};

const normalize = (value: string) => value.replace(/\s+/g, " ").trim();

function contentOf(response: any): string {
  const value = response?.choices?.[0]?.message?.content;
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.map((part: any) => typeof part === "string" ? part : part?.text || "").join("\n").trim();
  return "";
}

function questionTokens(question: string) {
  return [...new Set(normalize(question).split(/[^\p{L}\p{N}]+/u).filter(x => x.length >= 3))];
}

function scoreAgainstQuestion(text: string, tokens: string[]) {
  return tokens.reduce((score, token) => score + (text.includes(token) ? 1 : 0), 0);
}

type CoverageTheme =
  | "jurisdiction"
  | "municipal_boundary"
  | "registration"
  | "haseki_entity"
  | "hukr"
  | "takhsisat"
  | "correct_waqf"
  | "rights_structure"
  | "historical_creation"
  | "land_classification"
  | "tawliya"
  | "istibdal";

function coverageThemes(value: string): Set<CoverageTheme> {
  const n = normalize(value);
  const themes = new Set<CoverageTheme>();
  if (/اختصاص|صلاحية|المحاكم\s+الشرعية/u.test(n)) themes.add("jurisdiction");
  if (/البلدية|حدود\s+البلدية/u.test(n)) themes.add("municipal_boundary");
  if (/تسجيل|سندات?\s+التسجيل|اخراج\s+القيد|إخراج\s+القيد/u.test(n)) themes.add("registration");
  if (/(خاصكي|خاسكي)\s+سلطان|Haseki\s+Sultan/iu.test(n)) themes.add("haseki_entity");
  if (/الحكر|التحكير/u.test(n)) themes.add("hukr");
  if (/(?:وقف|اوقاف|أوقاف)\s+(?:ال)?تخصيصات|وقف\s+غير\s+صحيح/u.test(n)) themes.add("takhsisat");
  if (/الوقف\s+الصحيح/u.test(n)) themes.add("correct_waqf");
  if (/رقب(?:ة|تها)|حق\s+المنفعة|ملكية\s+الرقبة/u.test(n)) themes.add("rights_structure");
  if (/وقفي[ةه]|waqfiyya|endowment deed|1552|958\s*AH/iu.test(n)) themes.add("historical_creation");
  if (/تصنيف|نوع\s+الارض|ملكا|ملكاً|ميري|ميرية/u.test(n)) themes.add("land_classification");
  if (/التولية/u.test(n)) themes.add("tawliya");
  if (/استبدال/u.test(n)) themes.add("istibdal");
  return themes;
}

function uniqueCitations(claims: EvidenceClaim[]) {
  return [...new Set(claims.map(c => c.sourceIndex))].sort((a,b) => a-b);
}

function firstCompleteSentence(value: string) {
  const n = normalize(value);
  const m = n.match(/^(.+?[.!؟])(?:\s|$)/u);
  return normalize(m?.[1] || n);
}

function stripModelCitations(value: string) {
  return normalize(value.replace(/\[(?:مصدر خارجي|مرجع)\s+\d+\]/g, ""));
}

function hasConditionalGuard(value: string) {
  return /(لا\s+يمكن|لا\s+يثبت|لا\s+تكفي|غير\s+محسوم|إذا|إن\s+ثبت|بافتراض|على\s+فرض|في\s+حال)/u.test(value);
}

export function buildLegalSynthesisPlan(
  question: string,
  claims: EvidenceClaim[],
): LegalSynthesisSectionPlan[] | null {
  const q = normalize(question);
  const tokens = questionTokens(q);
  const wantsArticle2 = /المادة\s*(?:الثانية|2|\(2\))/u.test(q);
  const wantsTakhsisat = /(تخصيصات|وقف\s+غير\s+صحيح)/u.test(q);
  const wantsHistory = /(طبيعة\s+إنشائه|طبيعة\s+انشائه|إنشائه|انشائه)/u.test(q);
  if (!wantsArticle2 || !wantsTakhsisat || !wantsHistory) return null;

  const article2 = claims.filter(c => c.legalRole === "statute" && (c.citationPointer === "المادة (2)" || /المادة\s*\(2\)/u.test(c.exactQuote)));
  const article4 = claims.filter(c => c.legalRole === "statute" && (c.citationPointer === "المادة (4)" || /المادة\s*\(4\)/u.test(c.exactQuote)));
  const ruleCourt = claims.filter(c =>
    c.legalRole === "court_reasoning" &&
    /(وقف\s+التخصيصات|وقف\s+غير\s+صحيح|تخصيص\s+منافع)/u.test(c.exactQuote)
  );
  const historical = claims.filter(c => c.legalRole === "historical_evidence");
  const entityCandidates = claims
    .filter(c =>
      c.legalRole === "court_reasoning" &&
      !ruleCourt.includes(c) &&
      (!/(خاصكي|خاسكي|Haseki)/iu.test(q) || /(خاصكي|خاسكي)\s+سلطان|Haseki\s+Sultan/iu.test(c.exactQuote))
    )
    .map(c => ({
      claim: c,
      score: scoreAgainstQuestion(compactClaimFragments(c, q).join(" "), tokens),
    }))
    .sort((a,b) => b.score - a.score);
  const entity = entityCandidates[0]?.claim ? [entityCandidates[0].claim] : [];

  if (!article2.length || !article4.length || !ruleCourt.length || !entity.length || !historical.length) return null;

  return [
    {
      kind: "statute_scope",
      label: "المادة (2)",
      claims: article2,
      citations: uniqueCitations(article2),
      preferredModels: ["llama3.2:3b"],
      maxTokens: 48,
      instruction: "اكتب جملة عربية خبرية واحدة فقط توضّح موضوع النص القانوني المحدد دون نقل حكم أي مادة أخرى ودون إضافة معلومة من خارج النص. يجب أن تتضمن الجملة حرفيًا عبارة «الأراضي المملوكة».",
    },
    {
      kind: "controlling_rule",
      label: "المادة (4)",
      claims: [...article4, ...ruleCourt],
      citations: uniqueCitations([...article4, ...ruleCourt]),
      preferredModels: ["llama3.2:3b"],
      maxTokens: 96,
      instruction: "اكتب جملة عربية خبرية واحدة فقط تلخّص القاعدة القانونية. يجب أن تتضمن حرفيًا «وقف التخصيصات» و«تخصيص منافع» و«بيت المال». لا تنسب القاعدة إلى مادة أخرى.",
    },
    {
      kind: "historical_creation",
      label: "الدليل التاريخي",
      claims: historical,
      citations: uniqueCitations(historical),
      preferredModels: ["llama3.2:3b"],
      maxTokens: 56,
      instruction: "اكتب جملة عربية خبرية واحدة فقط تلخّص دليل الإنشاء التاريخي الوارد في النص. استخدم لفظ «الوقفية» واذكر التاريخ 958هـ/1552م كما يثبته النص. لا تضف تاريخًا أو واقعة من مصدر آخر.",
    },
    {
      kind: "entity_application",
      label: "التطبيق على الوقف محل السؤال",
      claims: entity,
      citations: uniqueCitations(entity),
      preferredModels: ["qwen2.5:3b"],
      maxTokens: 80,
      instruction: "النص القضائي التالي يثبت فقط ما هو مكتوب فيه. اكتب جملة عربية واحدة من جزأين: أ) ماذا يثبت السند عن اسم الأرض أو الوقف. ب) ما الذي لا يمكن إثباته من هذا المقتطف وحده بشأن كونها وقف تخصيصات. استخدم عبارة صريحة مثل «لا يمكن إثبات ... من هذا المقتطف وحده». اذكر اسم الوقف كما ورد في النص ولا تضف وقائع.",
    },
  ];
}

function validateSection(kind: LegalSynthesisSectionKind, text: string) {
  const n = normalize(text);
  if (!n) return false;
  if (kind === "statute_scope") return /الأراضي\s+المملوكة/u.test(n);
  if (kind === "controlling_rule") return /تخصيص/u.test(n) && /بيت\s+المال/u.test(n);
  if (kind === "historical_creation") return /(وقفية|waqfiyya|endowment deed)/iu.test(n) && /(1552|958\s*(?:هـ|AH))/iu.test(n);
  if (kind === "entity_application") return hasConditionalGuard(n);
  return false;
}

export function renderLegalSections(sections: LegalSectionSynthesis[]) {
  const order: LegalSynthesisSectionKind[] = ["statute_scope", "controlling_rule", "entity_application", "historical_creation"];
  return order.map(kind => {
    const section = sections.find(s => s.kind === kind);
    if (!section) return "";
    const label = kind === "statute_scope"
      ? "المادة (2)"
      : kind === "controlling_rule"
        ? "المادة (4)"
        : kind === "entity_application"
          ? "التطبيق على الوقف محل السؤال"
          : "الدليل التاريخي";
    const citations = section.citations.map(n => `[مصدر خارجي ${n}]`).join(" ");
    return `${label}: ${section.text} ${citations}`.trim();
  }).filter(Boolean).join("\n");
}

export function synthesizeDeterministicGroundedClaims(
  question: string,
  claims: EvidenceClaim[],
  requiredSourceIndexes: number[],
): { answer: string; sourceIndexes: number[] } | null {
  if (!requiredSourceIndexes.length) return null;
  const tokens = questionTokens(question);

  const selected: EvidenceClaim[] = [];
  for (const sourceIndex of requiredSourceIndexes) {
    const candidates = claims
      .filter(claim => claim.sourceIndex === sourceIndex)
      .map(claim => {
        const rendered = compactClaimFragments(claim, question).join(" ");
        const haystack = `${claim.sourceId} ${claim.citationPointer || ""} ${rendered}`.toLowerCase();
        const matchedTokens = tokens.filter(token => haystack.includes(token.toLowerCase()));
        const requiredThemes = coverageThemes(question);
        const candidateThemes = coverageThemes(rendered);
        const themeHits = [...candidateThemes].filter(theme => requiredThemes.has(theme));
        return { claim, score: themeHits.length * 10 + matchedTokens.length, matchedTokens };
      })
      .sort((a,b) => b.score - a.score || a.claim.claimId.localeCompare(b.claim.claimId));

    const first = candidates[0];
    if (!first) return null;
    selected.push(first.claim);

    const requiredThemes = coverageThemes(question);
    const coveredThemes = coverageThemes(compactClaimFragments(first.claim, question).join(" "));
    for (const candidate of candidates.slice(1)) {
      if (selected.filter(claim => claim.sourceIndex === sourceIndex).length >= 2) break;
      const candidateThemes = coverageThemes(compactClaimFragments(candidate.claim, question).join(" "));
      const newRequiredThemes = [...candidateThemes].filter(
        theme => requiredThemes.has(theme) && !coveredThemes.has(theme),
      );
      if (!newRequiredThemes.length) continue;
      selected.push(candidate.claim);
      newRequiredThemes.forEach(theme => coveredThemes.add(theme));
    }
  }

  const lines = selected.map(claim => {
    const body = compactClaimFragments(claim, question).join(" ");
    if (!body) return "";
    const label = claim.citationPointer
      ? claim.citationPointer
      : claim.legalRole === "court_reasoning" || claim.legalRole === "court_holding"
        ? "المحكمة"
        : claim.legalRole === "historical_evidence"
          ? "الدليل التاريخي"
          : "الدليل";
    return `${label}: ${body} [مصدر خارجي ${claim.sourceIndex}]`;
  }).filter(Boolean);

  if (lines.length !== selected.length) return null;

  const q = normalize(question);
  const citationList = [...new Set(requiredSourceIndexes)]
    .map(index => `[مصدر خارجي ${index}]`)
    .join(" ");

  if (
    /هل\s+يكفي|يلزم\s+دليل/u.test(q) &&
    /(خاصكي|خاسكي)\s+سلطان/u.test(q) &&
    /تخصيصات/u.test(q)
  ) {
    lines.push(
      `حدود الدليل: ثبوت وصف «وقف خاسكي سلطان» في السند لا يكفي وحده لإثبات أنه وقف تخصيصات؛ يلزم ربط هذا الوصف بضوابط وقف التخصيصات الواردة في الأدلة القانونية. ${citationList}`,
    );
  }

  if (/هل\s+هذا\s+النص\s+يقرر/u.test(q) && /تصنيف\s+الأرض|تصنيف\s+الارض/u.test(q)) {
    const statuteSource = selected.find(claim => claim.legalRole === "statute")?.sourceIndex;
    const citation = statuteSource ? `[مصدر خارجي ${statuteSource}]` : citationList;
    lines.push(
      `حدود النص: المادة (2) تتناول اختصاص المحاكم الشرعية في شؤون الوقف، ولا تقرر بذاتها تصنيف الأرض ملكاً أو ميرية. ${citation}`,
    );
  }

  if (
    /ما\s+الذي\s+لا\s+تثبت|ما\s+الذي\s+لا\s+يثبت/u.test(q) &&
    /(وقفي[ةه]|waqfiyya|1552|958)/iu.test(q)
  ) {
    const historicalSource = selected.find(claim => claim.legalRole === "historical_evidence")?.sourceIndex;
    const citation = historicalSource ? `[مصدر خارجي ${historicalSource}]` : citationList;
    lines.push(
      `حدود الدليل التاريخي: الوقفية تثبت نشأة الوقف وتاريخه كما يورده المصدر، لكنها لا تثبت وحدها التصنيف القانوني الحالي لقطعة أرض معينة. ${citation}`,
    );
  }

  if (/ما\s+حدود\s+الاستدلال/u.test(q) && /البلدي[ةه]/u.test(q)) {
    const caseSource = selected.find(claim =>
      (claim.legalRole === "court_reasoning" || claim.legalRole === "court_holding") &&
      /البلدي[ةه]/u.test(claim.exactQuote)
    )?.sourceIndex;
    const citation = caseSource ? `[مصدر خارجي ${caseSource}]` : citationList;
    lines.push(
      `حدود الحكم: ما يثبته الحكم بشأن دخول الأرض محل النزاع ضمن حدود البلدية يرتبط بوقائع وسندات القضية التي عالجها، ولا يثبت بذاته حكماً عاماً لكل أرض دون تطابق الوقائع. ${citation}`,
    );
  }

  return { answer: lines.join("\n"), sourceIndexes: selected.map(claim => claim.sourceIndex) };
}

function deterministicSectionText(section: LegalSynthesisSectionPlan): string | null {
  if (section.kind === "statute_scope") {
    const claim = section.claims.find(c => /الأراضي\s+المملوكة/u.test(c.exactQuote));
    if (!claim) return null;
    return firstCompleteSentence(
      normalize(claim.exactQuote).replace(/^المادة\s*\(2\)\s*/u, ""),
    );
  }

  if (section.kind === "controlling_rule") {
    const claim = section.claims.find(c =>
      /(وقف\s+التخصيصات|وقف\s+غير\s+صحيح)/u.test(c.exactQuote) &&
      /بيت\s+المال/u.test(c.exactQuote)
    );
    if (!claim) return null;
    const n = normalize(claim.exactQuote);
    const end = n.search(/بيت\s+المال/u);
    if (end < 0) return null;
    const match = n.slice(end).match(/^بيت\s+المال/u);
    const endIndex = match ? end + match[0].length : end;
    return normalize(n.slice(0, endIndex).replace(/^أما\s+/u, "")) + ".";
  }

  if (section.kind === "historical_creation") {
    const claim = section.claims.find(c => /(waqfiyya|endowment deed|وقفية)/iu.test(c.exactQuote));
    if (!claim) return null;
    const n = normalize(claim.exactQuote);
    const ahCe = n.match(/(\d{3,4})\s*AH\s*\/\s*(\d{4})\s*C\.E\./iu);
    if (ahCe) {
      return `الوقفية (waqfiyya) المذكورة في المصدر مؤرخة ${ahCe[1]}هـ/${ahCe[2]}م.`;
    }
    const ce = n.match(/(\d{4})\s*C\.E\./iu);
    if (ce) {
      return `الوقفية (waqfiyya) المذكورة في المصدر مؤرخة ${ce[1]}م.`;
    }
    return null;
  }

  return null;
}

export async function synthesizeStructuredLegalEvidence(
  question: string,
  claims: EvidenceClaim[],
): Promise<{ answer: string; sections: LegalSectionSynthesis[] } | null> {
  const plan = buildLegalSynthesisPlan(question, claims);
  if (!plan) return null;

  const produced: LegalSectionSynthesis[] = [];
  for (const section of plan) {
    const deterministic = deterministicSectionText(section);
    if (deterministic) {
      if (!validateSection(section.kind, deterministic)) {
        throw new Error(`UNRESOLVED_SECTION_SYNTHESIS: ${section.kind}`);
      }
      produced.push({
        kind: section.kind,
        text: deterministic,
        citations: section.citations,
        model: "deterministic_evidence",
      });
      continue;
    }

    const evidence = section.claims.map(c => c.exactQuote).join("\n");
    const prompt = [
      "اعتمد على النصوص التالية فقط.",
      section.instruction,
      "لا تضع أي إحالات؛ ستضاف الإحالات آليًا بعد التحقق.",
      evidence,
    ].join("\n");

    const response = await invokeLLM({
      messages: [{ role: "user", content: prompt }],
      maxTokens: section.maxTokens,
      preferredModels: section.preferredModels,
    });
    const raw = stripModelCitations(contentOf(response));
    const text = section.kind === "entity_application" ? raw : firstCompleteSentence(raw);
    if (!validateSection(section.kind, text)) {
      throw new Error(`UNRESOLVED_SECTION_SYNTHESIS: ${section.kind}`);
    }
    produced.push({
      kind: section.kind,
      text,
      citations: section.citations,
      model: response.model,
    });
  }

  return { answer: renderLegalSections(produced), sections: produced };
}

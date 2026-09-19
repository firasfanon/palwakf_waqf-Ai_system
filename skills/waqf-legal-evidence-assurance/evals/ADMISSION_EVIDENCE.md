# Admission Evidence — Waqf Legal Evidence Assurance V1

## Original hard benchmark

Question:
هل تنطبق المادة الثانية من قانون الأراضي العثماني على وقف خاصكي سلطان إذا اعتُبر وقف تخصيصات؟ وما الدليل على طبيعة إنشائه؟

Verified path:
4 authoritative/scholarly sources → structural extraction → verbatim verification → legal-role classification → semantic retention → 1089-char evidence pack → structured legal synthesis → citation audit → semantic answer audit.

Result:
- Citation Audit: PASS
- Semantic Answer Audit: PASS
- Haseki benchmark: PASS
- final synthesis preserves Article 2 vs Article 4 distinction
- court registry/jurisdiction evidence is not overclaimed as takhsisat proof
- 958 AH / 1552 CE waqfiyya evidence is kept separate from 2014 settlement activity

## Prompt-only skill A/B lesson

Loading methodology as additional LLM prompt text was rejected.

Qwen 2.5 3B:
- without skill: precision 0.25, recall 0.1429, F1 0.1818
- with prompt-only skill: precision 0.2222, recall 0.2857, F1 0.25
- recall improved but false positives and context cost increased

Llama 3.2 3B:
- emitted all available defect labels across cases
- no useful precision gain from prompt-only skill text

Decision:
`LOAD_SKILL_TEXT -> LLM_REVIEW -> TRUST_RESULT` = REJECTED.

## Deterministic adapter seeded A/B

WITHOUT adapted deterministic skill:
- TP 1
- FP 0
- FN 7
- precision 1.00
- recall 0.125
- F1 0.2222

WITH adapted deterministic skill:
- TP 8
- FP 0
- FN 0
- precision 1.00
- recall 1.00
- F1 1.00
- clean-case false positives 0

## Broader legal regression

Regression families include:
- statutory structure
- statute identity
- case scope
- judicial role
- rights structure / hukr
- citation ownership
- unsupported authority

Current targeted suite:
- 31/31 tests PASS across five test files
- TypeScript check PASS
- git diff --check PASS

## Live broader E2E

Three distinct real legal questions passed after generalizing evidence selection/distillation:

1. Appeal 91/2017 — blanket Bethlehem/Beit Jala Haseki inference
   - Citation Audit PASS
   - Semantic Audit PASS
   - Legal Skill Audit PASS
   - deterministic grounded synthesis
   - required source only

2. Cassation 1383/2019 — hukr / raqaba / usufruct
   - Citation Audit PASS
   - Semantic Audit PASS
   - Legal Skill Audit PASS
   - deterministic grounded synthesis

3. Sharia Procedure Article 2 — waqf creation/validity jurisdiction
   - Citation Audit PASS
   - Semantic Audit PASS
   - Legal Skill Audit PASS
   - correct instrument-specific Article 2 extraction

Original Haseki benchmark was rerun after these changes and remained PASS.

## Admission recommendation

Evidence supports:
- PROJECT_PROVEN = YES
- BROADER_DOMAIN_REGRESSION = PASS
- DOMAIN_SCOPE = WAQF_LEGAL_RESEARCH_HIGH_ASSURANCE
- PORTFOLIO_UNIVERSAL_SKILL = NOT PROVEN
- AUTO_PROMOTION = NO
- EXECUTION_AUTHORITY = NO

Recommended sovereign classification:
`DOMAIN_SCOPED_CANONICAL_SKILL`, subject to Mind review and Workspace decision.

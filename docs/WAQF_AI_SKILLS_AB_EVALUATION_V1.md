# WAQF AI Skills A/B Evaluation V1

Date: 2026-09-19
Status: COMPLETE
Scope: selected AgentCounsel methodology guidance, adapted as prompt-only review guidance for an initial admission test.
No skill package was installed.

## Objective

Test whether loading adapted legal-review skill guidance improves a local model's ability to detect seeded legal-research defects compared with a generic review prompt, using the same evidence and hardware.

## Hardware/runtime

- NVIDIA GeForce GTX 1050, 2048 MiB VRAM
- Ollama mixed CPU/GPU execution
- Context: 1536
- Temperature: 0
- Same compact evidence pack and same seeded review cases for A and B

## Evaluation corpus

Four cases were used to avoid the false impression created by a single all-defects case:

1. CLEAN — no seeded defect
2. SCOPE_OVERCLAIM
   - ARTICLE_2_ARTICLE_4_CONFLATION
   - HASEKI_CLASSIFICATION_OVERCLAIM
3. PARTY_HISTORY_CITATION
   - PARTY_ARGUMENT_AS_COURT_REASONING
   - HISTORICAL_2014_1552_CONFLATION
   - CITATION_SOURCE_MISMATCH
4. CASSATION_UNSUPPORTED
   - CASSATION_DIRECT_HASEKI_MISAPPLICATION
   - UNSUPPORTED_AUTHORITY_OR_FACT

Total positive defect instances: 7.

## A mode — WITHOUT_SKILL

Generic instruction:
- review draft against evidence
- return only matching defect IDs
- do not use model memory

## B mode — WITH_ADAPTED_SKILL

Adds a compact five-pass method derived from:
- Source Validation
- Statutory Interpretation
- Case Brief
- Citation Integrity Check
- Hallucination Red-Team

The guidance requires claim-to-source tracing, article separation, party-vs-court separation, citation-proposition matching, and unsupported-claim rejection.

## Qwen 2.5 3B results

WITHOUT_SKILL:
- TP: 1
- FP: 3
- FN: 6
- Precision: 0.25
- Recall: 0.1429
- F1: 0.1818
- Prompt tokens across 4 cases: 3345
- Output tokens: 91

WITH_SKILL:
- TP: 2
- FP: 7
- FN: 5
- Precision: 0.2222
- Recall: 0.2857
- F1: 0.25
- Prompt tokens across 4 cases: 4273
- Output tokens: 156

Interpretation:
- Recall improved by ~14.3 percentage points.
- F1 improved from ~0.182 to 0.25.
- False positives increased materially.
- Prompt-token cost increased by 928 tokens (~27.7%).
- Absolute performance remains too weak for admission as an autonomous legal-review gate.

Timing is not used for admission because the sequential A/B design creates model/cache warm-up bias.

## Llama 3.2 3B results

WITHOUT_SKILL:
- TP: 7
- FP: 21
- FN: 0
- Precision: 0.25
- Recall: 1.0
- F1: 0.4

WITH_SKILL:
- TP: 7
- FP: 21
- FN: 0
- Precision: 0.25
- Recall: 1.0
- F1: 0.4

Behavior:
- Llama emitted every available defect label for every case, including the clean case.
- The apparent 100% recall is therefore not useful; precision is only 25%.
- Skill guidance produced no correctness improvement.

## Decision

`RAW_SKILL_PROMPT_ADMISSION = FAIL`

Reason:
Loading external methodology as extra prompt text does not provide reliable enough discrimination on the current 3B local models. It can increase recall, but may also amplify false positives and context cost.

This result does NOT reject the upstream skills themselves.
It rejects the naive integration mode:
`LOAD_SKILL_TEXT -> LLM_REVIEW -> TRUST_RESULT`

## Accepted adaptation direction

`SKILL -> STRUCTURED_WORKFLOW -> DETERMINISTIC_GATES -> OPTIONAL_LLM_REVIEW`

The useful upstream content should be converted into PalWakf-native procedural controls:

1. Source Validation
   -> claim/source support matrix generated from verified evidence claims.

2. Citation Integrity
   -> deterministic citation-number + proposition-to-source ownership checks.

3. Case Brief discipline
   -> deterministic legal-role segmentation before synthesis.

4. Statutory Interpretation
   -> article/provision ownership and qualifier-retention gates.

5. Hallucination Red-Team
   -> deterministic unsupported-claim and overclaim checks, with optional LLM second pass.

LLM review may remain as a secondary reviewer, never the sole acceptance gate.

## Admission requirements for next iteration

An adapted skill implementation must pass:
- clean-case false-positive gate
- seeded-defect precision >= 0.90
- seeded-defect recall >= 0.90
- no source-role conflation
- no citation-source mismatch
- deterministic failure state when evidence is insufficient
- bounded context/token overhead

## Deterministic adapter iteration

A minimal PalWakf-native adapter was then implemented from the selected skill principles rather than loading upstream prose into the model.

Module:
- `server/legalSkillAdapter.ts`

Deterministic controls implemented:
- Article 2 / Article 4 ownership check
- Haseki classification overclaim guard
- party-argument vs court-reasoning comparison
- 2014 settlement vs 1552 waqfiyya separation
- Cassation-to-Haseki direct-misapplication check
- unsupported authority/fact check
- semantic citation-source ownership check

Unit regression:
- clean grounded draft: PASS
- article/Haseki seeded defects: PASS
- party/history/citation seeded defects: PASS
- cassation/unsupported seeded defects: PASS
- 4/4 adapter tests PASS

### Deterministic A/B against current product gates

The same four-case corpus was evaluated using real retrieved evidence and the existing product audits as A, then the new adapted deterministic skill audit as B.

WITHOUT_ADAPTED_SKILL:
- TP: 1
- FP: 0
- FN: 7
- Precision: 1.00
- Recall: 0.125
- F1: 0.2222

WITH_ADAPTED_DETERMINISTIC_SKILL:
- TP: 8
- FP: 0
- FN: 0
- Precision: 1.00
- Recall: 1.00
- F1: 1.00
- clean-case false positives: 0

This satisfies the provisional seeded-corpus acceptance thresholds of precision >= 0.90 and recall >= 0.90.

Important limitation:
This proves the adapter on the current legal-role / Haseki benchmark family and adversarial variants. It is not yet evidence of general legal-domain certification. Broader cross-question and cross-source regression is required before enabling the adapter globally.

## Current status

STATIC_REVIEW = PASS_WITH_ADAPTATION
PALWAKF_ADAPTATION_PLAN = PASS
PROMPT_ONLY_A_B = COMPLETE
PROMPT_ONLY_SKILL_ADMISSION = FAIL
DETERMINISTIC_SKILL_ADAPTER_V1 = SEEDED_A_B_PASS
RAW_SKILL_INSTALLATION = NO
GLOBAL_RUNTIME_ADMISSION = NOT_YET_GRANTED
NEXT = BROADER_LEGAL_REGRESSION_CORPUS -> GLOBAL_ADMISSION_DECISION

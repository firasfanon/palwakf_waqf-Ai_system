# WAQF AI — AgentCounsel Static Review + PalWakf Adaptation Plan V1

Date: 2026-09-19
Status: STATIC_REVIEW_COMPLETE / ADAPTATION_PLAN_READY / NO_SKILL_INSTALLED

## Pinned upstream

Repository: `tynbtynb/agentcounsel`
Pinned commit: `685f92a98395f3764fc4c734db57f43dd1f8e678`
License: MIT

Selected upstream files reviewed at the pinned commit:

| Skill | File SHA | Static review |
|---|---|---|
| Source Validation | `c4e5f21f69eaa0f539cd10477ac334e3602bcc62` | PASS_WITH_ADAPTATION |
| Citation Integrity Check | `8c80e6a71517e648065dcac47833b2d373fb1af7` | PASS_WITH_ADAPTATION |
| Case Brief | `d0fd7e8ba8f89dcd1827e1b5ca723128ffd18b64` | PASS_WITH_ADAPTATION |
| Statutory Interpretation | `1e050e5e9f81dc454d88060dd79626e88d5c3f80` | PASS_WITH_ADAPTATION |
| Hallucination Red-Team | `a39a8ba30373d7e4f50c7e32e2f393384e96a1e7` | PASS_WITH_ADAPTATION |

Supporting policy reviewed:
- `core/source-and-citation-discipline.md`
- file SHA `9f437503a26e8afcddd3cba2740fd33288c96e66`

## Static security findings

The five selected SKILL.md assets are Markdown-only workflow definitions.

Observed in selected files:
- executable code blocks: none
- shell / PowerShell / Python execution instructions: none
- destructive filesystem commands: none
- credential/API-key collection patterns: none
- embedded executable scripts: none
- external execution hooks: none

Initial static security classification:
`LOW_EXECUTION_RISK / MEDIUM_PROMPT_POLICY_RISK`

The remaining risk is instructional, not executable: imported skill text could conflict with PalWakf governance or import assumptions that are inappropriate for Palestinian/Ottoman waqf research. Therefore upstream text must not be loaded as sovereign policy verbatim.

## High-value rules to preserve

### Source Validation
Preserve:
- claim-by-claim support status
- exact-source tracing
- distinction between source-supported / insufficient / unsupported / contradicted
- no model-memory-as-verification

### Citation Integrity Check
Preserve:
- every legal proposition must trace to a source
- malformed / missing / mismatched citation detection
- proposition-to-authority support check
- explicit unresolved state rather than invented completion

### Case Brief
Preserve:
- facts / issue / holding / reasoning / dicta separation
- procedural posture
- narrow holding discipline
- source-local analysis only

### Statutory Interpretation
Preserve:
- exact operative text required
- provision-structure parsing
- defined-term and qualifier retention
- competing readings / ambiguity surfacing
- no reconstruction of statutory language from memory

### Hallucination Red-Team
Preserve:
- claim-origin classification
- unsupported/overbroad claim detection
- uncertainty marking
- fail-closed readiness outcome

## Required PalWakf adaptations

### 1. Split provenance trust from legal authority weight

AgentCounsel places user-provided documents at the top of its source hierarchy for verification.
For Waqf AI this must be split into two independent axes:

`PROVENANCE_VERIFICATION_STATUS`
- user-provided and text-verified
- independently retrieved and text-verified
- metadata-only
- model-memory-only (never sufficient)

`LEGAL_AUTHORITY_CLASS`
- original instrument / archival primary
- enacted legislation / official regulation
- court judgment
- official administrative record
- peer-reviewed scholarship
- scholarly reference
- secondary commentary
- discovery-only source

A user-provided copy can be highly verifiable as a document while still not outranking an official statute or original judgment as legal authority.

### 2. Replace US-specific connector assumptions

Do not import CourtListener-specific workflow as a general requirement.
For Waqf AI, connector/source resolution must be jurisdiction-aware:
- Maqam / Palestinian legal repositories
- official legislation and gazettes where available
- court/judicial authority sources
- Ottoman archival catalogs and original documents
- verified academic repositories

### 3. Preserve conditional legal conclusions

AgentCounsel is intentionally conservative about legal conclusions.
Waqf AI may provide evidence-bounded analysis when requested, but must label:
- established by source
- analytical inference
- contested
- unresolved

Conditional conclusions are allowed when the condition is explicit and the evidence supports the rule.

Example:
`If Haseki Sultan land is established as waqf takhsisat, Article 4 supplies the direct legal structure; the registry label alone does not establish that classification.`

### 4. Replace generic attorney-only language with PalWakf review roles

Do not remove human-review gates.
Normalize:
- attorney verification -> qualified legal/historical reviewer where appropriate
- legal judgment -> legal expert review when jurisdictional determination is required
- historical source verification -> qualified research review

### 5. Preserve PalWakf-native ontology

External skills must not replace:
- `EvidenceClaim` schema
- legalRole classification
- exactQuote verification
- semantic retention audit
- citation audit
- Waqf/Ottoman ontology
- Mind / Workspace promotion governance

## PalWakf skill architecture

Proposed package format: Agent Skills-compatible `SKILL.md`, but with PalWakf metadata extensions.

Minimal V1 skill package:

`skills/waqf-source-validation/`
- SKILL.md
- references/palwakf-source-authority-policy.md
- evals/

`skills/waqf-judgment-structure/`
- SKILL.md
- references/judicial-role-taxonomy.md
- evals/

`skills/waqf-statutory-interpretation/`
- SKILL.md
- references/ottoman-land-code-structure.md
- evals/

`skills/waqf-citation-integrity/`
- SKILL.md
- evals/

`skills/waqf-hallucination-red-team/`
- SKILL.md
- evals/

These are ADAPTED skills, not blind copies.

## Runtime integration policy

Skills are advisory/procedural layers.
They may:
- shape extraction/review workflow
- add deterministic checks
- provide evaluation rubrics
- trigger fail-closed states

They may not:
- override source evidence
- self-authorize network/cloud access
- change authority hierarchy unilaterally
- promote learning to sovereign knowledge
- bypass deterministic verification gates
- cause main/production mutation

## A/B acceptance design

A/B compares the same model, same evidence, same output budget, same hardware.

A = WITHOUT_SKILL:
generic legal review instruction.

B = WITH_ADAPTED_SKILL:
compact guidance distilled from Source Validation + Citation Integrity + Case Brief + Statutory Interpretation + Hallucination Red-Team.

Evaluation uses seeded defects with deterministic ground truth.

Required defect classes:
1. ARTICLE_2_ARTICLE_4_CONFLATION
2. HASEKI_CLASSIFICATION_OVERCLAIM
3. HISTORICAL_2014_1552_CONFLATION
4. CITATION_SOURCE_MISMATCH
5. PARTY_ARGUMENT_AS_COURT_REASONING
6. UNSUPPORTED_AUTHORITY_OR_FACT

Metrics:
- defect recall
- false positives
- source-grounding compliance
- invalid citation rate
- completion latency
- prompt/output token cost

Promotion rule:
A candidate skill is admitted only if it improves correctness/coverage or materially improves process discipline without unacceptable latency/context cost.

## Decision

STATIC_REVIEW = PASS_WITH_ADAPTATION
RAW_UPSTREAM_INSTALL = REJECTED
ADAPTED_SKILL_PATH = APPROVED_FOR_A_B_ONLY
PRODUCTION_ADMISSION = NOT_YET_GRANTED
NEXT = RUN_WITHOUT_SKILL_VS_WITH_ADAPTED_SKILL_A_B_EVAL

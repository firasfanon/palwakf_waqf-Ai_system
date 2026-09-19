# WAQF AI Skills Candidate Review V1

Status: REVIEW_ONLY / NO_SKILL_INSTALLED / NO_RUNTIME_ADOPTION

## Scope

This review runs in parallel with the Haseki Sultan benchmark. It does not replace, weaken, or bypass the benchmark acceptance gates.

Current benchmark path:
Verified Evidence Pack -> Final Synthesis -> Citation Audit -> Semantic Answer Audit -> PASS/FAIL.

## Candidate 1 — AgentCounsel legal methodology

Repository: `tynbtynb/agentcounsel`
Pinned review commit: `685f92a98395f3764fc4c734db57f43dd1f8e678`
License reported by repository: MIT
Adoption posture: SELECTIVE_VENDORIZING_ONLY; do not import the whole repository.

High-value candidate skills:

- `skills/legal-methodology/source-validation/SKILL.md`
  - Claim-by-claim support classification.
  - Explicitly forbids model background knowledge as a verification source.
  - Strong fit for Waqf AI evidence verification.
- `skills/legal-methodology/citation-integrity-check/SKILL.md`
  - Citation/quotation/authority integrity workflow.
  - Strong fit for the final citation audit.
- `skills/legal-methodology/statutory-interpretation/SKILL.md`
  - Structured parsing of provisions and competing readings.
  - Useful as a methodological layer, but PalWakf must supply Ottoman/Palestinian law-specific rules.
- `skills/legal-methodology/hallucination-red-team/SKILL.md`
  - Origin/support classification and unsupported-claim red-team.
  - Strong fit as a post-synthesis verification pass.
- `skills/legal-research/case-brief/SKILL.md`
  - Explicit Holding / Reasoning / Dicta separation.
  - Strong fit for preventing party-ground -> court-reasoning conflation.
- `skills/legal-research/authority-synthesis/SKILL.md`
  - Multi-authority rule synthesis with contradictions and temporal confidence.
  - Useful for larger legal questions after the current benchmark.

Core rule candidate:
- `core/source-and-citation-discipline.md`
  - “Never invent legal authority”; provided/researched/model-knowledge separation.

Initial decision: STRONG_CANDIDATE_FOR_ADAPTATION.
Reason: the selected assets are Markdown-native workflows, close to the controls Waqf AI already proved useful. They are not a substitute for Waqf/Ottoman ontology or Palestine-specific authority hierarchy.

## Candidate 2 — Agent Skills open standard

Repository: `agentskills/agentskills`
Pinned review commit: `69ef37e9424c0a7ea9dd2293b559e43ec8176379`
License: Apache-2.0 for code; documentation CC-BY-4.0.
Initial decision: STRONG_CANDIDATE_AS_SKILL_PACKAGE_FORMAT.

Reason:
- Standard `SKILL.md` folder format.
- Supports scripts/references/assets.
- Progressive disclosure reduces context cost.
- Portable across skill-compatible agents.

This is a packaging/interoperability standard, not a legal reasoning skill.

## Candidate 3 — NVIDIA SkillEvaluator

Repository: `NVIDIA/SkillEvaluator`
Pinned review commit: `ac0a04905100acdafc6c95829311a9739c340ff6`
Release noted by commit: v0.3.0 preparation.
License: Apache-2.0.
Initial decision: STRONG_CANDIDATE_FOR_EVALUATION_TOOLING / NOT_YET_INSTALLED.

Relevant capabilities:
- Deterministic validation gates.
- Security / PII / license / quality / Unicode / script checks.
- Deduplication/context-overlap checks.
- Tier-3 live skill evaluation and with-skill / without-skill comparison.
- Supports local OpenAI-compatible endpoints.

Constraints:
- Full validation can require external scanners and optional provider credentials.
- Do not enable paid/cloud providers automatically.
- Run local/keyless deterministic checks first.

## Candidate 4 — SlowMist Agent Security Skill

Repository: `slowmist/slowmist-agent-security`
Pinned review commit: `0718ece96b8acb121466874d111fe80d41971a57`
License: MIT.
Initial decision: CANDIDATE_FOR_PRE_INSTALL_SECURITY_REVIEW.

Relevant capabilities:
- Skill/MCP installation review.
- GitHub repository review.
- Prompt-injection / social-engineering / supply-chain patterns.
- Risk tiers and human-approval gates.

Use:
Run as a review methodology before importing any external skill. Do not treat repository popularity as trust.

## Deferred candidate — SkillsBench

Repository: `benchflow-ai/skillsbench`
Pinned review commit: `9a1f4dd5f7659f75707435da3ce854b6e48321d1`
License: Apache-2.0.
Status: DEFERRED_OPTIONAL.

Reason:
Useful for broad skill benchmarking, but NVIDIA SkillEvaluator is currently the tighter fit for PalWakf’s immediate skill-admission gate. Avoid adding overlapping evaluation infrastructure before need is demonstrated.

## Proposed PalWakf admission sequence

1. Pin exact repository commit.
2. Inspect only the candidate skill files and directly referenced core files.
3. License verification.
4. Static security review.
5. No code execution from untrusted skill packages before review.
6. Adapt to Waqf AI terminology without weakening source discipline.
7. Add deterministic tests.
8. Run Haseki benchmark WITH and WITHOUT the candidate skill.
9. Measure correctness, citation integrity, semantic retention, latency, and token/context cost.
10. Promote only if the candidate improves the verified task and introduces no governance/security regression.

## Not covered by external skills

External skills do not replace the PalWakf-specific layer:

- Ottoman Land Code structure and terminology.
- `waqf sahih` vs `waqf takhsisat / irsadi` ontology.
- Palestinian legal-source hierarchy and court/jurisdiction nuances.
- Haseki Sultan / Ottoman archival entity reconciliation.
- PalWakf claim schema, sovereign knowledge promotion, and Mind/Workspace governance.

These remain PalWakf-native capabilities.

## Current decision

SKILLS_INSTALLATION = NO
SKILLS_CANDIDATE_REVIEW = ACTIVE
BENCHMARK_AUTHORITY = PRIMARY
NEXT_SKILLS_ACTION = SELECT_MINIMAL_AGENTCOUNSEL_SET + STATIC_REVIEW + A/B_EVAL_AFTER_CURRENT_BATCH

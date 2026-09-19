# WAQF AI — Skills / Knowledge / Lessons Update — 2026-09-20

## Status

PROJECT_LEARNING_CLOSEOUT = PASS
GLOBAL_PROMOTION = PENDING_MIND_WORKSPACE_DECISION
WAQF_AI_SELF_PROMOTION = FORBIDDEN

## New adapted skill candidate

`waqf-legal-evidence-assurance`

The candidate packages five externally informed methodology areas into one PalWakf-native deterministic-first assurance skill:
- source validation
- statutory interpretation
- judicial-role classification
- citation integrity
- hallucination/overclaim red-team

Raw AgentCounsel skills are not installed. Upstream provenance is pinned and retained in the skill reference file.

## Knowledge updates

The project now treats the following as verified operational knowledge:
- instrument + provision binding is mandatory
- semantic required-evidence selection supersedes “cite every retrieved source”
- claim-to-source ownership is mandatory
- deterministic-first synthesis is preferred for direct legal propositions
- court-role classification is fail-closed
- legal qualifiers cannot be silently compressed away
- local 3B model use must be bounded and audited
- hardware changes invalidate capability cache/benchmark assumptions
- project learning does not equal canonical promotion

## Errors converted to learning

### Error: Article-number overfitting
Cause: benchmark-specific logic treated “Article 2” as Ottoman Land Code Article 2 even when the question referred to Sharia Procedure Article 2.
Repair: legal instrument + article binding and instrument-specific extraction.
Preventive gate: LEGAL_INSTRUMENT_PROVISION_BINDING_GATE.

### Error: all-retrieved-sources citation requirement
Cause: retrieval coverage was mistaken for semantic evidence requirement.
Repair: `requiredEvidenceSourceIndexes`.
Preventive gate: REQUIRED_EVIDENCE_SELECTION_GATE.

### Error: party argument leakage
Cause: generic court body markers were insufficient for judgment variants.
Repair: expanded court-body markers + direct court reasoning extraction + party leak audit.
Preventive gate: PARTY_VS_COURT_ROLE_GATE.

### Error: prompt-only skill admission
Cause: external workflow prose was loaded into a 3B model and trusted as reviewer.
Repair: deterministic adapter derived from methodology principles.
Preventive gate: SKILL_TO_DETERMINISTIC_CONTROL_GATE.

### Error: citation syntax passed while proposition ownership could fail
Repair: legal skill adapter checks semantic claim/source ownership.
Preventive gate: CLAIM_TO_SOURCE_CITATION_OWNERSHIP_GATE.

### Error: stale hardware capability assumptions
Cause: GTX 1050 was added after initial CPU benchmarks.
Repair: GPU identity/VRAM included in hardware fingerprint; benchmarks rerun.
Preventive gate: HARDWARE_FINGERPRINT_INVALIDATION_GATE.

## Current proof

- targeted test files: 5 PASS
- targeted tests: 31/31 PASS
- TypeScript check: PASS
- git diff --check: PASS
- original Haseki E2E: PASS after generalization
- broader live E2E 3/3: PASS
- citation/semantic/legal-skill audits: PASS on all four live benchmark questions

## Governance conclusion

The evidence supports project-proven and domain-scoped canonical candidacy.
It does not prove that this is a universal skill for every PalWakf project.

Recommended scope:
`WAQF_LEGAL_RESEARCH_HIGH_ASSURANCE`

Next:
`GLOBAL_SKILL_ADMISSION_DECISION_PACKAGE -> MIND_REVIEW -> WORKSPACE_DECISION`

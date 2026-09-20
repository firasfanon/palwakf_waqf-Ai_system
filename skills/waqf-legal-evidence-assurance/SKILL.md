---
name: waqf-legal-evidence-assurance
description: Use for high-assurance waqf legal research to validate source roles, bind provisions to the correct legal instrument, preserve qualifiers, audit claim-to-source citations, reject unsupported legal assertions, and fail closed when evidence is insufficient.
---

# Waqf Legal Evidence Assurance

## Purpose

Apply a deterministic-first legal evidence workflow before accepting any waqf legal answer.

This skill is an adapted PalWakf skill. It is not a verbatim installation of an external skill and it does not grant execution, network, filesystem, database, production, or canonical-promotion authority.

## Required workflow

1. **Source validation**
   - Every material proposition must trace to verified source text.
   - Model memory is not verification.
   - Retrieved sources are not automatically required citations; determine semantic evidence requirements from the question.

2. **Instrument + provision binding**
   - Bind an article number to the correct legal instrument before interpreting it.
   - Never transfer content from one article or statute to another because the number matches.
   - Preserve conditions, exceptions, qualifiers, jurisdiction, and temporal scope.

3. **Judicial role classification**
   - Separate party grounds/pleadings from court facts, reasoning, holding, and disposition.
   - Do not attribute a party allegation to the court.
   - Do not extend a case-specific holding to another parcel, waqf, or entity without source support.

4. **Citation integrity**
   - A citation is valid only when the cited source supports the proposition on that line/claim block.
   - Number-range validity alone is insufficient.
   - Historical dates, legal classifications, and right types require proposition-to-source ownership.

5. **Hallucination / overclaim red-team**
   - Reject invented authorities, dates, documents, or classifications.
   - Distinguish established source facts from analytical inference, contested points, and unresolved points.
   - A registry label does not automatically prove a legal classification.

6. **Deterministic-first synthesis**
   - Render direct legal/statutory/historical propositions from verified evidence when no inference is needed.
   - Use an LLM only for bounded synthesis or qualification that genuinely requires language reasoning.
   - Re-audit the final answer after synthesis.

7. **Fail closed**
   - If required evidence is missing, conflicting, role-ambiguous, or citation ownership fails, return an explicit unresolved state.
   - Never fill the gap from model memory.

## PalWakf authority boundary

- Experience capture may be automatic.
- Learning candidate derivation may be automatic.
- Skill/knowledge promotion is controlled by Mind Assistant and Workspace Manager.
- Waqf AI may not self-promote this skill or expand its own authorization.
- More restrictive policy wins.

## Current implementation bindings

- `server/evidenceDistillation.ts`
- `server/legalSkillAdapter.ts`
- `server/legalEvidenceSynthesis.ts`
- `server/researchOrchestrator.ts`
- `server/legalRegressionCorpus.ts`

## Admission evidence

See:
- `evals/ADMISSION_EVIDENCE.md`
- `references/PROVENANCE_AND_AUTHORITY_POLICY.md`

Current project status: **ACTIVE_CANONICAL_DOMAIN** after Mind review and Workspace sovereign approval. Runtime use remains project/task-authorized and does not imply universal auto-loading or expanded execution authority.

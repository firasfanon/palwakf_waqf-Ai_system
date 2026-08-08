
---

## 2026-07-06 — MEGA_BATCH_AR1_SOURCE_PROVENANCE_RIGHTS_OPERATIONAL_UX_REFINEMENT_V1

- Reordered `/knowledge#/admin/source-provenance-rights` around the actual operator priority: `C3 → C4 → candidate eligibility → internal-use/rights acknowledgment → AR1 session`.
- Added an explicit current-action card and a stateful RTL readiness stepper.
- When C3/C4 evidence is absent, the page directs the operator to C3 then C4 instead of presenting a disabled AR1 session form.
- When C3/C4 are complete but `C4 linkable materials = 0`, the page marks candidate eligibility as the current step and explains that only a direct C4 material reference or exact normalized-title/canonical-URL match can unlock the next stage.
- AR1 remains fail-closed: no session form before a deterministic eligible material exists; no fuzzy, semantic, vector, author-only, or publisher-only matching; no source, rights, document, chunk, embedding, vector, Chat, release, or production mutation.
- Local static verification, apply verification, and browser UAT were accepted. This is a local-only acceptance; Staging and Production remain unapproved.

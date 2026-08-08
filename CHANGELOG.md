# CHANGELOG

## Mega Batch C1 — Legacy Manus Provenance Recovery and Evidence Reconciliation
- Added a read-only legacy Manus provenance evidence surface for `assistant.legacy_import_register.payload_json`.
- Added raw evidence extraction for source, source URL, PDF URL, author, publisher, technical fetch source identifier, and evidence paths.
- Added candidate-only reconciliation with current references; no source, rights, citation, review, Chat, RAG, or lifecycle records are modified.
- Added read-only Staging SQL discovery files that start with `begin transaction read only;` and end with `rollback;`.

---

# CHANGELOG

## Reconciliation after Sidebar Accordion
- Merged the verified current `package.json` with both verifier scripts.
- Preserved `verify:admin-sidebar-usage-category-accordion`.
- Added `verify:mega-batch-c-source-provenance-rights`.
- Corrected the unsupported registry `dataState` literal to `connected`; operational write gating remains in runtime/SQL checks.
- No source data, SQL, RLS, lifecycle, or production changes were executed.

---

## Mega Batch C2 — Autonomous Provenance Audit and Final Disposition
- Added a read-only, deterministic C2 service that groups legacy Manus provenance evidence into operational clusters instead of requiring row-by-row review.
- Added bounded final dispositions for official, academic, general URL, author-only, title-only, technical-marker, invalid/test URL, ambiguous, and no-evidence clusters.
- Added an admin audit dashboard under the existing Source Provenance & Rights page.
- Every C2 disposition preserves raw evidence while blocking source-link writes, rights assignment, and Chat/RAG release.
- Added a static verifier and optional read-only Staging audit SQL; no write SQL is included.

---

## Mega Batch C3 — Autonomous External Source Verification and Final Release Matrix
- Added an operator-triggered, bounded C3 external metadata verifier for C2 official, academic, and general URL candidates.
- C3 checks public DNS safety and HTTP status/headers only; redirects are not followed and page/PDF bodies are not read or retained.
- Added a final release matrix that classifies reachable official/academic metadata candidates, unavailable or restricted URLs, redirects, and safety-blocked URLs.
- Every C3 result keeps source-link writes, rights assignment, public display, and Chat/RAG release blocked behind separate gates.
- No SQL, database write, lifecycle change, publication action, or production action is included.

---

## Mega Batch C4 — Controlled Source Registry and Rights Gate Design
- Added a deterministic, read-only controlled-source registry blueprint service derived from C2 clusters.
- Added six staged governance gates for source identity, terms/rights evidence, controlled registry apply, material linking, public display, and Chat/RAG.
- Added a read-only C4 admin design surface that shows proposed registry blueprints without creating source rows or linking materials.
- C4 deliberately does not persist C3 reachability results, create a registry table, execute SQL, write rights data, authorize display, or release Chat/RAG.

---

## Mega Batch C4 Reconciliation — Verified Source Selection and Controlled Knowledge Release Plan
- Reconciled the verified-source selection plan against the actual local C3 baseline captured on 2026-07-04.
- Preserved the existing `controlledRegistryDesign` service, route, verifier, and C4 design surface; added the new `controlledReleasePlan` service and read-only UI surface alongside them.
- Added an ephemeral, 30-minute C3 evidence handoff in process memory only. C4 never triggers DNS/HTTP itself and holds safely when C3 evidence is absent or stale.
- Added a maximum cohort of five technically reachable official metadata/citation candidates; this is planning only, not source creation, linking, rights assignment, full-text retention, public display, Chat/RAG release, promotion, or production.
- No SQL, database write, lifecycle mutation, publication action, or production action is included.



---

## Mega Batch AR1 — Governed Agentic RAG Internal Pilot Vertical Slice
- Added an admin-only, ephemeral Agentic RAG pilot over a maximum of five existing C4-selected knowledge documents.
- The operator must provide session-scoped T3/T4 evidence declarations and internal-use/rights approval references; AR1 does not promote, persist, or infer any rights state.
- Added scoped retrieval, citation identifiers, evidence-only fallback, legal-conclusion escalation, temporary execution trace, and in-memory rollback.
- Text generation is disabled by default and requires `AR1_INTERNAL_PILOT_LLM_ENABLED=1` after confirming a local or approved internal model boundary.
- No SQL, source linking, rights assignment, document copy, chunk/embedding/vector write, public Chat/RAG release, public display, or production action is included.

## 2026-07-04 — MEGA_BATCH_AR1_TYPESCRIPT_COMPILE_GATE_CORRECTION

- Corrected `TS2367` in `server/governedAgenticRagPilot.ts`: the post-retrieval branch can only return `answer` or `escalate`; the audit event now records escalation as `escalated` instead of checking an unreachable `abstain` branch.
- Added a static verifier assertion for the distinct escalation audit event.
- No change to corpus scope, source/rights boundaries, persistence, external access, Chat/public release, or production authorization.


## 2026-07-04 — MEGA_BATCH_AR1_CORPUS_RESOLUTION_AND_INTERNAL_PILOT_ACTIVATION
- Added a deterministic, ephemeral AR1 corpus resolver for current C4-selected cohorts.
- Resolution is limited to an existing C4 knowledge-document material reference or exact normalized title / exact canonical URL only.
- No fuzzy, semantic, vector, author-only, or publisher-only matching is allowed.
- Resolver output remains an explicit operator selection list and never writes source links, rights, documents, chunks, embeddings, vectors, or chat-release state.
- AR1 session trace now records the resolution method without retaining document bodies.

---

## 2026-07-06 — MEGA_BATCH_AR1_SOURCE_PROVENANCE_RIGHTS_OPERATIONAL_UX_REFINEMENT_V1

- Reordered `/knowledge#/admin/source-provenance-rights` around the actual operator priority: `C3 → C4 → candidate eligibility → internal-use/rights acknowledgment → AR1 session`.
- Added an explicit current-action card and a stateful RTL readiness stepper.
- When C3/C4 evidence is absent, the page directs the operator to C3 then C4 instead of presenting a disabled AR1 session form.
- When C3/C4 are complete but `C4 linkable materials = 0`, the page marks candidate eligibility as the current step and explains that only a direct C4 material reference or exact normalized-title/canonical-URL match can unlock the next stage.
- AR1 remains fail-closed: no session form before a deterministic eligible material exists; no fuzzy, semantic, vector, author-only, or publisher-only matching; no source, rights, document, chunk, embedding, vector, Chat, release, or production mutation.
- Local static verification, apply verification, and browser UAT were accepted. This is a local-only acceptance; Staging and Production remain unapproved.



## 2026-07-06 — Baseline Closure V1.2 Literal Verifier Fix

- استبدال فحص مؤشرات AR1 المجمع الذي أعطى False Negative بفحوص حرفية مستقلة وقابلة للتفسير.
- إضافة Error Record لانحراف verifier وإعادة إصدار baseline Revision `R1`.
- لا تغيير وظيفي في `SourceProvenanceRightsRegistry.tsx`، ولا SQL، ولا تفعيل طبقة الحقوق، ولا Chat/Release أو Staging/Production.



## 2026-07-06 — MEGA_BATCH_AR1_SINGLE_FLOW_ORCHESTRATION_AND_OPERATOR_CLARITY_V1 Baseline Closure

- قبول محلي لدفعة المسار الموحد بعد `STATIC_VERIFIER=PASS` وUAT متصفح مقبول.
- توثيق أن مسار زر واحد ينفذ C3 ثم C4 ثم فحص أهلية حتمي في العملية الخادمية نفسها.
- توثيق حالة C4 الحالية: صفر مواد قابلة للربط؛ لا جلسة ولا خطوة تشغيلية إضافية.
- حفظ أدلة UAT وSession Handoff وBaseline Acceptance وError Record لمسار حزمة التحقق.
- لا SQL، ولا تفعيل حقوق، ولا Chat/Release، ولا Staging أو Production.


## 2026-07-12 — MEGA_BATCH_AR1_C4_DIRECT_KNOWLEDGE_DOCUMENT_METADATA_EXACT_LOOKUP_REPAIR_V1

- Added an exact, read-only UUID lookup against `assistant.knowledge_documents.id` for current C4 `knowledge_document` materials.
- The direct resolver bypasses the composite companion-table bundle gate, so a failure in sources, references, files, or citations no longer hides an existing C4 knowledge document row.
- Invalid or non-UUID identifiers are rejected before a remote query; resolution remains equality-only with no title, URL, fuzzy, semantic, embedding, or vector fallback.
- AR1 now tries the exact sovereign UUID lookup before legacy/composite fallback and preserves that UUID as the primary session document identifier.
- Added a dedicated static verifier, Arabic contract/UAT/state documents, and an Error Record.
- Static verification passed. Targeted TypeScript pre/post comparison introduced no new errors; two unrelated pre-existing errors remain in `server/legacyManusProvenance.ts`.
- Runtime UAT and baseline promotion remain pending. No SQL, database write, source link, rights assignment, Chat/RAG release, public release, or production action was performed.

---

## 2026-07-12 — MEGA_BATCH_AR1_C4_DIRECT_KNOWLEDGE_DOCUMENT_METADATA_EXACT_LOOKUP_REPAIR_V1 — Runtime Acceptance and Baseline R3 Promotion

- Applied the exact read-only `assistant.knowledge_documents.id` lookup patch to the user workspace and independently verified every postimage hash.
- Repaired the local `node_modules` installation with project-pinned `pnpm@10.4.1`; `tsx v4.20.6` became executable without changing `package.json` or `pnpm-lock.yaml`.
- Local read-only Runtime UAT passed: C3 completed 30 checks with `noDatabaseWrite=true`; C4 returned `READY_FOR_OPERATOR_BINDING`, two candidates, and two direct C4 material references.
- Both candidates resolved through `C4_DIRECT_MATERIAL_REFERENCE` and recorded `runtimeRepository.assistant_knowledge_documents_uuid_exact_lookup` in resolution evidence.
- AR1 remained unstarted (`activeSessions=0`), operator confirmation remained required, and LLM generation remained disabled.
- Promoted Baseline R3 to `ACCEPTED_LOCAL_ONLY`.
- No SQL, database write, source link, rights assignment, document/chunk/embedding/vector write, public Chat/RAG release, public release, or production authorization occurred.

---

## 2026-07-12 — MEGA_BATCH_AR1_DETERMINISTIC_CANDIDATE_REVIEW_AND_EPHEMERAL_SESSION_AUTHORITY_PREP_V1

- Added a distinct operator-bound authority preparation stage before AR1 session creation.
- Added one-candidate review with T3/T4, internal-use reference, session rights/use reference, mandatory review rationale, and three acknowledgements.
- Added process-memory `AR1A-*` preparation records with a maximum ten-minute TTL bounded by current C3 evidence expiry.
- Added authority fingerprinting, operator mismatch protection, status read, and revocation.
- Changed `startSession` to require an `authorityPreparationId` and revalidate the candidate against the current C4 selected cohort before consumption.
- Added admin routes for preparation, status, and revocation.
- Updated the UI to prepare authority without starting a session and mechanically disabled session start pending separate authorization.
- Added static verifier, UAT contract, state document, and Error Record.
- No SQL, database write, source link, rights assignment, document/chunk/embedding/vector write, model invocation during preparation, public release, or production authorization.

---

## 2026-07-13 — AR1 Authority Preparation V1 — Runtime UAT PASS

- Applied and statically verified the governed candidate-review and in-memory authority-preparation layer.
- Prepared one T3-controlled candidate authority for `مهام وزارة الأوقاف والشؤون الدينية الفلسطينية`.
- Runtime response confirmed `process_memory_only`, ten-minute TTL, operator-bound preparation, no database/source/rights writes, and no AR1 session start.
- Explicit revocation returned `status=revoked`, `revoked=true`, `activeAuthorityPreparations=0`, `sessionStarted=false`, `consumedAt=null`, and `sessionId=null`.
- Post-revocation status returned `READY_FOR_OPERATOR_BINDING`, `activeSessions=0`, `activeAuthorityPreparations=0`, and `llmGenerationEnabled=false`.
- Baseline R4 became eligible for local acceptance promotion.
- Separate explicit authorization remains mandatory before any AR1 session start.

---

## 2026-07-13 — MEGA_BATCH_AR1_EXPLICIT_EPHEMERAL_SESSION_START_AND_EVIDENCE_ONLY_RUNTIME_UAT_V1 — Built Candidate

- Enabled explicit start of one operator-bound ephemeral AR1 session after a valid authority preparation.
- Added a hard evidence-only session mode, one-question limit, mandatory UAT reference, and explicit start acknowledgements.
- The server rejects evidence-only UAT start when LLM generation is enabled.
- The question path remains evidence-only for the life of the session and blocks a second question.
- The UI now enables the start button only after the explicit runtime acknowledgements.
- Rollback remains mandatory and clears the session from process memory.
- No database/source/rights/document/chunk/vector/public/production mutation was added.
- Runtime UAT remains pending.

---

## 2026-07-13 — AR1 Evidence-only Runtime UAT PASS

- Started one explicit operator-authorized ephemeral AR1 session.
- Bound one C4-selected T3 knowledge document by direct material reference.
- Executed exactly one evidence-only question.
- Returned one citation-bound internal answer with `llmGenerationUsed=false`.
- Confirmed zero database and source/rights writes.
- Confirmed public and chat release remained blocked.
- Applied rollback successfully; final status showed zero active sessions and zero active authority preparations.
- Manual browser evidence for a second-question attempt was not captured; the server negative gate remains covered by the accepted functional isolated test and the UI disabled repeat submission after the first result.
- Baseline R5 is ready for local acceptance promotion.

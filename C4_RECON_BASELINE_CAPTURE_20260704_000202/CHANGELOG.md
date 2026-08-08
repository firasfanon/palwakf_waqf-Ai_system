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

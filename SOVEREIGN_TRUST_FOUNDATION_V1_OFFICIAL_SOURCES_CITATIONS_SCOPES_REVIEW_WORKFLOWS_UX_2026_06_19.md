# Sovereign Trust Foundation v1 — PalWakf AI

**Baseline parent:** v57 — Knowledge Batch 08

**Batch nature:** Assistant-only sovereign trust implementation and operator-apply pack.

**Decision:**

```text
SOVEREIGN_TRUST_FOUNDATION_V1_CODE_AND_OPERATOR_APPLY_PACK_IMPLEMENTED
LIVE_SUPABASE_APPLY_PENDING
HUMAN_SOURCE_AND_CITATION_VERIFICATION_PENDING
SCOPED_PERMISSION_RUNTIME_FAIL_CLOSED_FOR_NON_PUBLIC_CONTENT
PAGE_BINDING_AND_BROWSER_UAT_PENDING
PRODUCTION_NOT_APPROVED
```

## Objective

Establish the implementation backbone for the following institutional equation:

```text
Official sources
+ verified citations
+ scoped permissions
+ human review
+ useful workflows
+ calm usable interface
= trustworthy Waqf AI platform
```

## 1. Official sources

The canonical source remains under `assistant.knowledge_sources` and `assistant.reference_documents`.

New controlled states:

- `verification_status`: `pending | verified | rejected | expired`.
- `official_registry_key`: optional immutable registry key for a source-of-truth register.
- `review_required`: a source cannot silently become production-trusted because it was copied from legacy data.

**Rule:** importing a record, or setting `authority_level='official'`, is not evidence of human verification. A documentary source, issuer and effective-date check is still required.

## 2. Verified citations

Citation lifecycle is explicit:

```text
missing → linked → verified
                 ↘ rejected
```

- `linked`: a citation relationship exists but its locator/excerpt is not yet human-verified.
- `verified`: a reviewer confirms the locator/excerpt against the retained canonical reference.
- `rejected`: the citation cannot be relied on and must not ground user-facing answers.

The retrieval code now labels reference cards using the actual lifecycle state; it does not claim that every legacy citation is verified.

## 3. Scoped permissions

`assistant.knowledge_scope_assignments` is introduced as the per-user scope registry. Supported access levels are:

```text
read | review | publish | admin
```

The runtime resolves `assistant.internal`, `assistant.restricted` or `assistant.all` only where a matching active assignment exists. Before the table is applied or an assignment exists, non-public content is denied to non-privileged users.

The SQL enables RLS on the new scope/task/access tables and intentionally grants no direct `anon` or `authenticated` access. Current server/service-role access remains the approved runtime path.

## 4. Human review

`assistant.knowledge_review_tasks` turns abstract review requirements into explicit queue work:

- source verification;
- citation verification;
- content classification;
- human approval;
- scope assignment;
- publication review.

The backfill opens task rows for legacy citations, unverified sources and quarantined fixtures. Review tasks are idempotent through `dedupe_key`.

## 5. Useful workflows

The batch implements the minimum workflow backbone:

```text
Legacy / new source
  → source verification task
  → retained reference document
  → linked citation
  → citation verification task
  → knowledge review / scope decision
  → chat retrieval candidate
  → access event / quality feedback
```

New server read models:

- `knowledgeTrust.snapshot`
- `knowledgeTrust.reviewQueue`

These are administrative read-only views used to expose the current trust backlog. Page binding and CRUD UI for the workflow are intentionally deferred to Knowledge Batch 09, after the database application evidence is accepted.

## 6. Calm, usable interface

The assistant chat reference display now distinguishes:

- source authority tier;
- citation state (`verified` vs `linked` vs incomplete);
- the existing reference title, file, locator and excerpt.

This is deliberately compact: trust indicators appear where the user consumes evidence, rather than turning the chat surface into an administrative dashboard.

## Retrieval policy now enforced in code

For user-facing chat retrieval, the runtime filters out any record that is:

- not `approved`;
- not chat eligible;
- missing/rejected citation links;
- classified as `test`, `duplicate` or `quarantined`;
- outside the actor’s permitted visibility scope.

Linked citations remain eligible but are labelled as linked, not verified. Verified citations receive a ranking boost. This avoids misleading claims while still allowing the existing KB05 evidence base to be usable during the human verification queue.

## Out of scope / still blocked

- No live Supabase DDL/DML was executed in this environment.
- No source or citation was automatically marked `verified`.
- No page binding/CRUD workflow UI is asserted complete.
- No browser evidence, RLS negative UAT, remote staging evidence or production promotion is accepted.

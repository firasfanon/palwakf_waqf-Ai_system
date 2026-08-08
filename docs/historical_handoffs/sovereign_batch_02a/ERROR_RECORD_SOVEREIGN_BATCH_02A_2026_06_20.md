# Error / Governance Record — Sovereign Batch 02A

## Trigger
The existing review surface exposed only task identifiers and did not offer a bounded case file. It also lacked a controlled completion path for `content_classification` and did not require an explicit reviewer claim before source/citation verification.

## Decision
Treat this as a workflow-integrity gap. Do not execute the three-task sample against blind identifiers.

## Containment
- All mutations remain server-side through service-role RPCs.
- Browser direct access remains blocked by existing RLS/ACL.
- Classification resolution cannot promote content or make chat eligible.
- Release UI is absent from this phase.

## Status
`SOVEREIGN_BATCH_02A_PREAPPLY_ONLY` — no SQL was applied and no human-review task was mutated while constructing this package.

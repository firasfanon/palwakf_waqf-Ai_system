# Session Handoff — Sovereign Batch 02A

## Accepted prior state
- Route Runtime Closure is locally verified under `/knowledge#/admin/...`.
- `assistant.review` scope is available to the current reviewer.
- No official knowledge release has begun.

## Current pre-apply pack
`SOVEREIGN_BATCH_02A_CONTROLLED_HUMAN_REVIEW_CASE_CONTEXT_AND_CONTAINMENT_EXECUTION`

## Apply only after local code validation
1. Apply the PowerShell copy script.
2. `pnpm.cmd run check`
3. `pnpm.cmd run build`
4. SQL apply then SQL read-only verification.
5. Run one controlled sample each for classification/source/citation.

## Non-negotiable gates
- No `assistant.publish` use.
- No KB08B mapping action.
- No chat release.
- Stop on any task context mismatch or scope error.

## Current decision
`PRODUCTION_NOT_APPROVED`.

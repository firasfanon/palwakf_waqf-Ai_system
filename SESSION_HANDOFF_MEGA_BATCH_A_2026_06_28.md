# Session Handoff — Mega Batch A

## Governing status

```text
ASSISTANT_GOVERNANCE_FOUNDATION_VERIFIED
MEGA_BATCH_A_CANDIDATE_PREPARED_NOT_APPLIED
MEGA_BATCH_B_AND_C_NOT_STARTED
PRODUCTION_NOT_APPROVED
```

## Candidate code changes

- `server/assistantMaturityPolicy.ts`
- `server/runtimeRepository.ts`
- `server/knowledgeOperations.ts`
- `server/routers.ts`
- `server/_core/siteSettingsRouter.ts`
- `client/src/pages/admin/KnowledgeReviewOperations.tsx`
- `client/src/components/ui/dialog.tsx`

## Operator sequence

1. Apply package script.
2. Run `pnpm.cmd run check` and `pnpm.cmd run build`.
3. Run preflight SQL.
4. Apply narrow claim/containment SQL only after the code is built.
5. Run post-apply SQL verification.
6. Browser preflight: open one case without saving a decision.
7. Execute the three-task controlled sample only after Browser preflight acceptance.

## Prohibitions

- Do not use `assistant.publish`.
- Do not execute `resolveMapping` / KB08B mapping.
- Do not change KB09 bindings.
- Do not mark any content chat eligible.
- Do not approve production.

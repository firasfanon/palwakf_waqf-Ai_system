# PALWAKF Platform Comprehensive Guide — v65.1 Patch Addendum

## Mega Batch 29A v65.1 — RAG compile blocker correction

- A local `pnpm.cmd run check` run exposed `TS2339` in `server/rag.ts:440`.
- Cause: `KnowledgeDocument` has no direct `authorityLevel` property in the Drizzle legacy type.
- Patch: use `doc.trust?.authorityLevel ?? assessKnowledgeTrust(doc).authorityLevel`.
- Status: source patch prepared; no remote deployment evidence, no database change, and no production promotion.
- Next gate: `pnpm.cmd run check` and `pnpm.cmd run build` must both succeed before Mega Batch 29A remote staging deployment/UAT.

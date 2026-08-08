# Session Update — Review + Approval Trace Patch

## What changed
- Added review/approval status fields and trace support for knowledge documents in local runtime.
- Merged assistant DB-first reads with local/db fallback knowledge documents instead of hiding local documents completely.
- Added admin-only review endpoints:
  - `knowledge.adminList`
  - `knowledge.reviewTrace`
  - `knowledge.setReviewStatus`
- Updated ManageKnowledge to:
  - show status, approval version, last review
  - filter by review status
  - open a review dialog and save review status
  - disable edit/delete/review for assistant DB read-only docs
- Updated KnowledgeDetails to show approval metadata and review trace.
- Updated DocumentFilesManager to work with string/number ids and remain read-only for assistant DB docs.

## Files changed
- `server/localRuntimeStore.ts`
- `server/runtimeRepository.ts`
- `server/routers.ts`
- `client/src/pages/ManageKnowledge.tsx`
- `client/src/pages/KnowledgeDetails.tsx`
- `client/src/components/DocumentFilesManager.tsx`

## Intent of this patch
Create a clear path:
Source -> Review -> Approval -> Chat Usage

Public `knowledge.list` continues to expose only active/approved docs, while admin workflows can now inspect draft/review_only/rejected states and a review trace.

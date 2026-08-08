# Session Update — ManageKnowledge Patch v27

## Scope
Localized patch on `client/src/pages/ManageKnowledge.tsx`.

## Closed items
- Added visible status filter in UI
- Removed duplicate invalidate in review mutation
- Hardened read-only detection through storage-kind helper
- Fixed dialog close/reset flows via closeDialog/closeReviewDialog
- Changed editingId checks to `editingId !== null`
- Corrected TableSkeleton columns to 8
- Added lightweight review-workspace summary cards
- Kept patch localized to ManageKnowledge only

## Baseline
This full package is based on:
- `waqf_ai_model_hybrid_llm_admin_v26_review_grounding_smarttools_full.zip`

with `ManageKnowledge.tsx` replaced by the patched version.

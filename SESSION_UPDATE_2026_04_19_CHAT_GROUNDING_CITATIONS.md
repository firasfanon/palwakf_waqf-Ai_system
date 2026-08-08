
# Session Update — Chat Grounding + Citations Patch

## What changed
- Grounding references are now built from `assistant.knowledge_documents` plus linked `reference_documents`, `reference_files`, and `knowledge_citations`.
- Retrieved context now prioritizes citation excerpts and adds numbered `[مرجع n]` metadata into the prompt context.
- System prompt now instructs the model to cite using `[مرجع 1]`, `[مرجع 2]` and include a short references section.
- Assistant message `sources` payload now stores rich grounding references instead of only id/title/score.
- UI `ReferencesDisplay` now shows:
  - المرجع المرقم
  - المصدر/الوثيقة المرجعية
  - الملف المرتبط
  - الموضع locator
  - مقتطف citation excerpt

## Files changed
- server/rag.ts
- server/routers.ts
- client/src/components/ReferencesDisplay.tsx

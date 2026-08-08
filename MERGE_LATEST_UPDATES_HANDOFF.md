# MERGE_LATEST_UPDATES_HANDOFF v5

## What changed

This baseline extends v4 to support **local Chat + Knowledge runtime mode** when the legacy MySQL `DATABASE_URL` is not configured.

## Key local-runtime activation changes

- Added local JSON-backed runtime store support for **document files** in `server/localRuntimeStore.ts`
- Added runtime wrappers for document files in `server/runtimeRepository.ts`
- Added missing `knowledge` router procedures in `server/routers.ts`:
  - `knowledge.uploadPdf`
  - `knowledge.getFiles`
  - `knowledge.addFile`
  - `knowledge.deleteFile`
- `knowledge.uploadPdf` now:
  - decodes base64 input
  - extracts text via `extractTextFromFile(...)`
  - returns a `data:` URL plus extracted text
- `knowledge.addFile` now stores attached PDF metadata/content in the local runtime store when DB is unavailable
- Fixed remaining direct DB dependency in `smartProcessing.processPending` to use runtime wrapper

## Resulting behavior in this phase

- Chat can run without MySQL legacy DB, using local runtime conversations/messages
- RAG can read knowledge documents from seeded local files in the repository
- Knowledge CRUD works in local runtime mode
- PDF upload for knowledge items works in local runtime mode
- Document file attachment listing/add/delete works in local runtime mode
- Platform bridge and auth/users remain as previously configured

## Current phase intent

This baseline is designed for the current project phase where:
- chat must be the first active capability
- knowledge base must be active enough to feed chat
- legacy MySQL persistence is not required yet

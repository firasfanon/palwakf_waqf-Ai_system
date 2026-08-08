# Assistant RBAC / RLS Draft 1 — Notes

## Intent
This draft adds the first conservative RBAC/RLS layer for the assistant schema in Supabase.

## Identity source
This draft uses:
- `public.admin_users`

as the only internal identity source for assistant data access.

It assumes the assistant should not invent a separate identity model.

## Important implementation detail
The helper functions dynamically inspect `public.admin_users` to find likely columns such as:
- `auth_user_id`
- `user_id`
- `open_id`
- `is_active`
- `role`
- `platform_role`
- permission-like columns

This makes the draft more tolerant to naming variance in the current platform table.

## Access tiers in Draft 1

### 1) Active assistant user
A user whose `auth.uid()` maps to an active row in `public.admin_users`.

### 2) Assistant manager
A conservative higher-access user:
- superuser-like
- platform admin-like
- admin-like
- or someone whose permission-like column contains:
  - `manageUsers`
  - `manageKnowledge`
  - `manageAssistant`

## Policy summary

### System settings
- manager only

### Knowledge sources
- read: active assistant users
- write/delete: managers

### Reference documents
- read: active assistant users
- insert: active assistant users
- update/delete: creator or manager

### Reference files
- read: active assistant users
- insert: active assistant users
- update/delete: managers

### Knowledge documents
- read: active assistant users
- insert: active assistant users
- update/delete: creator or manager

### Knowledge citations
- read: active assistant users
- insert: active assistant users
- update/delete: managers

### Fetched content
- read/insert/update: active assistant users
- delete: managers

### Fetch logs
- read: active assistant users
- write/delete: managers
- service role bypass still applies for server-side jobs

### Classification ratings
- read: active assistant users
- insert: active assistant users
- update/delete: managers

### Review events
- read: active assistant users
- insert: active assistant users
- update/delete: managers

### Conversations
- own rows or manager

### Messages
- rows under own conversation or manager

## What this draft does NOT do yet
- no detailed state-transition enforcement for review lifecycle
- no public/anonymous read policy
- no document-level authority filtering
- no unit-scoped restrictions yet
- no policy split between internal assistant and public chatbot
- no SQL-level approval workflow transitions

## Recommended next step after this draft
- review and approve this policy model
- then implement:
  - unit-scoped restrictions where needed
  - authority-level-aware retrieval rules
  - public-chat-safe read policies (if needed)
  - state-transition hardening for review lifecycle

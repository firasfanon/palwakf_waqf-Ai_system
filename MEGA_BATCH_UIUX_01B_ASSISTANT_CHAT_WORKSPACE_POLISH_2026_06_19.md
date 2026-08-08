# Mega Batch UI/UX 01B — Assistant Chat Workspace Polish + Comfort Density Closure

Date: 2026-06-19
Baseline input: v53 — `MEGA_BATCH_UIUX_01A_HASH_NAVIGATION_HOME_CTA_LOGOUT_FIX_APPLIED_BROWSER_RETEST_REQUIRED`
Baseline output candidate: v54

## Nature

This is a UI/UX polish batch inside the previously approved one-stage Assistant UI/UX interlude.

Scope remains strict:

```text
Assistant-only
UI/UX-only
Light-comfort-first
No governance expansion
No production gate
No database change
No RBAC/RLS change
```

## Trigger evidence

User supplied browser screenshots showing that the light theme was functionally applied but the pages still required polish:

- high visual density,
- strong card borders,
- heavy black/gray divider feeling,
- oversized workspace width,
- cramped quick-question buttons,
- route cards showing long paths without truncation,
- chat workspace and footer not visually integrated enough.

Screenshots copied into:

```text
mega_batch_uiux_01b_evidence/browser_evidence_chat_before_polish_01.png
mega_batch_uiux_01b_evidence/browser_evidence_chat_before_polish_02.png
```

## Implemented changes

### 1. Chat workspace polish

Added scoped classes to the chat page to permit precise styling without affecting DB, governance, or other systems:

```text
assistant-polish-v54
assistant-workspace-v54
assistant-history-panel-v54
assistant-side-header-v54
assistant-main-panel-v54
assistant-chat-header-v54
assistant-start-surface-v54
assistant-start-grid-v54
assistant-start-card-v54
assistant-playbook-card-v54
assistant-composer-v54
assistant-route-link-v54
assistant-floating-action-v54
```

### 2. Comfort density adjustment

- Reduced max workspace width from 1680px to 1500px.
- Reduced horizontal gaps and panel radii.
- Replaced `min-h-screen` workspace behavior with `min-h-[calc(100vh-9rem)]` so Navbar/Footer integration is less heavy.
- Softened card borders from `border-border/70` to `border-border/60` on key chat panels.

### 3. Visual hierarchy refinement

- Softer header surfaces.
- Smaller top header padding.
- Lower shadows and lighter borders.
- Better card content padding through CSS overrides.
- More consistent start-page card treatment.

### 4. Suggested questions wrapping fix

`SuggestedQuestions.tsx` now uses:

```text
suggested-questions-polish-v54
min-h-12
whitespace-normal
leading-6
flex-1 text span
```

This prevents the long Arabic questions from visually clipping or feeling squeezed.

### 5. Route-card polish

Route verification links now use `assistant-route-link-v54` to:

- truncate long technical paths,
- keep labels readable,
- prevent internal URLs from dominating the card.

### 6. Footer/Nav integration

Added scoped `body:has(.assistant-polish-v54)` CSS rules to soften Navbar and Footer only while Assistant chat pages are visible.

## Changed runtime files

```text
client/src/pages/Chat.tsx
client/src/components/SuggestedQuestions.tsx
client/src/styles/admin.css
```

## Decision

```text
MEGA_BATCH_UIUX_01B_ASSISTANT_CHAT_WORKSPACE_POLISH_APPLIED_BROWSER_RETEST_REQUIRED
```

## Acceptance required from browser

Retest these routes:

```text
/knowledge#/chat
/knowledge#/
/knowledge#/search
/knowledge#/knowledge-base
```

Expected visual acceptance:

```text
black-heavy feeling reduced=true
card borders softer=true
quick questions wrap correctly=true
route cards no longer dominate layout=true
workspace feels less dense=true
footer/nav visually integrated=true
```

## Not included

```text
No knowledge import
No chat answer evidence acceptance
No staging evidence acceptance
No RBAC/RLS negative UAT
No production promotion
```

# Error Record — Mega Batch UI/UX 01C

## Error

Suggested question buttons on `/knowledge#/chat` were visually unclear and clicking a question did not produce a visible response in the start surface.

## Cause

1. Visual cause: v54 softened button borders/backgrounds too much; category colors became insufficiently visible.
2. Functional cause: start-surface suggested questions only called `setMessage(question)`. Empty-conversation suggested questions used `setMessage` followed by delayed form submission, which was timing-sensitive.

## Files involved

```text
client/src/components/SuggestedQuestions.tsx
client/src/pages/Chat.tsx
client/src/styles/admin.css
```

## Fix

- Added explicit `type="button"` and category data attributes to suggested question buttons.
- Added v55 contrast CSS for category buttons.
- Rewired suggested question click handlers to call `submitMessageContent(...)` directly.

## Stable baseline after fix

`v55 — Mega Batch UI/UX 01C Suggested Questions Click Response + Contrast Fix`

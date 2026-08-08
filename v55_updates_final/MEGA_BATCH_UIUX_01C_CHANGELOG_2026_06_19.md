# Changelog — Mega Batch UI/UX 01C

## Added

- Dedicated v55 CSS layer for suggested question contrast and hover/focus states.
- `data-suggested-category` attributes for stable legal/jurisprudence/administrative/historical styling.
- Dedicated suggested-question icon wrapper.

## Changed

- Suggested question clicks now call the chat send path directly from `Chat.tsx`.
- Start-surface suggested questions no longer only populate the input field.
- Empty-conversation suggested questions no longer depend on delayed `form.requestSubmit()`.

## Not changed

- No DB.
- No Supabase import.
- No knowledge governance.
- No RBAC/RLS.
- No production approval.

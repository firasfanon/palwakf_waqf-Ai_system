# Knowledge Dialog Overflow Hotfix — 2026-04-23

## Fixed
- Prevented horizontal and vertical overflow in the document detail dialog opened from Knowledge cards.
- Converted the dialog body to a bounded flex layout with internal scrolling.
- Added safe text wrapping for long titles, sources, and content.

## Files changed
- `client/src/pages/Knowledge.tsx`

## Key adjustments
- `DialogContent` now uses a bounded height and width with `overflow-hidden`.
- Inner wrapper uses `flex min-h-0 flex-col` so the scroll region can shrink correctly.
- `DialogHeader` is separated from the scrollable content with a border and padding.
- `ScrollArea` now fills the remaining height via `flex-1 min-h-0`.
- Long text uses `break-words` and `[overflow-wrap:anywhere]`.
- Source link is constrained to the dialog width.

## Result
The Knowledge dialog should now contain long Arabic text, long sources, and large content blocks without text escaping the frame horizontally or vertically.

# WAQF_AI Design Token Registry V1

## Authority

Source: `design-system/tokens/**`

Generated outputs:
- `client/src/styles/generated-design-tokens.css`
- `client/src/lib/designTokens.generated.ts`

Generator: `scripts/design-system/build-tokens.mjs`
Verifier: `scripts/design-system/verify-design-system.mjs`

## Current token sets

### Primitive colors
Brand blue, gold, red; neutral scale; state success/warning/danger/info.

### Primitive dimensions
Spacing: xs, sm, md, lg, xl.
Radius: sm, md, lg, xl.

### Semantic colors
Background canvas/surface, text primary/secondary/muted, action primary/hover/accent, default border, status success/warning/danger/info.

### Component tokens
Status foreground/border aliases for success/warning/danger/info.

## Naming rule

Semantic names describe function, not the current visual value.

Preferred:
`color.text.primary`
`color.action.primary`
`color.status.warning`

Rejected for semantic use:
`blueButton`
`redError`
`font16px`

## Raw-value policy

Raw state Tailwind palette utilities for red/green/blue/yellow/amber/emerald/orange are prohibited in client TS/TSX after DESIGN-ARCH-001.

Raw HEX values are allowed only in:
- token sources/generated outputs;
- explicitly classified legacy/theme seed definitions;
- documented exception ledger.

Exception ledger:
`design-system/tokens/metadata/raw-value-exceptions.json`

## Lifecycle

Current token package version: 0.1.0 engineering candidate.

Lifecycle:
experimental → stable → deprecated → removed through a documented migration window.

Generated artifact staleness is a failing gate.

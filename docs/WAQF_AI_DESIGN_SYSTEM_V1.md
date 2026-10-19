# WAQF_AI Design System V1

Status: DESIGN-ARCH-001 engineering candidate.

## 1. Purpose

WAQF_AI Design System is an operating contract connecting design decisions, runtime components, accessibility, RTL behavior, responsive behavior, testing, documentation and change governance. It is not only a CSS file or a component library.

## 2. Source of truth

The Git source of truth for platform-neutral design decisions is:

`design-system/tokens/**`

Token files use a DTCG 2025.10-style structure and carry the DTCG schema reference. Current acceptance is internal structural/deterministic validation; no claim of external schema-conformance certification is made.

Generated artifacts:
- `client/src/styles/generated-design-tokens.css`
- `client/src/lib/designTokens.generated.ts`

Generated files must be rebuilt from token source and must not be manually edited.

## 3. Token layers

1. Primitive / reference
2. Semantic / alias
3. Component
4. Theme / brand when required

Component code should consume semantic/component intent where available rather than raw palette values.

Current semantic status contract:
- success
- warning
- danger
- info

Critical state is communicated by icon + text + color, never color alone.

## 4. Typography and Arabic

Arabic is first-class. Current web font stack uses Cairo / Tajawal / Noto Sans Arabic through the existing application theme.

Requirements:
- RTL layout as default product direction.
- logical CSS properties where practical.
- mixed Arabic/English identifiers remain isolated and legible.
- SHA, URL, IDs and citations may use LTR islands inside RTL surfaces.
- long Arabic labels must wrap without losing controls.

## 5. Component governance

Primary reusable component families:
Button, Input, Select, Dialog, Card, Table, Tabs, Sidebar, Navigation, Badge/Status, Alert, Empty/Loading/Error/Permission states, Source/Evidence/Citation patterns, Review Task and Decision states.

Internal governed catalog:
`#/admin/design-system`

The catalog is part of acceptance evidence and not a second source of truth.

## 6. Required states

Operational components must define or inherit:
- default
- hover
- focus-visible
- disabled
- loading where asynchronous
- empty
- success
- error
- degraded where applicable
- permission denied
- blocked/conflict where applicable

No dead primary action, fake save or placeholder-as-complete is allowed.

## 7. Accessibility

Target: WCAG 2.2 AA where applicable.

Engineering gates include:
- accessible name for actionable controls
- keyboard traversal
- focus visibility
- dialog/form semantics
- contrast review
- zoom/reflow
- touch targets
- status not encoded by color alone

Current DESIGN-ARCH-001 browser evidence uses Chrome DevTools Accessibility tree plus keyboard traversal for representative routes.

## 8. Responsive acceptance

Required widths:
- 390px mobile
- desktop
- tablet when candidate-wide UAT is run

Failure conditions include unintended page-level horizontal overflow, unreachable primary actions, unusable dialogs/navigation, or unreadable evidence/status content.

## 9. Change governance

Token changes require:
1. source token update;
2. deterministic regeneration;
3. `pnpm design:verify`;
4. `pnpm design:test`;
5. build/check;
6. browser/visual evidence when behavior changes.

Breaking token meaning/name changes require migration/deprecation policy.

## 10. Current DESIGN-ARCH-001 evidence

- generated token count: 47
- raw status palette utility violations: 0
- unclassified raw HEX violations: 0
- unclassified admin stub pages: 0
- internal design catalog: operational
- 390px browser routes: 5/5 PASS
- desktop browser routes: 5/5 PASS
- horizontal overflow in tested routes: 0
- unnamed actionable controls in final tested routes: 0
- runtime exceptions in final tested routes: 0

Final project-wide acceptance remains subject to full regression and separate independent review.

# WAQF_AI Design System V1 — Working Specification

Status: DESIGN-ARCH-001 engineering candidate.

## Source of truth

design-system/tokens/** is the platform-neutral design-token source. Runtime CSS/TypeScript artifacts are generated; do not edit generated outputs directly.

Layers:
1. Primitive/reference tokens.
2. Semantic/alias tokens.
3. Component tokens.
4. Theme/brand tokens when needed.

Semantic names describe intent, not the current color or value.

## Required component states

Every operational component must define or inherit: default, hover, focus-visible, disabled and, where relevant, loading, empty, error, degraded, permission-denied and blocked/conflict.

## RTL / bidi

Arabic is first-class. Prefer logical CSS properties. Mixed Arabic/English identifiers, URLs, hashes and citations must remain legible and directionally stable.

## Accessibility

Target WCAG 2.2 AA where applicable. Critical status cannot rely on color alone. Keyboard flow, focus visibility, contrast, zoom/reflow and touch targets are acceptance requirements.

## Responsive

Primary reviewer/admin/public workflows require 390px mobile, tablet and desktop evidence. Unintended horizontal page overflow is a failure.

## Governance

Token/component changes require source-of-truth update, regenerated artifacts, tests and evidence. Deprecated tokens receive an explicit replacement and migration window.

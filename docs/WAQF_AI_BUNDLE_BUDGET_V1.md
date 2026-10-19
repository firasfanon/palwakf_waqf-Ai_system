# WAQF_AI Bundle Budget V1

Task: DESIGN-ARCH-001

## Gate

Production build entry JavaScript must remain at or below **550,000 bytes**.

This budget applies to the initial entry only. Large feature/vendor chunks are acceptable only when they remain lazy and are not pulled into the initial route without evidence.

## Baseline vs candidate

- Authorized-base entry: 5,478,069 bytes.
- DESIGN-ARCH-001 candidate entry: 472,980 bytes.
- Reduction: approximately 91.4%.
- Candidate headroom under the 550,000-byte entry budget: 77,020 bytes.

## Mechanism

- Public pages use React lazy route boundaries.
- Admin registry pages use lazy route boundaries.
- Navigation/providers remain in the critical shell.
- scripts/design-system/verify-bundle-budget.mjs fails the gate if the entry budget is exceeded.

This is a delivery budget, not a substitute for runtime performance/SLO measurement.

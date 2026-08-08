# Sovereign Trust Foundation v1 — Verification Notes

## Static checks completed in this environment

- Verified SQL pack presence and ordered operator sequence.
- Verified that every schema/apply script has a matching read-only pre/post check.
- Verified runtime touch points:
  - chat retrieval now accepts an actor and concrete scope codes;
  - non-public scope lookup fails closed when the new table is absent/unavailable;
  - test/fixture title detection removes unsafe legacy content from retrieval;
  - reference cards show authority/citation state without claiming that linked means verified.
- Added unit test coverage for public linked citations, test fixture quarantine, unscoped internal denial and concrete scope allowance.

## Not executed here

- `pnpm.cmd run check` / full TypeScript compile in the authoritative Windows workspace.
- Unit tests in the authoritative workspace.
- Live Supabase migration or RLS verification.
- Browser UAT.

## Required local verification

```powershell
pnpm.cmd run check
pnpm.cmd test -- assistantTrust.test.ts
pnpm.cmd run dev
```

Then test one public source, one quarantined test record, one internal record as an ordinary user, and the same internal record as an actor holding `assistant.internal`.

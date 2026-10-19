# Lessons and Failure Modes — DESIGN-ARCH-001

## 1. A component library is not a Design System

Finding: WAQF_AI already had 53 reusable UI primitives and semantic CSS variables, but no single project-owned Design System specification and no acceptance evidence for 390px/WCAG/keyboard flows.

Rule: require a project-specific gap assessment before claiming compliance.

## 2. Raw color count alone is a bad migration target

Blindly converting every gray/slate/category/decorative color into status tokens changes semantics.

Rule:
- normalize real state colors to success/warning/danger/info;
- preserve neutral/category/decorative styling unless separately governed;
- keep an explicit exception ledger;
- fail only on unclassified violations.

## 3. Router cleanup must close the dependency direction, not just rename files

Moving Drizzle calls from routers.ts to another arbitrary helper is insufficient.

Rule:
Router → Application Service → Repository/Port → Infrastructure Adapter.
Architecture tests must prohibit direct DB mutation and infrastructure imports from Router.

## 4. Provider SDKs belong in adapters

Supabase createClient/query syntax inside a general runtime repository couples policy/application code to a provider.

Rule: extract provider SDK creation/query syntax to infrastructure adapters and expose ports.

## 5. Do not replace one monolith with another

A mega-router must not become a mega-service.

Rule: decompose by bounded capabilities, but preserve compatibility boundaries where a complete migration would become a risky blind rewrite.

## 6. Deferred is not Stub

A feature can be intentionally deferred when its data contract or owning product capability is not ready.

Rule: classify it explicitly with reason, current operational alternatives and reopening criteria. It must not be counted as complete.

## 7. Lazy route boundaries are a major productization lever

WAQF_AI authorized-base entry bundle was 5,478,069 bytes. Route-level lazy loading reduced the candidate entry to 472,980 bytes, approximately 91.4% lower.

Rule: measure and enforce an entry budget; do not rely only on a build warning.

## 8. Static preview cannot prove authenticated Admin UX

A static preview correctly returned “admin access denied” for protected routes. This is useful negative UAT, but not visual acceptance of the protected page.

Rule:
- public preview = public UX + negative auth guard;
- admitted dev/staging runtime = authenticated admin visual UAT.

## 9. UAT output is not enough; exit status must terminalize failure

The initial browser harness wrote route entries with pass=false but exited 0.

Repair: browser-uat.mjs now sets process.exitCode=1 when summary.failed > 0.

Preventive gate: UAT_TERMINALIZATION_GATE.

## 10. Regression environment contamination can create false “new failures”

For authenticated UAT, .env/.env.local were copied into the worktree without reading their values. A subsequent regression run with those files present showed 22 failing files instead of the accepted 21 and introduced server/search.test.ts into the failing-file set, despite total failures staying near the historical baseline.

Repair:
- stop UAT runtime;
- remove copied env files;
- rerun isolated regression;
- compare exact failing-file sets.

Isolated result returned to the accepted 21-file failure set and improved total historical failures from 163 to 162.

Preventive gate: REGRESSION_ENV_ISOLATION_GATE.

## 11. Complex shell orchestration is itself a reliability risk

Large PowerShell commands caused escaping failures, and a broad process-match command could target the orchestration process itself.

Rule:
- prefer write_file/edit_block for source changes;
- split diagnostics/actions into small deterministic commands;
- terminate by known PID/session instead of broad self-matching patterns;
- verify the state after every failed orchestration call.

## 12. Build/test warnings need classification

pnpm warns that package.json pnpm.patchedDependencies/pnpm.overrides are no longer read from that field. It is not a DESIGN-ARCH-001 failure, but it is a toolchain configuration debt and must not be ignored indefinitely.

## 13. Engineering completion is not sovereign acceptance

DESIGN-ARCH-001 may reach an engineering candidate with clean tests/evidence, while independent acceptance, main merge, baseline promotion, production and public release remain separately gated.

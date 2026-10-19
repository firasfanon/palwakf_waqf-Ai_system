# WAQF_AI — Skills / Knowledge / Lessons Update — DESIGN-ARCH-001 — 2026-10-19

## Status

PROJECT_LEARNING_CAPTURE = PASS
NEW_SKILL_CANDIDATE = palwakf-productization-design-architecture-assurance
SKILL_STATUS = PROJECT_PROVEN_CANDIDATE
GLOBAL_PROMOTION = NOT_GRANTED
WAQF_AI_SELF_PROMOTION = FORBIDDEN

## New operational knowledge

WAQF_AI now treats the following as project-proven engineering knowledge:

1. Design System compliance requires explicit project evidence; a component library and CSS variables alone are insufficient.
2. The durable token source belongs in Git as a platform-neutral primitive/semantic/component/theme contract; runtime artifacts should be generated deterministically.
3. Semantic status migration must distinguish state colors from neutral/category/decorative colors.
4. A governed raw-value exception ledger is safer than blind visual rewriting.
5. Router/application/provider layering should be executable as architecture fitness tests, not only described in diagrams.
6. Provider SDK creation/query syntax belongs in infrastructure adapters.
7. Client business UI must not query/mutate Supabase business tables directly.
8. Deferred product surfaces must be explicit and cannot count as complete features.
9. Route-level lazy loading can radically reduce initial delivery cost and should be guarded by a bundle budget.
10. Public/static preview and authenticated admin visual UAT are different evidence classes.
11. Browser UAT must terminalize any failed route/viewport with a non-zero process exit code.
12. Regression baselines must be environment-isolated. UAT env files can change failure distribution and produce false regression claims.
13. Compare exact failing-file sets, not only aggregate failed-test counts.
14. Complex shell orchestration should be decomposed; failed orchestration commands require state readback before retry.
15. Engineering PASS does not grant independent acceptance, main merge, baseline promotion, production or public release.

## Errors converted into preventive controls

### Error A — Overstating phase completion
Earlier wording could imply that bounded Pre-Production closure meant all functional development was complete.

Repair:
current program mode is PARALLEL_ADVANCED_DEVELOPMENT_AND_PREPRODUCTION.

Preventive gate:
PROGRAM_PHASE_SCOPE_GATE.

### Error B — Inferring Design System compliance from existing UI primitives
The project had many reusable components, but no project-owned Design System acceptance package.

Repair:
project-specific gap assessment + DESIGN-ARCH-001.

Preventive gate:
PROJECT_SPECIFIC_DESIGN_ARCH_GAP_GATE.

### Error C — Raw visual values treated as one class
Blind replacement risks corrupting neutral/category semantics.

Repair:
semantic state normalization + explicit exception ledger.

Preventive gate:
SEMANTIC_STATUS_COLOR_GATE + RAW_VALUE_EXCEPTION_LEDGER_GATE.

### Error D — Direct DB/provider coupling
routers.ts and runtimeRepository.ts carried infrastructure concerns.

Repair:
application service + DB repository + ports + Supabase adapters + fitness tests.

Preventive gates:
ROUTER_APPLICATION_BOUNDARY_GATE
PROVIDER_SDK_ADAPTER_GATE
CLIENT_DATABASE_BYPASS_GATE.

### Error E — Stub ambiguity
Mustakshif/GIS was a stub-like surface that could be misread as completed.

Repair:
explicit DEFERRED classification, operational alternatives and reopening criteria.

Preventive gate:
NO_UNCLASSIFIED_STUB_GATE.

### Error F — Build warning without delivery budget
The authorized base had a very large initial JS entry.

Repair:
public/admin lazy route boundaries and an executable 550KB entry budget.

Evidence:
base 5,478,069 bytes → candidate 472,980 bytes (~91.4% reduction).

Preventive gate:
ENTRY_BUNDLE_BUDGET_GATE.

### Error G — Static preview used for protected UI
Static preview returned admin access denied. That proves the guard, not the protected screen.

Repair:
run admitted dev/staging runtime with appropriate auth context for Admin visual UAT.

Preventive gate:
UAT_AUTH_CONTEXT_GATE.

### Error H — UAT harness printed failure but exited 0
The first browser harness report could contain pass=false while the process exit code remained 0.

Repair:
terminalize summary.failed > 0 with process.exitCode = 1; add contract test.

Preventive gate:
UAT_TERMINALIZATION_GATE.

### Error I — Regression contaminated by UAT environment
Copied env files introduced server/search.test.ts into the failing-file set.

Repair:
remove copied env files; rerun isolated regression; compare exact failing-file set.

Isolated result:
21 failing files = exact baseline set
162 failed tests vs baseline 163
NEW_FAILING_FILES=0.

Preventive gate:
REGRESSION_ENV_ISOLATION_GATE.

### Error J — Overly complex command orchestration
Large shell commands caused escaping problems; broad process matching risked matching the orchestrator itself.

Repair:
prefer write_file/edit_block, known PID/session termination, smaller commands, and post-failure state verification.

Preventive gate:
TOOL_ORCHESTRATION_STATE_READBACK_GATE.

## Current engineering measurements

- routers.ts: approximately 3779 LOC, down from approximately 4266.
- runtimeRepository.ts: approximately 1500 LOC, down from approximately 1664.
- new bounded application service: adminOperationsService.ts.
- direct db insert/update/delete/select in routers.ts: 0.
- raw semantic state-color utility violations: 0.
- unclassified raw HEX violations under verifier: 0.
- unclassified admin stub pages: 0.
- Design/Architecture contract tests: passing.
- bundle entry budget: PASS.
- authenticated responsive browser UAT: 15/15 PASS across 390px/tablet/desktop.
- isolated full regression: same 21 historical failing files; no new failure file.

## Governance

This learning is project-proven. It is intentionally not self-promoted as a global skill.
Candidate for cross-project review:
palwakf-productization-design-architecture-assurance.

Potential reuse targets:
PAL_EYES
Palestine Atlas
Document Studio
Prompt Maker / Project Factory
other Arabic RTL PalWakf research/admin products.

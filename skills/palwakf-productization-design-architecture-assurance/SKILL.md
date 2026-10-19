---
name: palwakf-productization-design-architecture-assurance
description: Use to close project-specific Design System, software-architecture, responsive/accessibility, route-delivery, and full-productization gaps before freezing an integrated product candidate. Applies especially to Arabic/RTL PalWakf research/admin products with governed knowledge, evidence, review, and Supabase-backed infrastructure.
---

# PalWakf Productization Design + Architecture Assurance

## Status

PROJECT_PROVEN_CANDIDATE = TRUE
GLOBAL_CANONICAL_PROMOTION = NOT_GRANTED
RUNTIME_AUTHORITY = NONE

This skill captures a reusable engineering methodology proven during WAQF_AI DESIGN-ARCH-001. It does not grant source mutation, database mutation, deployment, procurement, production, public-release, or skill-promotion authority.

## When to use

Use when a PalWakf product has working functions but needs evidence that its:
- Design System is explicit and governed rather than inferred from components;
- visual tokens are semantic, reproducible, and platform-neutral;
- RTL/Bidi/accessibility/responsive behavior is accepted;
- stubs/deferred surfaces are classified;
- API/router/application/repository/provider boundaries are enforced;
- client code cannot bypass server authority;
- initial bundle and route delivery are bounded;
- full regression and browser UAT are comparable to an accepted baseline.

Suitable analogues include PAL_EYES, Palestine Atlas, research portals, admin workspaces, evidence-review systems, and similar React/Flutter products. Adapt generated platform artifacts; preserve the platform-neutral token/contract source.

## Required workflow

1. **Exact-base lock**
   - Record branch, HEAD, TREE, upstream, worktree status.
   - Execute in an isolated task branch/worktree.
   - Never infer acceptance from an unpinned checkout.

2. **Project-specific gap assessment**
   - Compare the actual repository to PalWakf Design System, Productization, Architecture, Security and UX standards.
   - Classify each area PASS / PARTIAL / GAP.
   - Existing libraries or attractive screens are not proof of Design System compliance.

3. **Platform-neutral Design Token source**
   - Keep primitive → semantic → component → theme layers in Git.
   - Prefer DTCG-compatible token documents.
   - Generate runtime CSS/TypeScript/Flutter artifacts deterministically.
   - Generated artifacts are not edited manually.

4. **Semantic visual normalization**
   - Status colors must use purpose names such as success/warning/danger/info.
   - Critical state must not rely on color alone.
   - Do not blindly map neutral/category/decorative palettes to status semantics.
   - Govern legitimate raw-value exceptions in an explicit ledger.
   - Fail if unclassified status-color or raw-value violations remain.

5. **Component and surface governance**
   - Maintain a governed internal component/pattern catalog.
   - Define default/hover/focus/disabled/loading/error/empty/degraded/permission-denied/blocked states where applicable.
   - Classify every unfinished surface as IMPLEMENTED, EXPLICITLY_DEFERRED, or SUPERSEDED.
   - A generic placeholder must not count as complete.

6. **RTL / Bidi / Accessibility / Responsive**
   - Arabic is first-class.
   - Test mixed Arabic/English IDs, URLs, SHA values, dates and citations.
   - Verify keyboard flow, focus visibility, semantics, contrast, zoom/reflow and touch targets.
   - Test at least 390px mobile, tablet and desktop.
   - Unintended horizontal overflow is a failure.

7. **Architecture boundary**
   - Target dependency direction:
     Presentation/API → Application → Domain/Policy → Ports → Infrastructure.
   - Router validates, authorizes, invokes a use case/service, maps result/error.
   - Direct DB mutation from router is prohibited.
   - Router must not import infrastructure implementation directly.
   - Provider SDK creation/query syntax belongs in infrastructure adapters.
   - Client business UI must not access Supabase/business tables directly.

8. **Bounded decomposition, not blind rewrite**
   - Extract application services and provider adapters where they materially close the boundary.
   - Preserve accepted domain/trust/governance behavior.
   - Record compatibility boundaries that cannot safely be migrated in the same batch.
   - Add architecture-fitness tests so debt cannot silently regress.

9. **Delivery / bundle budget**
   - Prefer route-level lazy loading for large public/admin surfaces.
   - Preserve shell/providers/navigation on the critical path as appropriate.
   - Measure baseline and candidate entry bundles.
   - Enforce a budget with a failing script, not prose only.

10. **Browser UAT with the correct authority context**
    - Public/static preview can prove public routes and negative admin-access guards.
    - It cannot prove authenticated Admin UX.
    - For Admin visual UAT, run the admitted local/staging runtime with the correct auth context.
    - Never print/copy secret values into evidence.

11. **UAT must fail closed**
    - The harness exit code must be non-zero when any route/viewport check fails.
    - A JSON report containing pass=false with process exit 0 is a harness defect, not acceptance evidence.

12. **Regression environment isolation**
    - Keep the accepted baseline environment reproducible.
    - Environment files copied for authenticated UAT must be removed before isolated regression unless the baseline explicitly includes them.
    - Compare failing test counts AND the exact set of failing test files.
    - Environment-induced redistribution of failures must not be misclassified as a code regression.

13. **Evidence closeout**
    - Preserve design verification, architecture tests, typecheck, build, bundle budget, targeted trust/security regression, full isolated regression, browser UAT, screenshots, hashes and Git state.
    - Engineering completion does not equal independent acceptance or production approval.

## Fail-closed gates

- EXACT_BASE_LOCK_GATE
- PROJECT_SPECIFIC_DESIGN_ARCH_GAP_GATE
- DESIGN_TOKEN_SOURCE_GENERATION_GATE
- SEMANTIC_STATUS_COLOR_GATE
- RAW_VALUE_EXCEPTION_LEDGER_GATE
- NO_UNCLASSIFIED_STUB_GATE
- ROUTER_APPLICATION_BOUNDARY_GATE
- PROVIDER_SDK_ADAPTER_GATE
- CLIENT_DATABASE_BYPASS_GATE
- ARCHITECTURE_FITNESS_GATE
- ENTRY_BUNDLE_BUDGET_GATE
- RTL_BIDI_RESPONSIVE_GATE
- UAT_AUTH_CONTEXT_GATE
- UAT_TERMINALIZATION_GATE
- REGRESSION_ENV_ISOLATION_GATE
- NO_NEW_FAILURE_FILE_GATE
- SEPARATE_INDEPENDENT_ACCEPTANCE_GATE

## WAQF_AI implementation bindings

- design-system/tokens/**
- scripts/design-system/build-tokens.mjs
- scripts/design-system/verify-design-system.mjs
- scripts/design-system/verify-bundle-budget.mjs
- scripts/design-system/browser-uat.mjs
- client/src/styles/design-system.css
- client/src/pages/admin/DesignSystemCatalog.tsx
- server/application/adminOperationsService.ts
- server/ports/assistantDataPort.ts
- server/infrastructure/db/adminRepository.ts
- server/infrastructure/supabase/assistantRuntimeClient.ts
- server/infrastructure/supabase/assistantDataAdapter.ts
- server/architectureFitness.test.ts

## Authority boundary

Experience capture and project-local candidate formation are allowed.
Promotion to a shared/canonical PalWakf skill requires separate Tools Factory / Mind / Workspace governance as applicable.

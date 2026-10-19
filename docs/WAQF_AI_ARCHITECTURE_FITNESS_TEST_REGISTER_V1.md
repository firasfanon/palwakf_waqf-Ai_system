# WAQF_AI Architecture Fitness Test Register V1

Task: DESIGN-ARCH-001

## Dependency direction

Presentation/API → Application → Domain/Policy → Ports → Infrastructure.

## Automated fitness tests

File: `server/architectureFitness.test.ts`

Current gates:

1. **Router DB boundary**
   - `server/routers.ts` must contain no direct `db.select/insert/update/delete` calls.

2. **Supabase infrastructure boundary**
   - `server/runtimeRepository.ts` must not import Supabase SDK.
   - It must not call `createClient`.
   - It must not contain Supabase `.from('...')` or `.rpc('...')` query syntax.
   - Provider syntax lives in infrastructure adapters.

3. **Port contract**
   - `server/ports/assistantDataPort.ts` defines the provider-neutral data port.
   - `server/infrastructure/supabase/assistantDataAdapter.ts` implements it.

4. **Client database boundary**
   - No client business module may import the dormant Supabase bridge.
   - Direct UI business-table access remains prohibited.

5. **Productization**
   - internal Design System catalog route must be registered.
   - unclassified `stub_page` lifecycle entries are prohibited.

6. **Design source**
   - platform-neutral token source and generated runtime artifacts must exist.

## Current measured state

- direct router DB mutations: 0
- provider query syntax in runtimeRepository: 0
- Supabase SDK/createClient in runtimeRepository: 0
- unclassified admin stubs: 0
- architecture/design/client contract test suite: 13/13 PASS

## Contract lifecycle

`contract/CONTRACT_LIFECYCLE_V1.json` defines:
ACTIVE → DEPRECATED → MIGRATION_WINDOW → NO_NEW_CONSUMERS → RETIREMENT_READY → RETIRED.

Breaking changes require a new contract version and explicit migration path.

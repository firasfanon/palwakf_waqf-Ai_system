# WAQF_AI Architecture Boundary Specification V1

## Required dependency direction

Presentation/API → Application → Domain/Policy → Ports → Infrastructure.

### Presentation/API

Routers validate input, enforce authorization, invoke application/use-case functions, and map results/errors. They must not perform direct Drizzle select/insert/update/delete calls.

### Application

Coordinates use cases and transactions. Application code depends on domain contracts and ports, not provider SDKs.

### Domain/Policy

Contains trust, evidence, citation, rights, legal/fiqh/historical policy and deterministic business rules. It must not depend on Supabase, HTTP clients or UI modules.

### Ports

Define repository/service capabilities such as KnowledgeRepository, ReviewRepository, SourceRepository, CitationRepository, RightsRepository and runtime health.

### Infrastructure

Owns provider-specific code such as Supabase client creation, Drizzle access, filesystem/network adapters and compatibility stores.

## Client boundary

React pages/components must not query or mutate business tables through the Supabase SDK. The existing client Supabase adapter is reserved for a future explicitly declared narrow identity/bridge use; no current business importer is admitted.

## Fitness gates

- direct Drizzle mutation in server/routers.ts: prohibited.
- Supabase createClient in server/runtimeRepository.ts: prohibited.
- business import of client/integrations/supabase/client.ts: prohibited.
- unclassified admin stub pages: prohibited.
- design token generated artifacts must match their Git token source.

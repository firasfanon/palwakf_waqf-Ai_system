# C3 State — Autonomous External Source Verification and Final Release Matrix

## Scope
- Read-only code path.
- Explicit operator-triggered external metadata checks.
- Bounded to C2 external candidate clusters and a maximum of 32 URLs per run.

## Guardrails
```text
NO_DOCUMENT_BODY_READ_OR_RETENTION
NO_REDIRECT_FOLLOW
DNS_PUBLIC_ADDRESS_GUARD=REQUIRED
NO_SOURCE_LINK_WRITE
NO_RIGHTS_ASSIGNMENT
NO_AUTOMATIC_PROVENANCE_INFERENCE
NO_AUTOMATIC_PUBLISHER_IDENTITY_ASSERTION
NO_AUTOMATIC_LICENSE_ASSERTION
NO_AUTOMATIC_PROMOTION
NO_AUTOMATIC_CHAT_RELEASE
NO_PUBLIC_DISPLAY_RELEASE
NO_SQL_OPERATOR_APPLY
NO_PRODUCTION
```

## Result Semantics
- A 2xx response is a reachability observation only.
- Official/academic categories remain metadata-only candidates.
- `finalRelease=not_authorized` is invariant across all C3 outcomes.

## Deployment Status
```text
C3_PACKAGE_PREPARED=YES
C3_STATIC_VERIFIER=PASS
C3_LOCAL_PNPM_CHECK_BUILD=NOT_RUN_IN_PACKAGING_ENV
C3_RUNTIME_UAT=NOT_RUN_IN_PACKAGING_ENV
C3_EXTERNAL_REQUESTS=NOT_RUN_IN_PACKAGING_ENV
SQL_OPERATOR_APPLY=NOT_APPLICABLE
PRODUCTION=NOT_APPROVED
```

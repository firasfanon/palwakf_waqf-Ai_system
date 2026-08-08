# Guide Patch — Sovereign Batch 02A (Pre-apply)

## Controlled Human Review Execution
The platform shall not permit a reviewer to verify an official source or knowledge citation unless the specific open task has been explicitly claimed by that same reviewer. Browser UI state is not authoritative; the enforcement belongs in server-side RPC logic.

A `content_classification` decision in the initial execution pilot is containment-only. It can confirm `test`, `duplicate`, or `quarantined`, or defer for additional evidence. It must not promote content to production, enable chat eligibility, publish knowledge, or bypass the official-source/citation gates.

All review operations must display bounded case context through a server-side review scope, including task, target document, linked reference/source, and citations. Direct browser access to assistant base tables remains prohibited.

Current state remains pre-apply. Production is not approved.

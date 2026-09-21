# WAQF_AI Sovereign Reference Storage Architecture V1

Status: MEGA_A architecture decision — implementation branch only
Program: WAQF_AI_COMPREHENSIVE_WAQF_REFERENCE_V1
Entry baseline: f62fcc196fd10e7beda2bea0570722dcdb055f5a

## Governing objective

WAQF_AI must remain able to prove and use a reference after the external website changes or disappears. A URL is provenance and a refresh locator; it is not the sovereign copy of the evidence.

The archive contract is therefore:

```
External source
→ controlled acquisition
→ exact original bytes / web capture
→ immutable object version
→ SHA-256 + fixity events
→ structured/extracted derivatives
→ governed knowledge and citations
```

## Storage tiers

### Tier A — sovereign immutable archive

Production use requires an object store with enforceable retention / write-once semantics such as S3 Object Lock or an equivalent WORM-capable provider. Each exact byte sequence receives a content-addressed immutable key. A later retrieval with changed bytes creates a new version; it never overwrites the older version.

### Tier B — independent continuity copy

A second provider or independent archive must retain a copy with an independent lock policy where practical. Cloudflare R2 Bucket Lock is an example of a provider-side retention control. Provider selection and paid-resource provisioning require separate authority and cost approval.

### Tier C — operational application storage

Supabase Storage may hold operational copies and application-facing objects, but it must not be the only sovereign archive. Current Supabase S3 compatibility documentation does not provide S3 object versioning or object-lock semantics, so irreversible deletion/provider failure must not destroy the reference evidence.

### Tier D — metadata and knowledge database

Supabase PostgreSQL stores artifact/version manifests, hashes, preservation events, source collection policy, legal/deed/asset structures, admissions, citations and retrieval indexes. Binary source truth remains in the sovereign archive.

## Version/fixity invariants

- Original bytes are immutable.
- SHA-256 is calculated before admission and verified after persistence.
- Same artifact + same SHA-256 = identical retrieval, not a new content version.
- Same artifact + different SHA-256 = new version with predecessor linkage.
- Fixity failure is fail-closed and must raise an operational incident.
- Restore verification is a distinct preservation event.
- Extracted/OCR/normalized text is a derivative and never replaces the original.
- HTML is preserved as a WARC-compatible capture with retrieval metadata.
- The external source URL, retrieval timestamp, HTTP metadata and content hash remain attached to the version.

## Rights separation

The following decisions are independent:

- preservation
- full-text retention
- internal RAG use
- quotation
- public display
- download
- canonical-reference admission
- chat eligibility

Preservation does not imply any other permission.

## Provider boundary

This architecture file does not provision cloud resources and does not contain credentials. The MEGA_A code uses a storage interface plus an in-memory immutable implementation for deterministic tests. A production WORM adapter is connected only after an explicit provider/cost/security decision.

## Failure model

The system must survive:

1. original website outage;
2. URL change;
3. source file replacement;
4. corrupted operational copy;
5. duplicate retrieval;
6. provider loss where an independent copy exists;
7. extraction/OCR changes without alteration of the original;
8. rights policy changes without erasing preservation history.

## Acceptance boundary

MEGA_A can prove the archive/version/fixity contract in code and tests. Production continuity is not certified until a real WORM-capable provider, independent copy, restore exercise and operations runbook pass GATE-01 and GATE-14 under separate infrastructure authority.

## Current provider evidence reviewed

- AWS S3 Object Lock documentation describes WORM retention/legal-hold controls.
- Cloudflare R2 Bucket Locks provide retention controls that prevent overwrite/deletion.
- Supabase Storage S3 compatibility documentation states that S3 versioning is unsupported and object-lock APIs are unsupported; deleted objects are not a substitute for a sovereign retained copy.

No paid provider was created or changed by this decision.

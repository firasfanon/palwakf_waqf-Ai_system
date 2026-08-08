# Mega Batch B — Discovery Acceptance Criteria

## Required evidence

1. `evidence/mega_batch_b_read_only_discovery_<timestamp>.txt` exists.
2. It shows `transaction_read_only=on`.
3. All expected assistant tables are present.
4. It outputs lifecycle counts, KB08B backlog distribution, review queue distribution, chat eligibility distribution, reference/citation verification distributions, ten candidate rows, and tool-run table shapes.
5. No output indicates a data mutation or SQL failure.

## Required interpretation before Candidate implementation

- Compare live `needs_mapping` count with the last known baseline of 296.
- Confirm `is_chat_eligible=true` remains zero before any release work.
- Confirm the 10 pilot records all carry `migration_status=needs_mapping`.
- Do not infer a proposed mapping decision from table shape alone.
- Do not apply any mapping, promotion, approval, or publication in the Discovery phase.

## Acceptance marker

```text
MEGA_BATCH_B_DISCOVERY_EVIDENCE_CAPTURED
MEGA_BATCH_B_DISCOVERY_EVIDENCE_REVIEWED
KB08B_TEN_RECORD_PILOT_POOL_VERIFIED
NO_DATA_MUTATION_CONFIRMED
```

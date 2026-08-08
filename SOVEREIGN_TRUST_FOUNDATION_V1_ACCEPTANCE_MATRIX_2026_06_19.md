# Sovereign Trust Foundation v1 — Acceptance Matrix

| Pillar | Delivered in v58 | Acceptance evidence still needed | Gate state |
|---|---|---|---|
| Official sources | source verification fields, source review tasks, authority status mapping | applied SQL output and human verification decisions | pending live apply |
| Verified citations | citation lifecycle fields, review tasks, trust labels and ranking | verified citation samples + browser citation cards | pending human review |
| Scoped permissions | scope assignment table, fail-closed runtime resolver, RLS on trust objects | negative UAT for public/internal/restricted users | pending RLS UAT |
| Human review | idempotent review task queue, review stage contract | review action evidence and audit events | pending page binding |
| Useful workflows | source→citation→review→publish lifecycle, admin snapshot/read queue | KB09 operational UI/browser UAT | pending KB09 |
| Calm usable interface | compact authority/citation indicators in reference cards | visual/browser acceptance | pending browser evidence |

## Non-negotiable release rules

```text
No test / duplicate / quarantined record is chat-visible.
No restricted record is returned to an unscoped user.
No citation is labelled verified without a reviewer action.
No production promotion occurs from this batch.
```

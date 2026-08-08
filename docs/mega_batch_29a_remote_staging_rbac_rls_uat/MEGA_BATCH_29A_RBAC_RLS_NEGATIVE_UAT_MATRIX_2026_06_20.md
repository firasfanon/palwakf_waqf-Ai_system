# Mega Batch 29A — RBAC/RLS Negative UAT Matrix (Updated)

This is the test authority for v65. It supersedes the prepared-only matrix dated 2026-06-18 for the Assistant Smart Tools 3 staging path.

## Enforced application contracts

| Surface | Required server condition |
|---|---|
| `/admin/*` visual console | explicit administrative role only |
| `knowledgeTrust.access` | authenticated admin procedure; returns capability handshake only |
| knowledge review reads/queue/bindings | `assistant.review` |
| claim/source/citation/KB08B resolution | `assistant.review` + DB RPC rule |
| release/page-binding mutation | `assistant.publish` + DB RPC rule |
| direct `assistant.*` table operations from browser | denied by revoked table grants/RLS |

## Acceptance prohibition

A screenshot of a route alone is insufficient. A pass needs route screenshot **and** Network response, and SQL evidence for the sensitive write/read cases.

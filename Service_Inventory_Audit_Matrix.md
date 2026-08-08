# Service Inventory / Audit Matrix
## PalWakf Local Assistant Project
## Baseline Audit — Active / Partial / Legacy / Shell / Future

### Purpose
This document classifies the current project services and pages according to their real execution state, backend alignment, and architectural relevance.

This is not a visual inventory only.
It is an **operational audit** intended to guide:
- current development priorities
- future schema design
- knowledge governance
- assistant data architecture
- bridge integration with PalWakf

---

## Status Legend

| Status | Meaning |
|---|---|
| **Active** | Working service/page with meaningful backend alignment and current architectural relevance |
| **Partial** | Exists and is meaningful, but backend/frontend or workflow alignment is incomplete |
| **Legacy** | Inherited from older baseline or older routing/backend assumptions and not part of the reliable current core |
| **Shell** | Placeholder/admin shell/route shell exists but substantive backend or business completion is not current |
| **Future** | Clear intended direction but should not drive current schema decisions yet |

---

# 1) Core Project Reading

The current project is **not just a chatbot**.

Its real current structure is centered around five intersecting layers:

1. **Chat**
2. **Knowledge**
3. **References / Source Documents**
4. **Governance / Review / Fetching / Processing**
5. **Platform Bridge / Identity / Runtime Configuration**

In addition, AI tools are not just utility pages. They are expected to become **data-producing modules**.

Therefore, current schema and system decisions should be based primarily on the **real active core**, not on every route visible in the sidebar.

---

# 2) Service Inventory Matrix

## 2.1 Public / User-facing Services

| Service / Page | Path | Role | Current Status | Notes |
|---|---|---|---|---|
| Home | `/` | Public landing page + entry point to chat | **Partial** | Page works, but dynamic institutional sections are not fully aligned with current backend |
| Chat | `/chat` | Main assistant interaction page | **Active** | This is the central operational service of the current project |
| Knowledge List | `/knowledge` | Browse knowledge documents | **Active** | Core read layer for the knowledge system |
| Knowledge Details | `/knowledge/:id` | View single knowledge document | **Partial** | Document display works, but surrounding interactive modules are not fully aligned |
| References | `/references` | Reference-oriented browsing layer | **Active** | Meaningful as a supporting reference surface |
| Bookmarks | `/bookmarks` | User bookmark management | **Partial** | Useful and mostly meaningful, but some typing/alignment issues existed recently |
| Favorite Conversations | `/favorites` | Favorite chat sessions | **Partial** | Conceptually active, but backend/frontend naming requires alignment |
| FAQs | `/faqs` | Public FAQs | **Legacy** | UI exists, but backend root is not part of current reliable app core |
| Search | `/search` | Search page | **Legacy** | Present as page concept, not part of current aligned backend core |
| Advanced Search | `/advanced-search` | Expanded search page | **Legacy** | Similar to Search; not a reliable active service now |
| Contact | `/contact` | Public contact flow | **Legacy** | UI intent exists; backend alignment is not current |
| About | `/about` | Static informational page | **Active** | Static/supporting page, not a core data service |
| Stats | `/stats` | Light chat stats | **Shell** | Exists but not central to current core |
| Export Data | `/export` | Export user-facing data | **Partial** | Some backend support exists, but not part of the primary roadmap |

---

## 2.2 Knowledge Management Services

| Service / Page | Path | Role | Current Status | Notes |
|---|---|---|---|---|
| Manage Knowledge | `/admin/knowledge` | Main knowledge CRUD workspace | **Active** | One of the most important current admin services |
| Knowledge Dashboard | `/admin/knowledge-dashboard` | Knowledge sources and metrics overview | **Active** | Aligned with current knowledge flow |
| Knowledge Sources | `/admin/knowledge-sources` | Source registry / source management | **Active** | Central to ingestion/governance architecture |
| Knowledge Search | `/admin/knowledge-search` | Search/testing workspace | **Partial** | Strong concept, but route/backend alignment is incomplete |
| Knowledge Details / Admin Readbacks | admin-linked | Inspect knowledge items in management flow | **Partial** | Related views are meaningful but not all peripheral actions are aligned |

---

## 2.3 Knowledge Input / Fetch / Review / Processing Services

| Service / Page | Path | Role | Current Status | Notes |
|---|---|---|---|---|
| Fetched Content Review | `/admin/fetched-content` | Review and route fetched/raw content | **Active** | Core governance service; central to future knowledge lifecycle |
| Fetch Logs | `/admin/fetch-logs` | Operational fetch history | **Partial** | Valuable, but backend/route alignment needs refinement |
| Data Fetching | `/admin/data-fetching` | Manual triggering of fetch flows | **Partial** | Backend fetchers exist conceptually; UI alignment is incomplete |
| Smart Processing | integrated admin flow | Classification / transform / processing workspace | **Active** | Important internal pipeline function |
| PDF Extraction | integrated admin flow | Extract text/fields from PDF | **Active** | Usable now and strategically important |
| Classification Ratings | implicit admin/runtime flow | Human quality scoring for classification output | **Active** | Present in runtime model and architecturally important |
| Review Events | implicit admin/runtime flow | Record review actions and decisions | **Active** | Core governance data concept |

---

## 2.4 Platform Integration / Runtime / Identity Services

| Service / Page | Path | Role | Current Status | Notes |
|---|---|---|---|---|
| Platform Bridge | `/admin/platform-bridge` | PalWakf bridge status, object availability, source-of-truth preview | **Active** | One of the most architecturally important pages in the current system |
| Auth / Identity | internal | Session and user context | **Active** | Current identity is platform-oriented and no longer centered on legacy local users |
| System Settings | `/admin/system-settings` | Runtime/system configuration | **Active** | Includes hybrid LLM direction and should remain foundational |
| Hybrid LLM Provider Settings | inside system settings | Configure local/external model provider | **Active** | Newly adopted core operational feature |
| Local Runtime Store | internal | Temporary sovereign local storage | **Active** | Current operational persistence layer until DB migration |

---

## 2.5 AI Tools Services

| Service / Page | Path | Role | Current Status | Notes |
|---|---|---|---|---|
| Classify Tool | `/admin/tools/classify` | Classification assistance | **Future** | Important as data-producing module, but not current frontend/backend core |
| Extract Tool | `/admin/tools/extract` | Extraction assistance | **Future** | Concept important; eventual outputs should be stored structurally |
| Summarize Tool | `/admin/tools/summarize` | Summarization assistance | **Future** | Should be treated as derived-data producer later |
| Compare Tool | `/admin/tools/compare` | Comparison/legal/analytic support | **Future** | Architectural intent exists |
| Precedents Tool | `/admin/tools/precedents` | Precedent analysis | **Future** | Domain-facing but not current operational core |
| Predict Tool | `/admin/tools/predict` | Predictive analysis | **Future** | Must not drive current schema before active alignment |

### Important architectural note
AI tools should not be modeled merely as UI pages.
They must later be treated as **data-producing services** with outputs that can fall into:
- reference-linked derived data
- operational processing outputs
- temporary or regenerable artifacts

---

## 2.6 Administrative / General Management Services

| Service / Page | Path | Role | Current Status | Notes |
|---|---|---|---|---|
| Admin Dashboard | `/admin/dashboard` | General admin overview | **Legacy** | Present, but not part of the reliable current backend core |
| Admin Activity | `/admin/activity` | Admin activity logs | **Legacy** | Inherited concept, not current execution center |
| Admin Content | `/admin/content` | Content/admin module | **Legacy** | Not part of current stabilized assistant core |
| Admin Users | `/admin/users` | User management | **Partial** | Architecturally meaningful, but inherited screens still need consistent backend alignment |
| Roles | `/admin/roles` | Role management | **Legacy** | Not part of current trusted core service layer |
| Permissions | `/admin/permissions` | Permission management | **Legacy** | Similar to roles |
| Role Permissions | `/admin/role-permissions` | Assign permissions to roles | **Legacy** | Useful conceptually, not trusted as active backend-aligned module now |
| Notifications | `/admin/notifications` | Notifications management | **Legacy** | Present in inherited structure, not a current core priority |
| Comments | `/admin/comments` | Comments moderation | **Legacy** | Inherited/admin concept, not part of current assistant-first center |
| Site Settings | `/admin/site-settings` | Website settings | **Legacy** | Different from current system-settings runtime direction |
| Home Sections Management | `/admin/home-sections` | Homepage section admin | **Legacy** | More relevant to a broader CMS layer than the current assistant core |

---

## 2.7 Domain / Waqf Operations Services

| Service / Page | Path | Role | Current Status | Notes |
|---|---|---|---|---|
| Properties Management | `/admin/properties` | Property/asset operations | **Future** | Important for future integration, not current assistant core |
| Property Details | `/admin/properties/:id` | Property details | **Future** | Same note |
| Cases Management | `/admin/cases` | Case operations | **Future** | Relevant to future bridge with cases system |
| Case Details | `/admin/cases/:id` | Case detail page | **Future** | Same note |
| Rulings Management | `/admin/rulings` | Legal rulings management | **Future** | Conceptually aligned with future domain knowledge |
| Ruling Details | `/admin/rulings/:id` | Ruling details | **Future** | Same note |
| Deeds Management | `/admin/deeds` | Waqf deed management | **Future** | Domain-critical in the long run |
| Instructions Management | `/admin/instructions` | Procedure/instruction docs | **Partial** | Could later become part of active governed knowledge |
| Waqf Categories | `/admin/waqf-categories` | Category management | **Future** | More domain CRUD than assistant current core |
| Waqf Analytics | `/admin/waqf-analytics` | Analytics page | **Shell** | Exists as direction but not current architectural center |

---

# 3) Practical Core vs. Peripheral Distinction

## 3.1 Current Real Core (should drive schema decisions now)
The following should drive the first serious assistant schema design:

### A) Chat
- Conversations
- Messages
- Ratings
- Session context
- LLM invocation
- Retrieved evidence

### B) Knowledge
- Knowledge documents
- Document files
- Knowledge sources
- Document metadata
- Reference relationships

### C) Governance / Review
- Fetched content
- Review events
- Classification ratings
- Approval status
- Authority level
- Domain scope

### D) Runtime / Platform Integration
- System settings
- Hybrid LLM provider settings
- Platform bridge visibility
- Platform user context

### E) AI Processing Outputs
- Extraction outputs
- Classification outputs
- Summaries
- Suggested tags/links/FAQ candidates
- Provenance of generated outputs

---

## 3.2 Peripheral or non-driving layers (should not drive DB first)
The following should **not** be used as the basis for immediate schema expansion:

- inherited legacy CMS/admin pages
- wide admin shells with missing active backend roots
- older routes that existed before the current assistant-first alignment
- future domain CRUD pages not currently stabilized in this project
- speculative analytics screens

---

# 4) Architectural Implication for Next Phase

The next schema review should be based on the **real active core**, not on every visible page.

That means the upcoming audit and DB planning should focus on:

1. Chat data
2. Reference/source document data
3. Knowledge data
4. Governance/review data
5. AI tools output data
6. Runtime/system settings
7. Platform bridge linkage points

---

# 5) Recommended Next Action

## Immediate next project action
Build a **Current Assistant Data Audit** against the actual project files:

- `drizzle/schema.ts`
- `server/localRuntimeStore.ts`
- `server/runtimeRepository.ts`
- `server/routers.ts`

### Audit objectives
- identify what entities already exist conceptually
- identify which entities are really active
- identify what belongs to future `assistant` schema
- identify what is sovereign reference vs. derived vs. operational
- avoid building SQL around legacy/sidebar sprawl

---

# 6) Final Classification Summary

## High-confidence Active Core
- Chat
- Knowledge
- References
- ManageKnowledge
- Knowledge Sources
- Fetched Content Review
- Smart Processing
- PDF Extraction
- Platform Bridge
- System Settings
- Hybrid LLM Provider Settings
- Local Runtime Store

## Meaningful but Partial
- Home
- Knowledge Details
- Bookmarks
- Favorite Conversations
- Fetch Logs
- Data Fetching
- Knowledge Search
- Instructions
- Admin Users (conceptually relevant, not fully current-core aligned)

## Mostly Legacy / Inherited
- FAQs
- Search
- Advanced Search
- Contact
- Roles
- Permissions
- Notifications
- Comments
- Site Settings
- Home Sections
- broad inherited admin layers

## Shell / Placeholder / Non-driving now
- Stats
- Waqf Analytics
- some wide admin operation shells

## Future
- AI tools pages as stable products
- property/cases/rulings/deeds operational domains
- broader domain integration surfaces

---

# 7) Decision Rule
Until a newer approved audit replaces this file, the project should treat the **Active Core** as the authoritative basis for:
- assistant schema design
- knowledge governance design
- storage planning
- migration planning from local runtime to Supabase/Postgres


# قائمة المهام - نموذج الذكاء الصناعي للأوقاف الإسلامية في فلسطين

## Mega Batch E - Smart Processing (Rule-based) - 2026-02-27
- [x] إضافة migration لأعمدة المعالجة الذكية (SQL مباشر)
- [x] تحديث drizzle/schema.ts بأعمدة AI processing
- [x] إنشاء server/smart-processing/ruleBasedProcessing.ts
- [x] تحديث server/db.ts بدوال updateFetchedContentProcessing و listPendingUnprocessedFetchedContent
- [x] إضافة procedures في server/routers.ts (processOne, processPending, getStats)
- [ ] اختبار processPending مع 5 عناصر (يحتاج UI)
- [x] Build test (EXIT:0) ✅

---

## Mega Batch D - Web Scraper + PDF Downloader + Governance - 2026-02-27
- [x] إضافة server/fetchers/governance.ts
- [x] تحديث server/fetchers/scraper.ts مع governance
- [x] تحديث server/fetchers/pdf.ts مع governance
- [x] تحديث server/fetchers/index.ts
- [x] إصلاح baseUrl conflict في scraper.ts
- [x] إزالة Phase 3 restriction من knowledgeSources.fetch
- [x] Build test (EXIT:0) ✅
- [ ] اختبار Pilot Scraper مع allowedDomains
- [ ] اختبار Pilot PDF مع maxBytes

---

## Mega Batch C - Wikipedia + RSS Fetch + Save - 2026-02-27
- [x] تحديث knowledgeSources.fetch لحفظ pending items
- [x] تحديث fetcher.fetchAll للجلب من جميع المصادر النشطة
- [x] تحسين Toast في KnowledgeSourcesManagement
- [x] إصلاح getPageSettings في server/db.ts (try/catch)
- [x] إصلاح NaN في DataFetching.tsx (successRate)
- [x] Build test (EXIT:0) ✅

---

## Mega Batch B - Admin Procedures + UI Fixes - 2026-02-27
- [x] تحويل fetchedContent إلى router()
- [x] تحويل approve/reject/classify/rate/stats إلى adminProcedure
- [x] إصلاح AdminPage wrapper في FetchedContentReview.tsx
- [x] إصلاح AdminPage wrapper في DataFetching.tsx
- [x] Build test (EXIT:0) ✅

---

## Mega Batch A - Knowledge Sources Management - 2026-02-27
- [x] إنشاء جداول knowledge_sources, fetched_content, fetch_logs
- [x] إنشاء صفحة KnowledgeSourcesManagement.tsx
- [x] إنشاء صفحة FetchedContentReview.tsx
- [x] إنشاء صفحة DataFetching.tsx
- [x] إنشاء صفحة KnowledgeDashboard.tsx
- [x] إضافة Wikipedia و RSS fetchers
- [x] Build test (EXIT:0) ✅

---

## Mega Batch F - UI Controls + Edit-before-approve - 2026-02-28
- [x] إضافة smartProcessing.updateOne (adminProcedure) في server/routers.ts
- [x] إصلاح TS errors (author/url) في server/routers.ts السطور 3831-3832 وЉ4095-4096
- [x] إضافة mutations في FetchedContentReview.tsx (processOne/processPending/updateOne)
- [x] إضافة زر "معالجة الكل (Pending)" أعلى الجدول
- [x] إضافة زر "معالجة" لكل صف
- [x] إضافة Editor في Dialog المعاينة (category/keywords/summary/tags/relevanceScore)
- [x] Build test (EXIT:0) ✅

---


---

## G4 - Alerts & Watchlists (2026-03-10)

### Completed
- [x] G4.1: Edit/Delete Watchlists
- [x] G4.2: Filtering (status/watchlist/search/minScore/dateFrom/dateTo)
- [x] G4.3: Bulk Actions (checkboxes + bulk mark/delete)
- [x] G4.4-ALT: Scheduling (Express endpoint + GitHub Actions cron)
- [x] G4.5: Alert Details Modal
- [x] G4.6: Export Alerts CSV (UTF-8 BOM support)
- [x] G4.7a: Watchlist Templates Modal (Safe Minimal) - CHECKPOINT 96ff7d8b
  - ✅ Created client/src/data/watchlistTemplates.ts (4 templates)
  - ✅ Created client/src/components/alerts/WatchlistTemplatesModal.tsx
  - ✅ Integrated into AlertsCenter.tsx (state + handler)
  - ✅ Build EXIT:0 ✅
  - ✅ Checkpoint saved and verified
- [x] G4.8a: Alert Statistics Dashboard (Safe Minimal) - CHECKPOINT 142d5cc6
  - ✅ Added getAlertsStats() to server/db.ts
  - ✅ Added alerts.getStats procedure to server/routers.ts
  - ✅ Added Statistics UI section to AlertsCenter.tsx (5 cards + top watchlists)
  - ✅ Build EXIT:0 ✅
  - ✅ Checkpoint saved and verified

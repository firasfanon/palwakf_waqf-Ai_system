# Changelog — Mega Batch UI/UX 01A

- Fixed hash-routing canonicalization after the comfort-light UI rework.
- Introduced `/knowledge-base` as the preferred internal knowledge browser route.
- Preserved `/knowledge` as a legacy alias for backward compatibility.
- Fixed Home CTA links to use `getAppHref` rather than raw root-relative anchors.
- Fixed Home logout flow to redirect to app home instead of reloading the current URL.
- Hardened `useHybridLocation` and `normalizeAppPath` to strip accidental nested hashes.
- Updated navigation surfaces: Navbar, Footer, CommandPalette, Breadcrumbs, Chat route cards, Bookmarks, KnowledgeDetails, ManageKnowledge, and Admin Knowledge Search navigation.

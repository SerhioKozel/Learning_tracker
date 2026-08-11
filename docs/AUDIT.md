# Learning Tracker — Audit Report

**Date:** 2026-08-07  
**Scope:** React project (`tracker_v2`) + Legacy Angular project (`tracker`) as reference  
**Status:** Pre-refactor baseline  

---

## Executive Summary

The React project is a well-designed, visually polished MVP. The design system is thoughtful, the Supabase integration works, and the UX follows good conventions. However, the codebase shows clear signs of AI-assisted scaffolding: oversized components, duplicated logic, hardcoded values, a misnamed file, and missing architecture. These are solvable problems. The bones are good; it needs finishing work.

---

## Phase 2 — Audit Report

---

### Product

**Strengths**

- Kanban-style board with five learning stages (To Learn → Learning → Practice → Review → Completed) is the right product model for the target audience.
- Dark/light theme toggle works well and persists to localStorage.
- Search palette (Cmd+K) is a quality UX detail.
- TopicDrawer is rich: checklist, resources, notes, history, review date — all in one panel.
- Supabase backend replaces LocalStorage cleanly; the product is already beyond the legacy MVP scope.
- Statistics and Calendar views give real depth.
- Export/import in Settings is a practical safety net.

**Weaknesses**

- Hardcoded user name "Alex" and static streak "23 days" / "Best: 41d" in Dashboard. These are AI leftovers that would embarrass a real user.
- `generateWeeklyHours` adds `Math.random()` to fabricate hours data — this will produce different values on every render, is non-deterministic, and is misleading to users.
- Streak is calculated as a constant. A real streak requires tracking daily activity.
- No confirmation dialog before deleting a topic (delete is instant and irreversible).
- Bell notification icon does nothing (placeholder with hardcoded dot indicator).
- Star/favourite button in TopicDrawer does nothing.
- Board view lacks drag-and-drop — the legacy roadmap considered this a future feature, but it is a significant UX gap for a Kanban tool.
- Progress field in TopicDrawer is read-only (displayed but no slider to change it).
- No inline editing of topic title from the drawer or card.
- Tags cannot be edited or removed from the topic drawer — only displayed.

**Missing Functionality (from legacy FR backlog)**

- FR-402: Delete checklist item (implemented in data layer but no UI)
- FR-502: Delete resource (implemented in data layer but no UI)
- FR-304: Duplicate topic
- FR-308: Review date editing (partially present — input exists but no clear "Remove" action)
- FR-703: Filter topics by status/type/difficulty within a board (only sort exists)

**UX Problems**

- Clicking "New topic" button in the header creates a topic globally, but the user might be inside a board — the default board selection could be wrong.
- Topic drawer uses local state (`useState`) that can get out of sync with store state on concurrent updates (the `eslint-disable` on line 101 of TopicDrawer is masking this problem).
- `updatedAt` in the sidebar is based on `timeAgo()` which receives the already-formatted string from the store, not an ISO date — so it always displays "just now" on first load.
- The DesignSystem page is accessible from the sidebar in production. This is a development tool and should not be in the production nav.

---

### Architecture

**Scalability**

- Single `useDataStore` hook holding all state is acceptable for this scale but will become a bottleneck if concurrent views need isolated state or optimistic updates.
- All mutations call `fetchAll()` after every write — this is a full re-fetch of all boards and topics on every single mutation (create, update, delete checklist item, toggle resource done). At scale this causes unnecessary network traffic. Optimistic updates would be better.

**Coupling**

- `data/mockData.ts` is misnamed — it contains no mock data. It is the domain type definitions, configuration maps, and pure utility functions. The name actively misleads developers.
- Types, config maps (statusConfig, boardColorMap, etc.), and utility functions are all in one file. These should be separated.
- `App.tsx` manages too many concerns: routing/view state, modals (search palette, new topic), keyboard shortcuts, and theme. These belong in dedicated hooks.

**Separation of Concerns**

- Business logic (streak calculation, filtering, sorting) lives inside component render functions rather than in hooks or utilities.
- `BoardsList.tsx` contains the create/edit board modal inline — this is a 343-line component because of it.
- No routing library — view state is a `useState<View>` string. Acceptable at this size but not scalable and breaks browser history (back button doesn't work).

**Project Organization**

```
src/
├── App.tsx          # 372 lines — too many responsibilities
├── components/      # 9 components, all flat — no grouping
├── data/
│   └── mockData.ts  # misnamed; contains types + config + utils
├── hooks/
│   └── useDataStore.ts
├── lib/
│   └── supabase.ts
└── index.css
```

Missing: `types/`, `utils/`, `constants/`. No feature grouping. No shared UI primitives.

---

### Code Quality

**Duplicated Logic**

| Pattern | Locations |
|---------|-----------|
| `boardIcons` constant | `BoardView.tsx`, `BoardsList.tsx`, `Dashboard.tsx` |
| `heatmapColors` constant | `Dashboard.tsx`, `Statistics.tsx` |
| Icon import blocks (Layout, Network, Binary, Server, Cloud) | 3 files |
| Progress bar pattern | Multiple components |
| Section divider `<div className="my-6 border-t border-white/[0.04]" />` | TopicDrawer (×5 identical divs) |

**Oversized Components**

| Component | Lines | Problem |
|-----------|-------|---------|
| `App.tsx` | 372 | Search palette + new topic modal + keyboard shortcuts + theme + routing |
| `TopicDrawer.tsx` | 506 | Properties + checklist + resources + notes + history all inline |
| `BoardsList.tsx` | 343 | Board list + create/edit modal inline |
| `Dashboard.tsx` | 343 | Heatmap + weekly chart + board cards + review list + recent topics |

**Dead Code / Placeholders**

- `Bell` button in header — imported, rendered with fake badge, does nothing
- Star button in TopicDrawer — imported, rendered, does nothing
- `DesignSystem` view in production nav — development artifact
- `topicId` prop passed to TopicDrawer but only used in the `useEffect` dependency — redundant since `topic?.id` exists

**Code Smells**

- `eslint-disable-line react-hooks/exhaustive-deps` in TopicDrawer line 101 — this suppresses a real bug. The `useEffect` depends on `topic` data but only lists `topicId` as a dependency. If `topic` updates without `topicId` changing, local state goes stale.
- `sortRank` in `BoardsList.tsx` is a fragile manually-maintained mapping of time strings — it will fail on any `timeAgo()` output not in its list (returns `99`). The sort should operate on raw timestamps.
- ID generation uses `Date.now()` for primary keys: `id: \`t${Date.now()}\`` — this is not collision-safe for rapid consecutive inserts.
- `Math.random()` in `generateWeeklyHours` produces non-deterministic renders.
- `duplicateBoard` in `useDataStore` generates IDs with `Date.now()` inside a loop: `id: \`t${Date.now()}_${Math.random()...}\`` — the `Date.now()` portion will be identical for all topics since the loop is synchronous.

**Inconsistent Naming**

- File is named `mockData.ts` but contains real domain types and utilities — no mock data.
- `RawBoard` / `RawTopic` types (Supabase row shapes) live in `useDataStore.ts` rather than alongside the domain types.
- `c`, `s`, `b`, `tc`, `hc` — single-letter variable names for styled config objects are pervasive and reduce readability.

**AI-Generated Artifacts**

- Hardcoded "Alex" username
- Static streak "23 days" / "Best: 41d"
- `Math.random()` in chart data
- Bell notification with fake badge
- Star button with no action
- DesignSystem in production nav

---

### Performance

**Expensive Renders**

- Every mutation calls `fetchAll()` which triggers a Supabase network round-trip and then `setBoards` + `setTopics` — two state updates causing a full re-render of every component. Fine at small data size; will degrade as data grows.
- `generateWeeklyHours` with `Math.random()` causes non-deterministic output meaning memoization is impossible.
- `generateHeatmap` and `generateWeeklyHours` are called fresh on every render of Dashboard and Statistics with no memoization.

**Unnecessary State**

- TopicDrawer maintains its own local copies of `checklist`, `resources`, `notes`, `status`, `type`, `difficulty`, `reviewDate` — these mirror the store and are kept in sync via `useEffect`. This pattern creates a source of truth split and the `eslint-disable` is evidence that it's already causing problems.

**Bundle Concerns**

- `@supabase/supabase-js` is a heavy dependency (~200KB gzipped). Acceptable, but worth noting.
- No lazy loading of any view — all components are imported eagerly in `App.tsx`.
- `lucide-react` is tree-shaken by default — this is fine.

---

### Documentation

**Outdated / Missing**

- No `README.md` in the React project
- No `ARCHITECTURE.md`
- No `CONTRIBUTING.md`
- No `.env.example` file documenting required environment variables
- No Supabase setup instructions
- `package.json` name is `"vite-react-typescript-starter"` — the scaffolding default

**Reusable from Legacy Project**

- `docs/product/01-Vision.md` — Product vision is still accurate; language needs updating to reflect Supabase backend
- `docs/product/02-Product-Requirements.md` — Core requirements apply
- `docs/product/03-Functional-Requirements.md` — FR IDs and acceptance criteria are still useful for tracking what's built vs. planned
- `docs/product/05-User-Stories.md` — User stories map directly to current features
- `docs/roadmap/16-Development-Roadmap.md` — Phase 2 and 3 items are genuinely useful backlog
- `docs/roadmap/17-Future-Improvements.md` — Future items still relevant

---

### Technical Debt — Ranked

| ID | Issue | Severity | Impact | Effort | Risk |
|----|-------|----------|--------|--------|------|
| TD-01 | Hardcoded user name + fake streak data | **Critical** | Embarrassing in production | Low | Low |
| TD-02 | `Math.random()` in chart generation | **Critical** | Non-deterministic UI | Low | Low |
| TD-03 | `eslint-disable` hiding stale state bug in TopicDrawer | **High** | Data corruption risk | Medium | Medium |
| TD-04 | `mockData.ts` misnamed; types + utils mixed | **High** | Developer confusion | Low | Low |
| TD-05 | `boardIcons` / `heatmapColors` duplicated 3× | **High** | Divergence risk | Low | Low |
| TD-06 | Every mutation triggers full `fetchAll()` | **High** | Performance degrades with data | High | Medium |
| TD-07 | No delete confirmation for topics | **High** | Accidental data loss | Low | Low |
| TD-08 | Progress slider missing from TopicDrawer | **High** | Feature completeness | Low | Low |
| TD-09 | Tags uneditable from TopicDrawer | **High** | Feature completeness | Medium | Low |
| TD-10 | Delete checklist item / resource missing from UI | **High** | Feature completeness | Low | Low |
| TD-11 | `App.tsx` too many responsibilities | **Medium** | Maintainability | Medium | Low |
| TD-12 | No browser history / URL routing | **Medium** | UX regression on back-button | High | Medium |
| TD-13 | DesignSystem page in production nav | **Medium** | Unprofessional in production | Low | Low |
| TD-14 | Bell + Star buttons are non-functional placeholders | **Medium** | Unprofessional in production | Low | Low |
| TD-15 | `sortRank` fragile string-matching in BoardsList | **Medium** | Sort breaks on edge cases | Low | Low |
| TD-16 | `Date.now()` IDs not collision-safe | **Medium** | Duplicate ID risk | Low | Low |
| TD-17 | No lazy loading of views | **Low** | Bundle size / initial load | Medium | Low |
| TD-18 | `package.json` name is scaffolding default | **Low** | Polish | Low | Low |
| TD-19 | No `.env.example` | **Low** | New developer onboarding | Low | Low |
| TD-20 | No README or architecture docs | **Low** | Onboarding + portfolio value | Low | Low |

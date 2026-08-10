# Changelog

All notable changes to Learning Tracker are recorded here.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

### Added
- Progress slider in TopicDrawer (range input, step 5%)
- Tag add/remove in TopicDrawer (Enter or comma to add, × to remove)
- Delete checklist item UI — trash icon on hover per item
- Delete resource UI — trash icon on hover per resource
- Confirmation dialog for topic deletion (TopicDrawer and BoardView)
- Confirmation dialog for board deletion (BoardsList)
- `ConfirmDialog` reusable UI primitive (`src/components/ui/`)
- `computeStreak` — real streak computed from `updatedAt` timestamps
- `generateWeeklyActivity` — real weekly count, no random padding
- `updatedAtRaw` field on `Board` for reliable timestamp-based sorting
- `.env.example` with documented environment variables
- Full documentation suite (`docs/`)

### Changed
- `src/data/mockData.ts` replaced by `src/types/`, `src/config/`, `src/utils/`
- `boardIcons` constant — single source in `src/config/index.ts` (was duplicated 3×)
- `heatmapColors` constant — single source in `src/config/index.ts` (was duplicated 2×)
- BoardsList sort — uses `updatedAtRaw` ISO timestamp (was fragile string-rank map)
- ID generation — `crypto.randomUUID()` via `generateId()` (was `Date.now()`)
- Checklist and resource mutations — optimistic updates with rollback on error
- TopicDrawer stale-state fix — sync via `useRef` comparison, no `eslint-disable`
- Dashboard greeting — removed hardcoded "Alex", shows real streak or generic heading
- `package.json` name — `learning-tracker` (was Vite scaffolding default)

### Removed
- `src/data/mockData.ts` — split into typed modules, file deleted
- Bell notification button with fake amber badge (header)
- Star/favourite button with no action (TopicDrawer)
- DesignSystem page from sidebar navigation (component kept for dev reference)
- Hardcoded streak values (23 days current, 41 days best)
- `Math.random()` in `generateWeeklyHours`
- `sortRank` string-matching function in BoardsList
- `package.json.bak`

### Fixed
- `eslint-disable-line react-hooks/exhaustive-deps` in TopicDrawer — underlying stale-state bug resolved
- Duplicate board generates unique UUIDs per topic (was `Date.now()` in sync loop)

---

## [2.0.0] — 2026-08

### Added
- React + TypeScript rewrite of the legacy Angular application
- Supabase backend (PostgreSQL + RLS) replacing LocalStorage
- Five-stage Kanban board view per learning board
- TopicDrawer with checklist, resources, notes, history, review date
- Dashboard with activity heatmap, upcoming reviews, board overview
- Statistics view with charts (status, difficulty, type, board progress)
- Calendar view with review date events
- Global search palette (Cmd+K)
- Dark/light theme with persistence
- JSON export and import
- DesignSystem reference page (internal)

---

## [1.x] — Legacy (Angular)

The original Angular application is archived separately. It used LocalStorage as its backend and served as the product and UX reference for v2.

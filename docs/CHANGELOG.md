# Changelog

All notable changes to Learning Tracker are recorded here.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

### Added
- Drag-and-drop topic cards between Kanban columns (`@dnd-kit/core`)
- `DragOverlay` — ghost card with subtle rotation during drag
- `updateTopicStatus` — optimistic status update with rollback on error
- Supabase Realtime subscription — multi-tab sync on any DB change
- Realtime connection status indicator in Sidebar footer (Live / Connecting / Disconnected)
- Migration `20260809000000_enable_realtime.sql` — enables `postgres_changes` for both tables
- Progress slider in TopicDrawer (range input, step 5%)
- Tag add/remove in TopicDrawer (Enter or comma to add, × to remove)
- Delete checklist item UI — trash icon on hover
- Delete resource UI — trash icon on hover
- Confirmation dialog for topic deletion
- Confirmation dialog for board deletion
- `computeStreak` — real streak from `updatedAt` timestamps
- `generateWeeklyActivity` — real weekly count, no random padding
- `updatedAtRaw` field on `Board` for reliable timestamp-based sorting
- `.env.example` with documented environment variables
- Full documentation suite in `docs/`

### Changed
- `src/data/mockData.ts` replaced by `src/types/`, `src/config/`, `src/utils/`
- `boardIcons` — single source in `src/config/index.ts`
- `heatmapColors` — single source in `src/config/index.ts`
- BoardsList sort uses `updatedAtRaw` ISO timestamp (was fragile string-rank map)
- ID generation — `crypto.randomUUID()` via `generateId()` (was `Date.now()`)
- Checklist and resource mutations — optimistic updates with rollback
- TopicDrawer stale-state fix — sync via `useRef`, no `eslint-disable`
- Dashboard — real streak, real activity, proper empty state with onboarding
- TopicDrawer description — editable textarea with onBlur save
- TopicDrawer title — click-to-edit inline
- `package.json` name — `learning-tracker`
- React Router v6 — URL navigation, `?topic=` query param for drawer
- Lazy loading — Statistics, CalendarView, SettingsView are separate chunks
- Sidebar uses `<NavLink>` — active state from URL
- `PointerSensor` activation constraint `distance: 8` prevents accidental drag on card click

### Removed
- `src/data/mockData.ts` — split into typed modules
- Bell notification button with fake badge
- Star/favourite button with no action
- DesignSystem from sidebar navigation
- Hardcoded streak values and `Math.random()` in chart data
- `sortRank` string-matching in BoardsList
- `audit.json` process artifact

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

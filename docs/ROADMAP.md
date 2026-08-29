# Roadmap

**Project:** Learning Tracker  
**Last Updated:** 2026-08-28

---

## Currently Built (v2.4)

### Core

- [x] Board CRUD — create, edit, delete, duplicate
- [x] Topic CRUD — create, edit, delete (with confirmation), duplicate
- [x] Kanban column view per board (5 fixed stages)
- [x] Drag-and-drop topic cards between columns (`@dnd-kit`, optimistic status update, `DragOverlay`)
- [x] Status transitions with history tracking
- [x] Checklist with item add, toggle, delete
- [x] Resource links with add, toggle done, delete
- [x] Notes — auto-saved on blur
- [x] Deadline date scheduling
- [x] Topic difficulty metadata
- [x] Tag add and remove (normalised via `tags` + `topic_tags`)
- [x] Inline topic title editing
- [x] Editable topic description in drawer
- [x] Filter topics within board view (difficulty)

### Navigation

- [x] React Router v7 — URL navigation, working browser back/forward
- [x] Topic drawer as `?topic=<id>` query param — deep-linkable, survives navigation
- [x] Sidebar active state derived from URL (`<NavLink>`)

### Search & Discovery

- [x] Global search palette (Cmd+K) — topics and boards
- [x] Board filter in sidebar
- [x] Board sort by recent / A-Z / progress (using raw timestamps)

### Dashboard & Analytics

- [x] Real streak — computed from real study activity (`history` entries: status moves + field edits, not raw timestamps)
- [x] Real weekly activity — counted from `history`, no random padding, no false spikes from topic creation/import
- [x] Activity heatmap (36 weeks) — derived from `history`
- [x] Upcoming deadlines panel
- [x] Recently updated topics
- [x] Board overview grid
- [x] Empty state with step-by-step onboarding

### Statistics

- [x] Weekly activity chart (Moved + Updated series)
- [x] This week bar chart (per day)
- [x] Status distribution donut
- [x] Board breakdown progress bars
- [x] Skill coverage radar chart
- [x] Difficulty distribution

### Calendar

- [x] Monthly view
- [x] Deadline date events

### Settings

- [x] Dark / light theme with persistence
- [x] JSON export
- [x] JSON import
- [x] Reset statistics (batch update — single query for status/history, minimal checklist pass)
- [x] Reset all data

### Auth & Security

- [x] Supabase Auth — email/password sign-in and sign-up
- [x] Password reset flow
- [x] `profiles` table with `role: user | admin`
- [x] RLS — `auth.uid() = user_id` on `boards` and `topics`
- [x] RLS — `tags` readable by all authenticated users; `system` tags write-protected
- [x] RLS — `topic_tags` scoped to topic owner
- [x] `AuthContext` + `useAuth` hook
- [x] `ProtectedRoute` / `AdminRoute` wrappers
- [x] `AdminView` — Knowledge Library CRUD; platform-wide statistics placeholder (Stage 2)

### Knowledge Library

- [x] `library_topics` + `library_topic_tags` — global, curated topics with normalised tags
- [x] `LibraryView` (`/library`) — browse by category, search, tag filter
- [x] "Add to Board" — copy a library topic into an existing board or a newly created one
- [x] Duplicate warning — non-blocking; the same library topic may be added to more than one board
- [x] Admin CRUD for library topics (create / edit / delete) inside `AdminView`
- [x] Seeded from existing topics — deduplicated by title, category = source board title, tags carried over
- [x] Copy-on-add — user's copy is fully independent; editing either side never affects the other

### Infrastructure

- [x] Supabase PostgreSQL backend
- [x] Supabase Realtime — multi-tab sync, connection status indicator in Sidebar
- [x] Optimistic updates for checklist, resource, and drag-and-drop status operations
- [x] Collision-safe UUIDs via `crypto.randomUUID()`
- [x] `history` array capped at 50 entries per topic
- [x] Confirmation dialogs for all destructive actions
- [x] Lazy-loaded route chunks — Statistics, CalendarView, SettingsView
- [x] `BoardView` and `TopicDrawer` split into focused sub-components (`components/board/`, `components/drawer/`)
- [x] TypeScript strict mode
- [x] ESLint clean

---

## Next Up

| ID | Feature | Priority | Notes |
|----|---------|----------|-------|
| BL-012 | PWA / Offline support | Low | High complexity. Needs design work on conflict resolution with optimistic updates (DL-007) before implementation. |
| — | Curated Tracks (e.g. "Frontend Developer") | Future | Deliberately deferred until Knowledge Library usage patterns are clearer (DL-018). |
| — | Prerequisite relationships between library topics | Future | Deliberately deferred (DL-018). |
| — | Propagate library topic edits to already-copied user topics | Future | Deliberately deferred — copy-on-add is intentionally one-directional (DL-018). |

---

## Design Constraints

These product principles must be preserved as new features are added:

1. **Any action in under 3 clicks** — the UX must stay fast
2. **Data portability** — export/import must always work
3. **Visual progress** — learning progress must be visible from every view

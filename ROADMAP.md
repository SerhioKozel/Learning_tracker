# Roadmap

**Project:** Learning Tracker  
**Last Updated:** 2026-08-16

---

## Currently Built (v2.2)

### Core

- [x] Board CRUD — create, edit, delete, duplicate
- [x] Topic CRUD — create, edit, delete (with confirmation), duplicate
- [x] Kanban column view per board (5 fixed stages)
- [x] Drag-and-drop topic cards between columns (`@dnd-kit`, optimistic status update, `DragOverlay`)
- [x] Status transitions with history tracking
- [x] Progress slider (0–100%, step 5%)
- [x] Checklist with item add, toggle, delete
- [x] Resource links with add, toggle done, delete
- [x] Notes — auto-saved on blur
- [x] Review date scheduling
- [x] Topic difficulty metadata
- [x] Tag add and remove
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

- [x] Real streak — computed from `updatedAt` timestamps
- [x] Real weekly activity — counted from actual data, no random padding
- [x] Activity heatmap (36 weeks)
- [x] Upcoming reviews panel
- [x] Recently updated topics
- [x] Board overview grid
- [x] Empty state with step-by-step onboarding

### Statistics

- [x] Weekly activity bar chart
- [x] Status distribution + donut
- [x] Board progress bars
- [x] Difficulty distribution

### Calendar

- [x] Monthly view
- [x] Review date events

### Settings

- [x] Dark / light theme with persistence
- [x] JSON export
- [x] JSON import
- [x] Reset all data

### Infrastructure

- [x] Supabase PostgreSQL backend
- [x] Supabase Realtime — multi-tab sync, connection status indicator in Sidebar
- [x] Optimistic updates for checklist, resource, and drag-and-drop status operations
- [x] Collision-safe UUIDs via `crypto.randomUUID()`
- [x] `history` array capped at 50 entries per topic
- [x] Confirmation dialogs for all destructive actions
- [x] Lazy-loaded route chunks — Statistics, CalendarView, SettingsView
- [x] `BoardView` and `TopicDrawer` split into focused sub-components (`components/board/`, `components/drawer/`)
- [x] TypeScript strict mode — zero errors
- [x] ESLint clean — zero warnings

---

## Next Up

Everything from the original Phase 2/3/4 plan has shipped — see [BACKLOG.md](./BACKLOG.md) for the full list of completed work (BL-001 through BL-010, BL-013, BL-014).

Two items remain open, both deliberately deferred because they're higher-risk and change the single-user trust model:

| ID | Feature | Priority | Why it's separate from cleanup work |
|----|---------|----------|--------------------------------------|
| BL-011 | Authentication (Supabase Auth) | Required before public deployment | Changes the RLS trust model (`USING (true)` → `auth.uid() = user_id`) and adds a sign-in flow. See BACKLOG.md for the migration strategy. |
| BL-012 | PWA / offline support | High complexity | Needs a service worker, an IndexedDB read cache, and a mutation queue for writes made offline. Conflicts with DL-007's optimistic-update model need design work first. |

---

## Design Constraints

These product principles must be preserved as new features are added:

1. **Any action in under 3 clicks** — the UX must stay fast
2. **Data portability** — export/import must always work
3. **Single-user simplicity** — do not add complexity that only matters for multi-user scenarios
4. **Visual progress** — learning progress must be visible from every view

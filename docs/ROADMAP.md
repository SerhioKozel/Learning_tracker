# Roadmap

**Project:** Learning Tracker  
**Last Updated:** 2026-08-09

---

## Currently Built (v2.1)

### Core

- [x] Board CRUD — create, edit, delete, duplicate
- [x] Topic CRUD — create, edit, delete (with confirmation)
- [x] Kanban column view per board (5 fixed stages)
- [x] Status transitions with history tracking
- [x] Progress slider (0–100%, step 5%)
- [x] Checklist with item add, toggle, delete
- [x] Resource links with add, toggle done, delete
- [x] Notes — auto-saved on blur
- [x] Review date scheduling
- [x] Topic type and difficulty metadata
- [x] Tag add and remove

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

### Statistics

- [x] Weekly activity bar chart
- [x] Status distribution + donut
- [x] Board progress bars
- [x] Difficulty distribution
- [x] Topic type breakdown

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
- [x] Optimistic updates for checklist and resource operations
- [x] Collision-safe UUIDs via `crypto.randomUUID()`
- [x] Confirmation dialogs for all destructive actions
- [x] TypeScript strict mode — zero errors
- [x] ESLint clean — zero warnings

---

## Phase 2 — Completeness (Next)

Tracked in [BACKLOG.md](./BACKLOG.md).

| ID | Feature | Priority |
|----|---------|----------|
| BL-001 | Cap history array at 50 entries | High |
| BL-002 | Duplicate topic | High |
| BL-003 | Filter topics within board view (status, type, difficulty) | High |
| BL-004 | Editable topic description in drawer | High |
| BL-006 | Lazy-load view components | Medium |
| BL-007 | Inline topic title editing | Medium |
| BL-008 | Improved empty state for new users | Medium |

---

## Phase 3 — Architecture

| ID | Feature | Priority |
|----|---------|----------|
| BL-005 | React Router — URL navigation, back button | Medium |
| BL-010 | Supabase Realtime — multi-tab sync | Medium |

---

## Phase 4 — Growth Features

| ID | Feature | Notes |
|----|---------|-------|
| BL-009 | Drag-and-drop topic cards between columns | Requires `@dnd-kit` |
| BL-011 | Authentication (Supabase Auth) | Required before public deployment |
| BL-012 | PWA / offline support | High complexity |

---

## Design Constraints

These product principles must be preserved as new features are added:

1. **Any action in under 3 clicks** — the UX must stay fast
2. **Data portability** — export/import must always work
3. **Single-user simplicity** — do not add complexity that only matters for multi-user scenarios
4. **Visual progress** — learning progress must be visible from every view

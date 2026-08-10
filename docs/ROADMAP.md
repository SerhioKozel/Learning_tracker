# Roadmap

**Project:** Learning Tracker  
**Last Updated:** 2026-08-07  

This roadmap tracks what is built, what is missing, and what is planned. It is derived from the original functional requirements (FR-xxx), the audit findings, and the improvement backlog.

---

## Currently Built (v2 baseline)

### Core

- [x] Board CRUD (create, edit, delete, duplicate)
- [x] Topic CRUD (create, edit, delete)
- [x] Kanban column view per board (5 fixed stages)
- [x] Topic drawer with full detail panel
- [x] Status transitions with history tracking
- [x] Checklist with progress tracking
- [x] Resource links (URL, book, video, docs, GitHub)
- [x] Notes (auto-saved on blur)
- [x] Review date scheduling
- [x] Topic type and difficulty metadata
- [x] Tags display

### Search & Filter

- [x] Global search palette (Cmd+K) — topics and boards
- [x] Board filtering in sidebar
- [x] Board sort by updated / name / progress in BoardsList

### Dashboard & Analytics

- [x] Overview stats (progress, active, completed, streak placeholder)
- [x] Recent boards grid
- [x] Upcoming reviews panel
- [x] Recently updated topics
- [x] Activity heatmap
- [x] Weekly activity chart

### Statistics

- [x] Board completion chart
- [x] Status distribution
- [x] Difficulty distribution
- [x] Topic type distribution
- [x] SVG mastery ring

### Calendar

- [x] Monthly calendar view
- [x] Review date events

### Settings

- [x] Dark/light theme toggle
- [x] Export data (JSON)
- [x] Import data (JSON)
- [x] Reset all data

---

## Phase 2 — Quality and Completeness

These items close gaps in the current build. They are tracked in the backlog (BACKLOG.md).

### Critical (now)

- [ ] Remove hardcoded user data (name, streak, fake hours) — TASK-01
- [ ] Rename `mockData.ts` and split types/config/utils — TASK-02
- [ ] Fix stale state in TopicDrawer (remove eslint-disable) — TASK-03

### High (next sprint)

- [ ] Extract shared `boardIcons` / `heatmapColors` constants — TASK-04
- [ ] Delete confirmation dialogs for topics and boards — TASK-05
- [ ] Progress slider in TopicDrawer — TASK-06
- [ ] Tag add/remove in TopicDrawer — TASK-07
- [ ] Delete checklist item UI — TASK-08 (FR-402)
- [ ] Delete resource UI — TASK-08 (FR-502)
- [ ] Remove DesignSystem from production nav — TASK-09
- [ ] Remove non-functional Bell and Star placeholders — TASK-10
- [ ] Fix `sortRank` fragility with raw timestamps — TASK-11

### Medium (following sprint)

- [ ] Extract keyboard shortcuts and modals from App.tsx — TASK-12
- [ ] Optimistic updates for toggle operations — TASK-13
- [ ] `.env.example`, README, update package.json name — TASK-14

### Low

- [ ] Lazy load views — TASK-15
- [ ] Collision-safe UUID generation — TASK-16
- [ ] Compute real streak from activity data — TASK-17

---

## Phase 3 — Deferred Features

From original functional requirements (FR-xxx):

- [ ] FR-304: Duplicate topic
- [ ] FR-703: Filter topics by status / type / difficulty within board view
- [ ] FR-201/202/203: Column reordering, renaming, custom columns

---

## Phase 4 — Future Vision

These items are out of scope for the current version but the architecture should not prevent them:

### User Experience
- **Drag-and-drop topic cards** between Kanban columns — the most impactful missing UX feature for a Kanban tool
- **Inline topic title editing** — double-click a card to rename
- **Keyboard navigation** between topics and columns
- **Duplicate topic** (FR-304)

### Data & Sync
- **URL routing** — browser back button works, deep-linking to boards/topics
- **Offline support** — PWA with service worker, sync on reconnect
- **Authentication** — Supabase Auth, user-scoped data
- **Multi-device sync** — real-time via Supabase subscriptions

### Product Features
- **Notifications / reminders** — review date alerts
- **Board templates** — pre-built topic sets for common learning paths (e.g. "Full-Stack Web Dev")
- **Spaced repetition scheduling** — auto-schedule review dates based on topic history
- **Learning time tracking** — log sessions against topics
- **Mobile application** — React Native or PWA

---

## Design Constraints (must not change)

The following product principles must be preserved as new features are added:

1. **Any action in under 3 clicks** — the UX must stay fast
2. **Data portability** — export/import must always work
3. **Single-user simplicity** — do not add complexity that only matters for multi-user scenarios
4. **Visual progress** — learning progress must always be immediately visible from any view

# Architecture

**Project:** Learning Tracker  
**Stack:** React 18 · TypeScript · Vite · Tailwind CSS · Supabase  
**Last Updated:** 2026-08-09

---

## Overview

Learning Tracker is a single-page application with a deliberate three-layer architecture:

```
┌────────────────────────────────────────────────────┐
│  UI Layer                                          │
│  App.tsx + view components + ui primitives         │
├────────────────────────────────────────────────────┤
│  State Layer                                       │
│  useDataStore — owns all remote state + mutations  │
├────────────────────────────────────────────────────┤
│  Data Layer                                        │
│  Supabase (PostgreSQL + RLS), via supabase-js      │
└────────────────────────────────────────────────────┘
```

The architecture is intentionally simple. The application is single-user, has no authentication flow, and has no complex derived state that would justify a state management library or server-state cache.

---

## Source Layout

```
src/
├── types/
│   └── index.ts          # All domain type definitions
├── config/
│   └── index.ts          # Semantic config maps + shared constants
├── utils/
│   ├── analytics.ts      # Heatmap, weekly activity, streak
│   ├── date.ts           # timeAgo
│   ├── id.ts             # generateId (crypto.randomUUID)
│   └── status.ts         # computeStatusChange — shared by TopicDrawer and DnD
├── lib/
│   └── supabase.ts       # Supabase client singleton
├── hooks/
│   └── useDataStore.ts   # All remote state and mutations
├── components/
│   ├── ui/
│   │   └── ConfirmDialog.tsx
│   ├── board/             # BoardView sub-components (BL-014)
│   │   └── BoardFilters.tsx, CardContent.tsx, DraggableCard.tsx, DroppableColumn.tsx
│   ├── drawer/             # TopicDrawer sub-components (BL-013)
│   │   └── TopicHeader.tsx, TopicProperties.tsx, TopicChecklist.tsx, TopicResources.tsx, TopicNotes.tsx, TopicHistory.tsx
│   ├── Sidebar.tsx
│   ├── Dashboard.tsx
│   ├── BoardsList.tsx
│   ├── BoardView.tsx
│   ├── TopicDrawer.tsx
│   ├── Statistics.tsx
│   ├── CalendarView.tsx
│   ├── SettingsView.tsx
│   └── DesignSystem.tsx  # Reference only — no route, unreachable from the UI
├── App.tsx               # Root layout, routing, modals, shortcuts
├── main.tsx
└── index.css             # Design tokens + Tailwind layers
```

---

## Domain Model

```
Board
  id, title, description
  color: sky | teal | amber | rose | emerald
  icon: Layout | Network | Binary | Server | Cloud
  topicCount, completedCount        ← computed on read
  updatedAt (formatted), updatedAtRaw (ISO)

Topic
  id, title, description
  status: to_learn | learning | practice | review | completed
  boardId → Board (cascade delete)
  type: learning | book | video | course | documentation | ...
  difficulty: easy | medium | hard
  progress: 0–100
  tags: string[]
  reviewDate: date | null
  checklist: ChecklistItem[]        ← JSONB
  resources: Resource[]             ← JSONB
  notes: string
  history: HistoryEntry[]           ← JSONB (last 50)
  updatedAt (formatted), updatedAtRaw (ISO), createdAt
```

All domain types live in `src/types/index.ts`.  
All semantic mappings (labels, colors, icons per status/type/difficulty) live in `src/config/index.ts`.

---

## Component Responsibilities

### `App.tsx` — Layout shell

Owns:
- Theme (dark/light) + `localStorage` persistence
- Search palette (open, query, results)
- New topic modal
- Keyboard shortcut listeners (`Cmd+K`, `Escape`) — unified in one `useEffect`

Reads navigation state from the URL via React Router (`useParams`, `useLocation`) rather than owning it — `boardId` comes from the route, and `activeTopicId` comes from the `?topic=` query param. See [View Routing](#view-routing) below.

Passes all data and callbacks downward as props. No context, no global store.

### View components

| Component | Responsibility |
|-----------|---------------|
| `Sidebar.tsx` | Navigation, board list with progress, filter input |
| `Dashboard.tsx` | Stats (real streak, real activity), heatmap, upcoming reviews, recent topics |
| `BoardsList.tsx` | Board CRUD, sort by `updatedAtRaw` timestamp |
| `BoardView.tsx` | Kanban layout, filters, DnD wiring (`@dnd-kit`) — orchestrates the `board/` sub-components below |
| `TopicDrawer.tsx` | Drawer layout and local field state — orchestrates the `drawer/` sub-components below |
| `Statistics.tsx` | Weekly activity chart, status donut, board progress, difficulty distribution |
| `CalendarView.tsx` | Monthly calendar with review date events |
| `SettingsView.tsx` | Theme toggle, JSON export/import, data reset |

### `src/components/board/` — BoardView sub-components (BL-014)

| Component | Responsibility |
|-----------|---------------|
| `BoardFilters.tsx` | Search input + difficulty/type filter dropdown |
| `CardContent.tsx` | Shared card body — used by both `DraggableCard` and the `DragOverlay` ghost card |
| `DraggableCard.tsx` | `useDraggable` wrapper around `CardContent` |
| `DroppableColumn.tsx` | `useDroppable` wrapper for a single Kanban column |

### `src/components/drawer/` — TopicDrawer sub-components (BL-013)

| Component | Responsibility |
|-----------|---------------|
| `TopicHeader.tsx` | Title, description, status pills, duplicate/delete/close actions |
| `TopicProperties.tsx` | Type, difficulty, progress slider, review date, tags |
| `TopicChecklist.tsx` | Checklist items — add, toggle, delete |
| `TopicResources.tsx` | Resource links — add, toggle done, delete |
| `TopicNotes.tsx` | Notes textarea, auto-saved on blur |
| `TopicHistory.tsx` | Read-only history entry list |

### `src/components/ui/` — Primitives

| Component | Responsibility |
|-----------|---------------|
| `ConfirmDialog.tsx` | Reusable modal for destructive actions. Used by BoardsList and BoardView and TopicDrawer |

---

## State Management

### `useDataStore`

Single hook. Owns all remote state. Exposes:

```typescript
// State
boards: Board[]
topics: Topic[]
loading: boolean
error: string | null
refresh: () => Promise<void>

// Board mutations (write → fetchAll)
createBoard, updateBoard, deleteBoard, duplicateBoard

// Topic mutations (write → fetchAll)
createTopic, updateTopic, deleteTopic

// Sub-item mutations (optimistic: local update first, Supabase second, rollback on error)
addChecklistItem, deleteChecklistItem
addResource, deleteResource

// Data portability
exportData, importData, resetData
```

**Mutation strategy:**

- `createBoard / updateBoard / deleteBoard / createTopic / updateTopic / deleteTopic` — write to Supabase, then call `fetchAll()` for full consistency.
- `addChecklistItem / deleteChecklistItem / addResource / deleteResource` — optimistic: apply to local state immediately for instant UI feedback, write to Supabase in background, rollback on error. No `fetchAll()`.

**Why no `fetchAll` on sub-items:** These are toggled repeatedly (checkbox, resource done) and the optimistic update is the correct final state in the vast majority of cases. The rollback covers the rare network failure.

---

## Data Flow

```
User interaction (e.g. toggle checklist item)
        │
        ▼
  Component calls prop callback
  (e.g. onDeleteChecklistItem)
        │
        ▼
  App.tsx delegates to store method
        │
        ├─── Optimistic? ──► Update local topics state immediately
        │                    (component re-renders instantly)
        │
        ▼
  useDataStore writes to Supabase
        │
        ├─── Success? ──► No action (local state already correct)
        │
        └─── Error? ──► Rollback local state + set error
```

---

## Database Schema

```sql
-- boards
CREATE TABLE boards (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  description text NOT NULL DEFAULT '',
  color       text NOT NULL DEFAULT 'sky'
                   CHECK (color IN ('sky','teal','amber','rose','emerald')),
  icon        text NOT NULL DEFAULT 'Layout',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- topics
CREATE TABLE topics (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  description text NOT NULL DEFAULT '',
  status      text NOT NULL DEFAULT 'to_learn'
                   CHECK (status IN ('to_learn','learning','practice','review','completed')),
  board_id    uuid NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  type        text NOT NULL DEFAULT 'learning',
  difficulty  text NOT NULL DEFAULT 'medium',
  progress    integer NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  tags        text[] NOT NULL DEFAULT '{}',
  review_date date,
  checklist   jsonb NOT NULL DEFAULT '[]',
  resources   jsonb NOT NULL DEFAULT '[]',
  notes       text NOT NULL DEFAULT '',
  history     jsonb NOT NULL DEFAULT '[]',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
```

`checklist`, `resources`, `history` are JSONB arrays — avoids junction tables for a single-user app. See [DECISION-LOG.md](./DECISION-LOG.md#dl-005) for rationale.

---

## View Routing

React Router v7 (`react-router-dom`) with `BrowserRouter` mounted in `main.tsx`.

```
/              → Dashboard
/boards        → BoardsList
/boards/:id    → BoardView
/stats         → Statistics
/calendar      → CalendarView
/settings      → SettingsView
*              → redirect to /
```

**Topic drawer** renders as an overlay on top of any route. The active topic is stored as a `?topic=<id>` query parameter — this means drawer state survives navigation and is deep-linkable (e.g. `/boards/abc123?topic=xyz789`).

**Sidebar** uses `<NavLink>` — active state is derived from the URL, not from component state.

**Browser back/forward** works correctly across all routes. Previously this was a known limitation (DL-003).

---

## Security Model

RLS is enabled on both tables. Policies use `USING (true)` — any holder of the anon key can read and write all data. This is correct for a personal, self-hosted tool.

**Do not share your `VITE_SUPABASE_ANON_KEY` publicly.** See [SECURITY.md](../SECURITY.md) for full guidance.

---

## Known Limitations

| # | Limitation | Tracked In |
|---|-----------|-----------|
| 1 | Full `fetchAll()` on structural mutations — degrades at scale | No tracked BL item; migration path documented in DECISION-LOG.md, DL-002 (React Query) |
| 2 | No offline support — requires network | BL-012 |
| 3 | No authentication — anon key access only | BL-011 |
| 4 | `history` array capped at 50 entries (older entries discarded) | BL-001 ✅ |

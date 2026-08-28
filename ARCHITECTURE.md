# Architecture

**Project:** Learning Tracker  
**Stack:** React 18 · TypeScript · Vite · Tailwind CSS · Supabase  
**Last Updated:** 2026-08-27

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
├── contexts/
│   └── AuthContext.tsx   # AuthProvider + useAuth hook
├── hooks/
│   └── useDataStore.ts   # All remote state and mutations
├── components/
│   ├── ui/
│   │   ├── ConfirmDialog.tsx
│   │   └── Routes.tsx    # ProtectedRoute + AdminRoute wrappers
│   ├── board/            # BoardView sub-components (BL-014)
│   │   └── BoardFilters.tsx, CardContent.tsx, DraggableCard.tsx, DroppableColumn.tsx
│   ├── drawer/           # TopicDrawer sub-components (BL-013)
│   │   └── TopicHeader.tsx, TopicProperties.tsx, TopicChecklist.tsx, TopicResources.tsx, TopicNotes.tsx, TopicHistory.tsx
│   ├── Sidebar.tsx
│   ├── Dashboard.tsx
│   ├── BoardsList.tsx
│   ├── BoardView.tsx
│   ├── TopicDrawer.tsx
│   ├── Statistics.tsx
│   ├── CalendarView.tsx
│   ├── SettingsView.tsx
│   ├── AuthView.tsx      # Sign-in / sign-up / reset-password UI
│   ├── AdminView.tsx     # Admin-only: platform statistics
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
  color: sky | cyan | teal | emerald | amber | orange | rose | violet | indigo
  icon: Layout | Network | Binary | Server | Cloud
  userId → auth.users (cascade delete)
  topicCount, completedCount        ← computed on read
  updatedAt (formatted), updatedAtRaw (ISO)

Topic
  id, title, description
  status: to_learn | learning | practice | review | completed
  boardId → Board (cascade delete)
  userId → auth.users (cascade delete)
  difficulty: easy | medium | hard
  tags: string[]                    ← names from topic_tags join; not stored in topics row
  reviewDate: date | null           ← @deprecated; preserved for data compatibility
  deadlineDate: date | null
  checklist: ChecklistItem[]        ← JSONB
  resources: Resource[]             ← JSONB
  notes: string
  history: HistoryEntry[]           ← JSONB (last 50)
  updatedAt (formatted), updatedAtRaw (ISO), createdAt

Tag                                 ← global, shared across all users
  id, name, slug, color
  type: system | custom
  createdAt

TopicTag                            ← junction: Topic ↔ Tag (cascade delete both sides)
  topicId → Topic
  tagId → Tag
  createdAt

Profile                             ← one row per auth.users entry (created by trigger)
  id → auth.users
  role: user | admin
  createdAt
```

**Note — два механизма тегов, данные расходятся (tech debt TD-21 — закрыто):** Миграция на `tags` + `topic_tags` завершена. `topics.tags text[]` удалена. `useDataStore` читает теги через join `topic_tags → tags`.

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
| `CalendarView.tsx` | Monthly calendar with deadline date events |
| `SettingsView.tsx` | Theme toggle, JSON export/import, data reset |
| `AuthView.tsx` | Sign-in / sign-up / reset-password forms |
| `AdminView.tsx` | Admin-only view: platform-wide statistics across all users |

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
| `ConfirmDialog.tsx` | Reusable modal for destructive actions. Used by BoardsList, BoardView and TopicDrawer |
| `Routes.tsx` | `ProtectedRoute` — redirects unauthenticated users to `/auth`; `AdminRoute` — redirects non-admins to `/` |

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
realtimeStatus: 'connecting' | 'connected' | 'disconnected'
refresh: () => Promise<void>

// Board mutations (write → fetchAll)
createBoard, updateBoard, deleteBoard, duplicateBoard

// Topic mutations (write → fetchAll)
createTopic, updateTopic, updateTopicStatus, duplicateTopic, deleteTopic

// Sub-item mutations (optimistic: local update first, Supabase second, rollback on error)
addChecklistItem, deleteChecklistItem, toggleChecklistItem
addResource, deleteResource, toggleResource

// Data management
exportData, importData, resetStats, resetData
```

**Mutation strategy:**

- `createBoard / updateBoard / deleteBoard / createTopic / updateTopic / deleteTopic` — write to Supabase, then call `fetchAll()` for full consistency.
- `updateTopicStatus` — optimistic: applies status change locally immediately (used by DnD), writes to Supabase in background, rollback on error. No `fetchAll()`.
- `addChecklistItem / deleteChecklistItem / toggleChecklistItem / addResource / deleteResource / toggleResource` — optimistic: apply to local state immediately for instant UI feedback, write to Supabase in background, rollback on error. No `fetchAll()`.

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
                   CHECK (color IN ('sky','cyan','teal','emerald','amber','orange','rose','violet','indigo')),
  icon        text NOT NULL DEFAULT 'Layout',
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- topics
CREATE TABLE topics (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL,
  description   text NOT NULL DEFAULT '',
  status        text NOT NULL DEFAULT 'to_learn'
                     CHECK (status IN ('to_learn','learning','practice','review','completed')),
  board_id      uuid NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  difficulty    text NOT NULL DEFAULT 'medium',
  review_date   date,
  deadline_date date,
  checklist     jsonb NOT NULL DEFAULT '[]',
  resources     jsonb NOT NULL DEFAULT '[]',
  notes         text NOT NULL DEFAULT '',
  history       jsonb NOT NULL DEFAULT '[]',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- tags (global — shared across all users; no user_id)
CREATE TABLE tags (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL CHECK (length(trim(name)) > 0),
  slug       text NOT NULL CHECK (length(trim(slug)) > 0),
  color      text NOT NULL CHECK (length(trim(color)) > 0),
  type       text NOT NULL DEFAULT 'custom'
                  CHECK (type IN ('system', 'custom')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX tags_system_slug_unique ON tags (slug) WHERE type = 'system';
CREATE UNIQUE INDEX tags_custom_slug_unique ON tags (slug) WHERE type = 'custom';

-- topic_tags (junction: Topic ↔ Tag)
CREATE TABLE topic_tags (
  topic_id   uuid NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  tag_id     uuid NOT NULL REFERENCES tags(id)   ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (topic_id, tag_id)
);

-- profiles (one row per auth.users, created by trigger on sign-up)
CREATE TABLE profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role       text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now()
);
```

`checklist`, `resources`, `history` are JSONB arrays — avoids junction tables for sub-items. See [DECISION-LOG.md](./DECISION-LOG.md#dl-005) for rationale.

**Removed columns (vs. earlier versions):**
- `topics.type` — dropped in migration `20260825000000_drop_topic_type.sql`
- `topics.progress` — never existed in DB; removed from code in Aug 2026
- `topics.tags text[]` — dropped in migration `20260827000000_drop_topics_tags_array.sql`; replaced by `tags` + `topic_tags`

---

## View Routing

React Router v7 (`react-router-dom`) with `BrowserRouter` mounted in `main.tsx`.

```
/auth          → AuthView (public — redirects to / if already signed in)
/              → Dashboard         (protected)
/boards        → BoardsList        (protected)
/boards/:id    → BoardView         (protected)
/stats         → Statistics        (protected)
/calendar      → CalendarView      (protected)
/settings      → SettingsView      (protected)
/admin         → AdminView         (admin only)
*              → redirect to /
```

**Topic drawer** renders as an overlay on top of any route. The active topic is stored as a `?topic=<id>` query parameter — this means drawer state survives navigation and is deep-linkable (e.g. `/boards/abc123?topic=xyz789`).

**Route guards** are implemented as wrapper components in `src/components/ui/Routes.tsx`:
- `ProtectedRoute` — checks `AuthContext.session`; redirects to `/auth` if not signed in
- `AdminRoute` — checks `AuthContext.role === 'admin'`; redirects to `/` if not admin

**Sidebar** uses `<NavLink>` — active state is derived from the URL, not from component state.

**Browser back/forward** works correctly across all routes.

---

## Security Model

## Security Model

Authentication is handled by Supabase Auth (email/password). RLS is enabled on all tables.

| Table | Read | Write |
|-------|------|-------|
| `boards` | Own rows; admin reads all | Own rows only |
| `topics` | Own rows; admin reads all | Own rows only |
| `tags` | All authenticated users | `custom` tags: any authenticated user; `system` tags: admin only |
| `topic_tags` | Own topics' associations | Own topics' associations |
| `profiles` | Own row only | Not writable by users — role changes via SQL only |

The `is_admin()` helper function (SECURITY DEFINER) reads `profiles.role` without a recursive RLS check.

Unauthenticated requests are blocked at the application level (`ProtectedRoute` in `src/components/ui/Routes.tsx`) and at the database level (RLS policies require `auth.uid()`).

**Do not share your `VITE_SUPABASE_ANON_KEY` publicly.** See [SECURITY.md](../SECURITY.md) for full guidance.

**Do not share your `VITE_SUPABASE_ANON_KEY` publicly.** See [SECURITY.md](../SECURITY.md) for full guidance.

---

## Known Limitations

| # | Limitation | Tracked In |
|---|-----------|-----------|
| 1 | Full `fetchAll()` on structural mutations — degrades at scale | No tracked BL item; migration path: React Query (DL-002) |
| 2 | No offline support — requires network | BL-012 |
| 3 | `history` array capped at 50 entries (older entries discarded) | BL-001 ✅ |
| 4 | `topic_tags` RLS subquery (EXISTS on topics) — one extra lookup per row on read | Acceptable at current scale |

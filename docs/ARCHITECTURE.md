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
│   ├── date.ts           # timeAgo, formatDate
│   └── id.ts             # generateId (crypto.randomUUID)
├── lib/
│   └── supabase.ts       # Supabase client singleton
├── hooks/
│   └── useDataStore.ts   # All remote state and mutations
├── components/
│   ├── ui/
│   │   └── ConfirmDialog.tsx
│   ├── Sidebar.tsx
│   ├── Dashboard.tsx
│   ├── BoardsList.tsx
│   ├── BoardView.tsx
│   ├── TopicDrawer.tsx
│   ├── Statistics.tsx
│   ├── CalendarView.tsx
│   ├── SettingsView.tsx
│   └── DesignSystem.tsx  # Dev-only reference, not in nav
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
  updatedAt (formatted), createdAt
```

All domain types live in `src/types/index.ts`.  
All semantic mappings (labels, colors, icons per status/type/difficulty) live in `src/config/index.ts`.

---

## Component Responsibilities

### `App.tsx` — Layout shell

Owns:
- Active view state (`View` string union — no URL router in v1)
- `activeBoardId` / `activeTopicId` cursor state
- Search palette (open, query, results)
- New topic modal
- Keyboard shortcut listeners (`Cmd+K`, `Escape`) — unified in one `useEffect`
- Theme (dark/light) + `localStorage` persistence

Passes all data and callbacks downward as props. No context, no global store.

### View components

| Component | Responsibility |
|-----------|---------------|
| `Sidebar.tsx` | Navigation, board list with progress, filter input |
| `Dashboard.tsx` | Stats (real streak, real activity), heatmap, upcoming reviews, recent topics |
| `BoardsList.tsx` | Board CRUD, sort by `updatedAtRaw` timestamp |
| `BoardView.tsx` | Kanban columns, inline topic creation, confirm delete |
| `TopicDrawer.tsx` | Full topic detail: status, progress slider, tags, checklist, resources, notes, history |
| `Statistics.tsx` | Weekly activity chart, status donut, board progress, difficulty distribution |
| `CalendarView.tsx` | Monthly calendar with review date events |
| `SettingsView.tsx` | Theme toggle, JSON export/import, data reset |

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

```typescript
type View = 'dashboard' | 'boards' | 'board' | 'stats' | 'calendar' | 'settings';
```

Managed as `useState<View>` in `App.tsx`. No URL router in v1.

**Known limitation:** Browser back/forward exits the app rather than returning to the previous view. Deep linking to a specific board or topic is not possible.

**Migration path to React Router v6:** Each `View` maps 1:1 to a route path. The component tree does not need to change — only `App.tsx` routing logic and `Sidebar.tsx` nav links. Tracked in [BACKLOG.md](./BACKLOG.md#bl-005).

---

## Security Model

RLS is enabled on both tables. Policies use `USING (true)` — any holder of the anon key can read and write all data. This is correct for a personal, self-hosted tool.

**Do not share your `VITE_SUPABASE_ANON_KEY` publicly.** See [SECURITY.md](./SECURITY.md) for full guidance.

---

## Known Limitations

| # | Limitation | Tracked In |
|---|-----------|-----------|
| 1 | No URL routing — back button exits the app | BL-005 |
| 2 | Full `fetchAll()` on structural mutations — degrades at scale | BL-010 (Realtime) |
| 3 | No offline support — requires network | BL-012 |
| 4 | No authentication — anon key access only | BL-011 |
| 5 | `history` array grows unbounded per topic | BL-001 |

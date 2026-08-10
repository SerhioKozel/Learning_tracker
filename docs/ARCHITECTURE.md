# Architecture

**Project:** Learning Tracker  
**Version:** v2 (React + Supabase)  
**Last Updated:** 2026-08-07  

---

## Overview

Learning Tracker is a single-page application with a flat, three-layer architecture:

```
┌──────────────────────────────────────────────────┐
│  UI Layer (React components)                     │
│  App.tsx + 9 view/feature components             │
├──────────────────────────────────────────────────┤
│  State Layer (custom hook)                       │
│  useDataStore — owns all async state             │
├──────────────────────────────────────────────────┤
│  Data Layer (Supabase)                           │
│  PostgreSQL + RLS, accessed via supabase-js      │
└──────────────────────────────────────────────────┘
```

This is intentionally simple. The application is single-user, has no authentication flow, and has no complex derived state that would justify a state management library.

---

## Component Model

### App.tsx — Layout Shell and View Router

`App.tsx` is the root component. It:

- Renders the two-column layout (Sidebar + main area)
- Manages the active `view` state (a string union, not URL routing)
- Holds the `activeBoardId` and `activeTopicId` cursor state
- Manages the search palette and new topic modal
- Owns keyboard shortcut listeners
- Initializes the `useDataStore` hook and passes its output down as props

All data flows downward from `App.tsx` as props. No context, no global store.

### View Components

Each view receives `boards`, `topics`, and callback props from `App.tsx`. They are responsible only for presentation and user interaction — no data fetching.

| Component | Responsibility |
|-----------|---------------|
| `Sidebar.tsx` | Navigation, board list, theme toggle |
| `Dashboard.tsx` | Overview stats, recent boards, activity heatmap, upcoming reviews |
| `BoardsList.tsx` | Board management: list, create, edit, delete, duplicate |
| `BoardView.tsx` | Kanban columns view for a single board; topic cards |
| `TopicDrawer.tsx` | Full topic detail panel: properties, checklist, resources, notes, history |
| `Statistics.tsx` | Charts and aggregate metrics |
| `CalendarView.tsx` | Monthly calendar with review dates |
| `SettingsView.tsx` | Theme, export, import, reset |
| `DesignSystem.tsx` | Internal design reference (not linked in production) |

### TopicDrawer

The drawer is the most complex component. It maintains local optimistic state for the `notes` textarea (saves on blur) and syncs from props when the active topic changes. All other fields (status, type, difficulty, checklist, resources) write through to Supabase immediately on interaction.

---

## Data Layer

### useDataStore

The single hook that owns all remote state. It exposes:

```typescript
{
  boards: Board[];
  topics: Topic[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;

  // Board mutations
  createBoard, updateBoard, deleteBoard, duplicateBoard

  // Topic mutations
  createTopic, updateTopic, deleteTopic
  addChecklistItem, addResource

  // Data management
  exportData, importData, resetData
}
```

All mutations call `fetchAll()` after completing, which re-fetches both tables. This ensures UI consistency at the cost of an extra network round-trip per mutation. For a single-user personal tool this is acceptable.

### Data Mapping

Supabase returns snake_case column names. The `mapBoard` and `mapTopic` functions in `useDataStore.ts` translate to camelCase domain types. The inverse mapping (camelCase → snake_case) happens inline in each mutation.

### Type Definitions

Domain types are defined in `src/data/mockData.ts` (the file name is a historical artifact — it contains no mock data). Key types:

```
Topic      — the primary learning unit
Board      — a collection of topics organized around a subject
Status     — to_learn | learning | practice | review | completed
Difficulty — easy | medium | hard
TopicType  — learning | book | video | course | documentation | ...
```

---

## Design System

The visual language is implemented as a combination of Tailwind utility classes and CSS custom properties.

**Custom color scale:** The `ink` ramp (ink-100 through ink-990) maps to CSS variables that invert between dark and light themes. This means the same Tailwind class (`text-ink-100`, `bg-ink-800`) produces the correct color in both themes without separate class variants.

**Component classes** (defined in `index.css`):
- `.surface` — card background with hairline border
- `.glass` / `.glass-strong` — blurred glass background for header/sidebar
- `.btn-primary` / `.btn-ghost` / `.btn-soft` — button variants
- `.chip` — inline badge/tag
- `.card-hover` — lift-on-hover transition
- `.overlay` — modal backdrop

See [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md) for the full reference.

---

## View Routing

View state is managed as a `useState<View>` string in `App.tsx`. There is no URL router.

```typescript
type View = 'dashboard' | 'boards' | 'board' | 'stats' | 'calendar' | 'settings' | 'design';
```

**Trade-off:** This approach is simple and avoids a routing dependency. The cost is that the browser back button does not work — navigating back exits the app rather than returning to the previous view. For a self-contained personal tool this is acceptable in v1.

**Future path:** React Router v6 can be added incrementally. Each `View` string maps 1:1 to a route path. The component tree structure does not need to change.

---

## Data Flow Diagram

```
User interaction
       │
       ▼
  Component (e.g. TopicDrawer)
       │ calls onUpdate / onDelete / etc.
       ▼
  App.tsx callback
       │ delegates to store method
       ▼
  useDataStore (mutation)
       │ writes to Supabase
       ▼
  fetchAll()
       │ reads boards + topics
       ▼
  setBoards() + setTopics()
       │ React re-render
       ▼
  All components receive fresh props
```

---

## Supabase Schema

```sql
boards (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  description text NOT NULL DEFAULT '',
  color       text NOT NULL DEFAULT 'sky'
                   CHECK (color IN ('sky','teal','amber','rose','emerald')),
  icon        text NOT NULL DEFAULT 'Layout',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
)

topics (
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
)
```

`checklist`, `resources`, and `history` are stored as JSON arrays in PostgreSQL. This avoids junction tables for a single-user application while keeping the data queryable if needed in the future.

---

## Security

RLS is enabled on both tables. All policies use `USING (true)` / `WITH CHECK (true)` — any holder of the anon key can read and write all data. This is correct for a personal, single-tenant tool accessed only by its owner.

**If you share the Supabase URL and anon key, anyone can read and modify your data.** Keep the anon key private or add authentication before exposing the app publicly.

---

## Known Architectural Limitations

1. **No URL routing** — browser back/forward does not work between views.
2. **Full re-fetch on every mutation** — every write triggers a re-fetch of all boards and topics. Will degrade with larger data sets.
3. **No offline support** — the app requires a network connection. The legacy project was LocalStorage-backed (offline-first); v2 traded this for cloud sync.
4. **Single file for types + config + utils** (`mockData.ts`) — should be split as the codebase grows.

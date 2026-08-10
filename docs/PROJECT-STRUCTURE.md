# Project Structure

**Project:** Learning Tracker  
**Last Updated:** 2026-08-07  

---

## Repository Root

```
tracker_v2/
├── .env.example            # Required environment variables (template)
├── index.html              # Vite HTML entry point
├── package.json            # Dependencies and scripts
├── tailwind.config.js      # Tailwind theme extension (ink ramp, animations)
├── tsconfig.json           # TypeScript project references
├── tsconfig.app.json       # App-level TypeScript config (strict)
├── tsconfig.node.json      # Vite config TypeScript config
├── vite.config.ts          # Vite configuration
├── postcss.config.js       # PostCSS (Tailwind + autoprefixer)
├── eslint.config.js        # ESLint flat config
├── supabase/
│   └── migrations/         # SQL migration files (timestamped)
│       └── *.sql
└── src/                    # Application source
```

---

## Source Directory

```
src/
├── main.tsx                # Entry point — renders <App/> into #root
├── App.tsx                 # Root layout, view routing, modals
├── index.css               # Design system tokens + Tailwind layers
├── vite-env.d.ts           # Vite env type declarations
│
├── lib/
│   └── supabase.ts         # Supabase client singleton
│
├── hooks/
│   └── useDataStore.ts     # All remote state: boards, topics, mutations
│
├── data/
│   └── mockData.ts         # ⚠️ Misnamed — contains: domain types,
│                           #   semantic config maps, pure utility functions
│
└── components/
    ├── Sidebar.tsx          # Navigation, board list, user footer
    ├── Dashboard.tsx        # Overview: stats, heatmap, recent boards
    ├── BoardsList.tsx       # Board management: list, create, edit, delete
    ├── BoardView.tsx        # Kanban view for a single board
    ├── TopicDrawer.tsx      # Full topic detail panel (right-side drawer)
    ├── Statistics.tsx       # Charts and aggregate learning metrics
    ├── CalendarView.tsx     # Monthly calendar with review dates
    ├── SettingsView.tsx     # Theme, export, import, reset
    └── DesignSystem.tsx     # Internal design reference (dev only)
```

---

## File Responsibilities

### `App.tsx`

The root component. Manages:
- Active view state (`View` string)
- Active board and topic cursors
- Search palette (open/closed, query, results)
- New topic modal (open/closed, form state)
- Theme (dark/light) + localStorage persistence
- Keyboard shortcut listeners (Cmd+K, Escape)

Renders: Sidebar, the active view component, TopicDrawer overlay, search palette overlay, new topic modal overlay.

**Size:** 372 lines. A future refactor should extract the modals and keyboard shortcuts into dedicated components/hooks.

---

### `useDataStore.ts`

The only file that talks to Supabase. Contains:
- `RawBoard` and `RawTopic` interfaces (Supabase column shapes)
- `mapBoard()` and `mapTopic()` — snake_case → camelCase translation
- All query and mutation functions

All mutations call `fetchAll()` after completing.

---

### `data/mockData.ts`

**The name is misleading.** This file contains no mock data. It contains:

1. **Domain type definitions** — `Status`, `TopicType`, `Difficulty`, `Topic`, `Board`, `ChecklistItem`, `Resource`, `HistoryEntry`, `CalendarEvent`
2. **Semantic config maps** — `statusConfig`, `boardColorMap`, `topicTypeConfig`, `difficultyConfig`, `resourceTypeConfig`, `historyActionConfig`
3. **Pure utility functions** — `timeAgo()`, `formatDate()`, `generateHeatmap()`, `generateWeeklyHours()`, `generateCalendarEvents()`

A planned refactor (TASK-02 in BACKLOG.md) will rename and split this into `src/types/`, `src/config/`, and `src/utils/`.

---

### `components/Sidebar.tsx`

Exports:
- `type View` — the view string union used across the app
- `default Sidebar` — the left navigation panel

Contains a local `query` state for the board filter input. Everything else comes from props.

---

### `components/TopicDrawer.tsx`

The most complex component (506 lines). Renders as a fixed right-side panel over the content area.

Local state: `notes` (debounced save on blur). All other fields derive from the `topic` prop and write through on interaction.

**Known issue:** The `useEffect` that syncs topic data on `topicId` change has a suppressed dependency warning. See TASK-03 in BACKLOG.md.

---

### `lib/supabase.ts`

Creates and exports the Supabase client singleton. Reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from the environment. `auth.persistSession: false` because there is no authentication.

---

## Planned Future Structure

As the codebase grows, the target structure is:

```
src/
├── types/
│   └── index.ts            # All domain type definitions
├── config/
│   ├── status.ts           # statusConfig
│   ├── boards.ts           # boardColorMap, BOARD_ICONS
│   └── topics.ts           # topicTypeConfig, difficultyConfig, etc.
├── utils/
│   ├── date.ts             # timeAgo, formatDate
│   └── analytics.ts        # generateHeatmap, generateWeeklyHours, etc.
├── hooks/
│   ├── useDataStore.ts
│   ├── useSearchPalette.ts
│   └── useKeyboardShortcuts.ts
├── components/
│   ├── ui/                 # Reusable primitives
│   │   ├── ConfirmDialog.tsx
│   │   ├── SearchPalette.tsx
│   │   └── NewTopicModal.tsx
│   └── views/              # View-level components (current flat list)
└── lib/
    └── supabase.ts
```

This migration should happen incrementally, one file at a time, not as a single large refactor.

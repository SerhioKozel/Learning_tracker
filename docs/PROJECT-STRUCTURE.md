# Project Structure

**Project:** Learning Tracker  
**Last Updated:** 2026-08-09

---

## Repository Root

```
learning-tracker/
├── .env.example            # Required env vars — copy to .env to run locally
├── .env                    # Local secrets — git-ignored, never commit
├── index.html              # Vite HTML entry point
├── package.json            # name: "learning-tracker", scripts, dependencies
├── tailwind.config.js      # Custom ink ramp, animations, darkMode: 'class'
├── tsconfig.json           # Project references root
├── tsconfig.app.json       # App TypeScript config (strict: true)
├── tsconfig.node.json      # Vite config TypeScript config
├── vite.config.ts          # Vite — React plugin, no aliases needed
├── postcss.config.js       # Tailwind + autoprefixer
├── eslint.config.js        # ESLint flat config — typescript-eslint + react-hooks
├── supabase/
│   └── migrations/         # SQL migration files (run these in Supabase SQL editor)
│       └── *.sql
├── docs/                   # All project documentation
│   ├── ARCHITECTURE.md     # System design, component model, data flow
│   ├── BACKLOG.md          # Prioritised task list
│   ├── CONTRIBUTING.md     # How to work on this codebase
│   ├── DECISION-LOG.md     # Why specific choices were made
│   ├── DESIGN-SYSTEM.md    # Colors, typography, components, tokens
│   ├── PROJECT-STRUCTURE.md  ← you are here
│   ├── ROADMAP.md          # What's built and what's planned
│   └── SECURITY.md         # Security model and deployment guidance
└── src/                    # Application source (see below)
```

---

## Source Directory

```
src/
├── main.tsx                # Entry point — mounts <App /> into #root, applies saved theme
├── App.tsx                 # Root layout, view routing, modals, keyboard shortcuts
├── index.css               # Design tokens (CSS vars), Tailwind layers, component classes
├── vite-env.d.ts           # Vite env type declarations (import.meta.env)
│
├── types/
│   └── index.ts            # All domain interfaces and type aliases
│                           # Board, Topic, Status, ChecklistItem, Resource, ...
│
├── config/
│   └── index.ts            # Semantic config maps and shared constants
│                           # statusConfig, boardColorMap, BOARD_ICONS,
│                           # topicTypeConfig, difficultyConfig,
│                           # HEATMAP_COLORS, BOARD_COLOR_OPTIONS
│
├── utils/
│   ├── analytics.ts        # generateHeatmap, generateWeeklyActivity, computeStreak,
│   │                       # generateCalendarEvents — all pure functions, no side effects
│   ├── date.ts             # timeAgo(date), formatDate(date)
│   └── id.ts               # generateId(prefix) — crypto.randomUUID based
│
├── lib/
│   └── supabase.ts         # Supabase client singleton (auth.persistSession: false)
│
├── hooks/
│   └── useDataStore.ts     # The only file that communicates with Supabase.
│                           # Owns: boards[], topics[], loading, error
│                           # Exposes: all mutations + data portability functions
│                           # Contains: RawBoard/RawTopic interfaces, mapBoard/mapTopic
│
└── components/
    ├── ui/                 # Reusable UI primitives (no business logic)
    │   └── ConfirmDialog.tsx
    │
    ├── Sidebar.tsx         # Exports `type View` — the canonical view union
    ├── Dashboard.tsx       # Real streak, real activity — no hardcoded values
    ├── BoardsList.tsx      # Board CRUD + create/edit modal + confirm delete
    ├── BoardView.tsx       # Kanban columns + inline topic creation + confirm delete
    ├── TopicDrawer.tsx     # Full topic panel: all fields, checklist, resources, history
    ├── Statistics.tsx      # Charts and aggregate metrics
    ├── CalendarView.tsx    # Monthly calendar with review date events
    ├── SettingsView.tsx    # Theme, export/import, reset
    └── DesignSystem.tsx    # Internal design reference — not linked in production nav
```

---

## Key Conventions

### Types flow from `src/types/index.ts`

Every component and hook imports its types from here. No inline `interface` definitions in component files unless the type is purely local (e.g. a form state shape used only in that file).

### Config flows from `src/config/index.ts`

Every map from a domain value to a display value (color, label, icon, class) lives here. Never hardcode `'bg-sky-500'` in a component — look it up from `boardColorMap[board.color]`.

### Supabase access is isolated to `useDataStore.ts`

No component file imports `supabase` directly. All queries and mutations go through `useDataStore`. This makes the data layer replaceable and testable in isolation.

### `BOARD_ICONS` is the only board icon registry

Previously the same icon map was defined identically in three files. It now lives exclusively in `src/config/index.ts`. All components import `BOARD_ICONS` from there.

### `HEATMAP_COLORS` is the only heatmap palette

Same principle — previously duplicated in `Dashboard.tsx` and `Statistics.tsx`. Now defined once in `src/config/index.ts`.

---

## What Does Not Exist (and Why)

| Missing | Reason |
|---------|--------|
| `src/context/` | No React Context needed — data passes as props from App.tsx |
| `src/store/` | No Zustand/Redux — `useDataStore` is sufficient |
| `src/api/` | No API abstraction layer — Supabase client is the API |
| `src/pages/` | No router — views are components rendered conditionally in App.tsx |
| `src/tests/` | No automated tests yet — see BACKLOG.md BL-013 (planned) |
| `src/services/` | No service layer — thin enough to not need one |

---

## Adding New Things

### New domain type
→ Add to `src/types/index.ts`

### New config map or constant
→ Add to `src/config/index.ts`

### New pure utility function
→ Add to the appropriate file in `src/utils/` (or create a new one if the domain is distinct)

### New Supabase query or mutation
→ Add to `src/hooks/useDataStore.ts` only

### New reusable UI primitive (no domain knowledge)
→ Add to `src/components/ui/`

### New view
→ See "Adding a New View" in [CONTRIBUTING.md](./CONTRIBUTING.md)

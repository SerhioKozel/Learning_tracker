# Learning Tracker

A personal learning management application built around a Kanban workflow. Organize knowledge, track progress, plan reviews, and keep all your learning resources in one place.

---

## What it does

Learning is naturally fragmented — bookmarks in one tab, notes in another, YouTube playlists somewhere else. Learning Tracker consolidates everything into a single interface where each topic you want to learn becomes a card that moves through five stages:

```
To Learn → Learning → Practice → Review → Completed
```

Topics live inside **Boards** (e.g. "Frontend", "Algorithms", "System Design"). Each topic holds a checklist, linked resources, notes, difficulty, and a scheduled review date. A Dashboard gives an overview of recent activity, upcoming reviews, and overall progress.

---

## Stack

| Layer | Technology |
|-------|-----------|
| UI | React 18 + TypeScript |
| Styling | Tailwind CSS v3 (custom design system) |
| Build | Vite |
| Icons | lucide-react |
| Backend | Supabase (PostgreSQL + RLS) |
| Auth | None — single-tenant, anon key |

---

## Quick Start

### 1. Prerequisites

- Node.js 18+
- A Supabase project (free tier works)

### 2. Clone and install

```bash
git clone <repo-url>
cd tracker_v2
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in your Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Apply the database schema

Run the migrations in the Supabase SQL editor (or via the Supabase CLI):

```bash
# Using Supabase CLI
supabase db push

# Or manually: copy the contents of
# supabase/migrations/*.sql into the Supabase SQL editor
```

### 5. Run

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Available Scripts

```bash
npm run dev        # Start dev server (HMR)
npm run build      # Production build
npm run preview    # Preview production build locally
npm run lint       # ESLint
npm run typecheck  # TypeScript check without emitting
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key (public, safe to expose) |

See `.env.example` for a template.

---

## Project Structure

```
src/
├── App.tsx               # Root layout + view routing
├── main.tsx              # Entry point
├── index.css             # Design system tokens + global styles
├── components/           # View-level and feature components
│   ├── Sidebar.tsx
│   ├── Dashboard.tsx
│   ├── BoardsList.tsx
│   ├── BoardView.tsx
│   ├── TopicDrawer.tsx
│   ├── Statistics.tsx
│   ├── CalendarView.tsx
│   ├── SettingsView.tsx
│   └── DesignSystem.tsx
├── hooks/
│   └── useDataStore.ts   # All Supabase queries and mutations
├── data/
│   └── mockData.ts       # Domain types, config maps, utility functions
└── lib/
    └── supabase.ts       # Supabase client singleton
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for a detailed explanation of each layer.

---

## Database Schema

Two tables: `boards` and `topics`.

```sql
boards (id, title, description, color, icon, created_at, updated_at)
topics (id, title, description, status, board_id, type, difficulty,
        progress, tags, review_date, checklist, resources, notes,
        history, created_at, updated_at)
```

Full schema with indexes and RLS policies is in `supabase/migrations/`.

---

## Security Model

This is a single-tenant application with no authentication. Row Level Security is enabled on both tables with `USING (true)` policies — all data is accessible via the Supabase anon key. This is intentional for a personal, self-hosted tool.

If you deploy this publicly, review the RLS policies and add authentication appropriate to your use case.

---

## Further Reading

- [ARCHITECTURE.md](./ARCHITECTURE.md) — component model, data flow, design decisions
- [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md) — color tokens, component classes, typography
- [DECISION-LOG.md](./DECISION-LOG.md) — why specific technical choices were made
- [ROADMAP.md](./ROADMAP.md) — what's planned next

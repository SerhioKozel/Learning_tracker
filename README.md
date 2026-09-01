# Learning Tracker

A personal learning management application built around a Kanban workflow. Organize knowledge, track progress, schedule reviews, and keep all your learning resources in one place.

---

## What It Does

Learning is naturally fragmented — tabs, bookmarks, notes in different apps. Learning Tracker consolidates everything into a single interface where each topic you want to learn becomes a card that moves through five stages:

```
To Learn → Learning → Practice → Review → Completed
```

Topics live inside **Boards** organized around a subject (e.g. "Frontend", "System Design", "Algorithms"). Each topic holds a checklist, resource links, notes, difficulty rating, and a scheduled review date. A Dashboard gives an overview of activity, upcoming reviews, and real streak data.

---

## Stack

| Layer | Technology |
|-------|-----------|
| UI | React 18 + TypeScript |
| Styling | Tailwind CSS v3 — custom design system |
| Build | Vite 5 |
| Icons | lucide-react |
| Backend | Supabase (PostgreSQL + Row Level Security) |

---

## Quick Start

### 1. Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier is sufficient)

### 2. Install

```bash
git clone <repo-url>
cd learning-tracker
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Both values are in **Supabase Dashboard → Project Settings → API**.

### 4. Apply the database schema

Run the SQL files in `supabase/migrations/` in the Supabase SQL editor (in order).

### 5. Run

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run typecheck` | TypeScript check — must be clean before committing |
| `npm run lint` | ESLint — must be clean before committing |
| `npm run test:unit` | Run unit tests (Vitest) in watch mode |
| `npm run test:unit:ui` | Run unit tests with interactive UI |
| `npm run test:unit:coverage` | Run unit tests with coverage report |
| `npm run test:e2e` | Run E2E tests (Playwright) |
| `npm run test:e2e:ui` | Run E2E tests with interactive UI |
| `npm run test:e2e:debug` | Run E2E tests in debug mode |
| `npm run test:all` | Run all tests (unit + E2E) |

---

## Project Structure

```
src/
├── types/         # Domain type definitions
├── config/        # Semantic config maps and constants
├── utils/         # Pure utility functions (analytics, date, id)
├── lib/           # Supabase client singleton
├── hooks/         # useDataStore — all remote state and mutations
├── components/    # View and feature components
│   └── ui/        # Reusable UI primitives
└── App.tsx        # Root layout, routing, modals
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design, component model, data flow |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | Local setup, scripts, workflow, common issues |
| [docs/PROJECT-STRUCTURE.md](docs/PROJECT-STRUCTURE.md) | Every file and folder explained |
| [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md) | Colors, typography, tokens, component classes |
| [docs/TESTING.md](docs/TESTING.md) | Unit and E2E testing guide |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Code standards, conventions, checklist |
| [docs/DECISION-LOG.md](docs/DECISION-LOG.md) | Why specific technical choices were made |
| [docs/ROADMAP.md](docs/ROADMAP.md) | What's built and what's planned |
| [SECURITY.md](SECURITY.md) | Security model and deployment guidance |
| [docs/BACKLOG.md](docs/BACKLOG.md) | Prioritised task list |
| [docs/CHANGELOG.md](docs/CHANGELOG.md) | History of all notable changes |

---

## Security

This is a single-tenant personal tool. All data is accessible via the Supabase anon key — keep it private. Do not deploy to a public URL without adding authentication first. See [SECURITY.md](SECURITY.md).

---

## License

MIT

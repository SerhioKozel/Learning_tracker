# Development Guide

Everything you need to run, build, and work on Learning Tracker locally.

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 18+ | LTS recommended |
| npm | 9+ | Ships with Node 18 |
| Supabase account | — | Free tier works |

---

## First-Time Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Open `.env` and fill in your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Both values are in **Supabase Dashboard → Project Settings → API**.

### 3. Apply the database schema

Open the Supabase SQL editor and run the contents of:

```
supabase/migrations/
```

Run files in order (they are timestamped). Each file currently in this folder is safe to re-run — schema files use `CREATE TABLE IF NOT EXISTS`, and the realtime migration guards against re-adding a table already in the publication. If you add a new migration, keep this guarantee: prefer `IF NOT EXISTS` / `DO` guards over unconditional `DROP TABLE` or unguarded `ALTER`, since this project has no formal migration-history tracking (no `supabase_migrations.schema_migrations` table) — there's nothing stopping a file from being run twice by accident.

Alternatively, if you have the Supabase CLI:

```bash
supabase db push
```

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Dev server | `npm run dev` | Starts Vite with HMR on port 5173 |
| Build | `npm run build` | Production build to `dist/` |
| Preview | `npm run preview` | Serve the production build locally |
| Type check | `npm run typecheck` | `tsc --noEmit` — no output, just errors |
| Lint | `npm run lint` | ESLint across all `.ts` and `.tsx` files |

> **Before committing:** always run `npm run typecheck && npm run lint`. Both must pass clean.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | ✅ | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Supabase anon key (public, safe in browser) |

Vite only exposes variables prefixed with `VITE_` to the browser bundle. Do not put secrets without this prefix — they will be excluded from the build.

---

## Project Structure Quick Reference

```
src/
├── types/index.ts         # Domain types — start here
├── config/index.ts        # Config maps and constants
├── utils/                 # Pure utility functions
├── lib/supabase.ts        # Supabase client (import this, not supabase-js directly)
├── hooks/useDataStore.ts  # All data fetching and mutations — only file touching Supabase
├── components/
│   ├── ui/                # Reusable primitives
│   └── *.tsx              # View and feature components
└── App.tsx                # Root — routing, layout, modals
```

Full explanation: [PROJECT-STRUCTURE.md](./PROJECT-STRUCTURE.md)

---

## Making Changes

### Adding a field to Topic or Board

1. Add a migration in `supabase/migrations/` with a timestamp prefix:
   ```
   supabase/migrations/20260810000000_add_field.sql
   ```
2. Run it in Supabase SQL editor.
3. Update the `RawTopic` or `RawBoard` interface in `useDataStore.ts`.
4. Update `mapTopic` or `mapBoard` to include the new field.
5. Update the `Topic` or `Board` type in `src/types/index.ts`.
6. Update any components that display or edit the field.

### Adding a new view

1. Add the view name to the `View` union type exported from `Sidebar.tsx`:
   ```typescript
   export type View = 'dashboard' | 'boards' | ... | 'your-view';
   ```
2. Add a nav item to `navItems` in `Sidebar.tsx` (icon, label, id).
3. Add a conditional render block in `App.tsx` main content area.
4. Create `src/components/YourView.tsx`.
5. Update `ARCHITECTURE.md` component table.

### Adding a Supabase mutation

All Supabase access lives in `useDataStore.ts`. Add a new `useCallback`:

```typescript
const yourMutation = useCallback(async (params): Promise<void> => {
  const { error } = await supabase.from('table').update(...).eq('id', id);
  if (error) { setError(error.message); return; }
  await fetchAll(); // or optimistic update — see DL-007 in DECISION-LOG.md
}, [fetchAll]);

// Return it from the hook
return { ..., yourMutation };
```

---

## Working with Supabase Locally

### Viewing data

Supabase Dashboard → Table Editor gives a live view of all rows.

### Testing mutations

The app has no automated tests yet. Test manually by:

1. Running the action in the UI.
2. Checking the Supabase Table Editor to confirm the row was written correctly.
3. Refreshing the app (or clicking away and back) to confirm the read path is correct.

### RLS policies

Both tables have permissive policies (`USING (true)`). If you're adding authentication, see [SECURITY.md](../SECURITY.md).

---

## Common Issues

### App shows "Connection error"

- Check that `.env` exists and both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are filled in.
- Restart the dev server after editing `.env` — Vite reads env vars at startup.
- Confirm the migration SQL has been run in Supabase (tables must exist).

### TypeScript errors after pulling

```bash
npm install          # dependencies may have changed
npm run typecheck    # see the full error list
```

### Supabase returns 404 on a table

The migration for that table hasn't been run. Check `supabase/migrations/` and run any new files.

### Theme doesn't apply on reload

The theme class (`dark` or `light`) is applied to `<html>` by `main.tsx` from `localStorage`. If `localStorage` is unavailable (e.g. private browsing with strict settings), the app defaults to dark.

---

## Code Quality Standards

See [CONTRIBUTING.md](../CONTRIBUTING.md) for the full list. Key rules:

- `npm run typecheck` — zero errors before committing
- `npm run lint` — zero errors before committing  
- No `@ts-ignore` or `eslint-disable` without a written justification
- No `Math.random()` for data that appears in the UI
- No hardcoded user data, fake statistics, or placeholder buttons
- Destructive actions always require a confirmation dialog

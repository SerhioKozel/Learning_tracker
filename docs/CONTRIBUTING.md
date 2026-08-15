# Contributing

How to work on the Learning Tracker codebase effectively.

---

## Development Setup

See [DEVELOPMENT.md](./DEVELOPMENT.md) for the full first-time setup guide.

Quick start:

```bash
npm install
cp .env.example .env   # fill in Supabase credentials
npm run dev
```

---

## Before Every Commit

Both of these must pass clean — no exceptions:

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # ESLint
```

If either fails, fix the errors before committing. Do not suppress them with `@ts-ignore` or `eslint-disable` without a written justification in the commit message.

---

## Code Standards

### TypeScript

- Strict mode is on (`tsconfig.app.json`: `"strict": true`). Work with it, not around it.
- All function return types and component prop interfaces should be explicit.
- No `any` without a comment explaining why it is unavoidable.
- No `eslint-disable-line react-hooks/exhaustive-deps` — fix the effect or restructure the state.

### React

| Rule | Reason |
|------|--------|
| One concern per component | A component rendering a list AND managing a create modal should be two components |
| Read from props, don't mirror state | Local state is for: uncontrolled inputs saving on blur, UI-only open/closed state |
| No `useEffect` for data transforms | Compute derived values inline or with `useMemo` |
| Components under 300 lines | If growing beyond this, find extractable sub-components |
| No Supabase imports in components | All DB access goes through `useDataStore` |

### Naming

| Thing | Convention | Example |
|-------|-----------|---------|
| Component files | PascalCase | `TopicDrawer.tsx` |
| Hook files | camelCase, `use` prefix | `useDataStore.ts` |
| Module-level constants | SCREAMING_SNAKE_CASE | `BOARD_ICONS` |
| Types / interfaces | PascalCase | `ChecklistItem` |
| Utility functions | camelCase | `generateHeatmap` |

### Styling

- All styling via Tailwind utility classes.
- Semantic colors via config maps (`statusConfig`, `boardColorMap`) — never hardcode `bg-sky-500` for a board color directly.
- Custom CSS classes in `index.css` only for patterns repeated across many components (currently: `.surface`, `.glass`, `.btn-primary`, `.chip`, `.overlay`).
- Inline `style={{}}` only for values that cannot be expressed as Tailwind classes, e.g. `style={{ width: \`${pct}%\` }}`.

---

## Where Things Go

| New thing | Goes in |
|-----------|---------|
| Domain type or interface | `src/types/index.ts` |
| Semantic config map or constant | `src/config/index.ts` |
| Pure utility function | `src/utils/` (choose or create the right file) |
| Supabase query or mutation | `src/hooks/useDataStore.ts` only |
| Reusable UI primitive | `src/components/ui/` |
| View or feature component | `src/components/` |

Full guide: [PROJECT-STRUCTURE.md](./PROJECT-STRUCTURE.md)

---

## Component Checklist

Before opening a PR or considering a component done:

- [ ] Props typed with an explicit interface
- [ ] No hardcoded user data, fake values, or `Math.random()`
- [ ] No unused imports (`npm run lint` will catch these)
- [ ] No placeholder buttons that do nothing visible in the UI
- [ ] Loading state handled (show skeleton or spinner)
- [ ] Empty state handled (show a useful empty message, not just nothing)
- [ ] Destructive actions have a `ConfirmDialog`
- [ ] `npm run typecheck` passes clean
- [ ] `npm run lint` passes clean

---

## Adding a New View

1. Add the view name to the `View` union type in `Sidebar.tsx`.
2. Add a nav item to `navItems` in `Sidebar.tsx` (icon, label, id).
3. Add a render case in the `main` block of `App.tsx`.
4. Create `src/components/YourView.tsx`.
5. Document it in the component table in `docs/ARCHITECTURE.md`.

---

## Adding a New Mutation

All mutations live in `useDataStore.ts`. The pattern:

```typescript
const myMutation = useCallback(async (params: MyParams): Promise<void> => {
  const { error } = await supabase.from('table').update(...).eq('id', id);
  if (error) { setError(error.message); return; }
  await fetchAll(); // full consistency
  // OR: optimistic update (see DL-007 in DECISION-LOG.md for when to use each)
}, [fetchAll]);
```

Return it from the hook and add it to the `DataStore` type (inferred from `ReturnType<typeof useDataStore>`).

---

## Commit Messages

Imperative mood. Specific enough to understand without reading the diff.

```
✅ Add delete confirmation dialog for topics
✅ Extract BOARD_ICONS to src/config/index.ts
✅ Fix stale checklist state in TopicDrawer after status change
✅ Remove hardcoded streak from Dashboard

❌ Fix bug
❌ Update component
❌ WIP
```

If a commit suppresses a lint/type warning, the message must say why:

```
Suppress exhaustive-deps: fetchAll is stable (useCallback with empty deps)
```

---

## What Not to Do

- **Don't add a dependency without discussion.** Justify why the existing toolset can't solve the problem.
- **Don't duplicate constants.** Check `src/config/index.ts` before defining a new map.
- **Don't ship placeholder UI.** If a button doesn't do anything, remove it or implement it.
- **Don't suppress lint/type errors silently.** Leave a comment.
- **Don't make massive refactors in one commit.** Prefer many small, reviewable changes.
- **Don't write Supabase queries in component files.** Everything goes through `useDataStore`.

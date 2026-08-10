# Contributing

Guidelines for working on the Learning Tracker codebase.

---

## Development Setup

```bash
# Clone and install
git clone <repo-url>
cd tracker_v2
npm install

# Configure environment
cp .env.example .env
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# Run dev server
npm run dev
```

---

## Before Committing

Always run:

```bash
npm run typecheck   # No TypeScript errors
npm run lint        # No ESLint errors
```

The project uses strict TypeScript. Suppressing type errors with `@ts-ignore` or `eslint-disable` requires a written justification in the commit message.

---

## Code Standards

### TypeScript

- Prefer explicit types on function return values and component props.
- No `any` without a justification comment.
- No `eslint-disable-line react-hooks/exhaustive-deps` — fix the dependency array or restructure the effect.

### React

- Components should do one thing. If a component is doing two things (rendering a list AND managing a create modal), split it.
- Prefer reading from props over duplicating state locally. Local state is appropriate for:
  - Uncontrolled inputs that save on blur (e.g. notes textarea)
  - UI-only state (open/closed, hover) that does not need to be in the store
- Avoid `useEffect` for data transformations — compute derived values during render or in a `useMemo`.
- Keep component files under 250 lines. If a component grows beyond that, look for extractable sub-components.

### Naming

- Components: PascalCase file names matching the default export
- Hooks: `useCamelCase`, always start with `use`
- Constants: `SCREAMING_SNAKE_CASE` for module-level constants
- Types/interfaces: PascalCase

### Style

- All styling via Tailwind utility classes.
- Custom CSS classes (in `index.css`) only for patterns that appear 10+ times.
- Do not write inline `style={{}}` props except for dynamic values that cannot be expressed as Tailwind classes (e.g. `style={{ width: \`${pct}%\` }}`).

---

## Component Checklist

Before submitting a new component:

- [ ] Props are typed with an explicit interface
- [ ] No hardcoded user data, fake values, or `Math.random()`
- [ ] No unused imports
- [ ] No placeholder buttons that do nothing (remove or implement)
- [ ] Loading and empty states handled
- [ ] Destructive actions have confirmation

---

## Adding a New View

1. Add the view name to the `View` union type in `Sidebar.tsx`.
2. Add a nav item to `navItems` in `Sidebar.tsx` if it should appear in navigation.
3. Handle the new view in the `main` rendering block in `App.tsx`.
4. Create the component in `src/components/`.
5. Update `ARCHITECTURE.md` with the new component's responsibility.

---

## Working with Supabase

- Never write raw Supabase queries in component files. All queries live in `useDataStore.ts`.
- After any schema change, add a new migration file in `supabase/migrations/` with a timestamp prefix.
- Test mutations manually before committing — there are no automated tests yet.

---

## Commit Messages

Use imperative mood and be specific:

```
✅ Remove hardcoded streak value from Dashboard
✅ Add delete confirmation dialog for topics
✅ Extract boardIcons constant to src/config/boards.ts
❌ Fix stuff
❌ Update component
```

---

## What NOT to Do

- Do not add a new npm dependency without discussion — justify why the problem cannot be solved with what's already in the project.
- Do not duplicate constants that already exist elsewhere in the codebase.
- Do not ship placeholder UI (buttons that do nothing, fake data, hardcoded names).
- Do not suppress TypeScript or ESLint warnings without a comment explaining why.
- Do not make massive refactors in a single commit — prefer many small, reviewable changes.

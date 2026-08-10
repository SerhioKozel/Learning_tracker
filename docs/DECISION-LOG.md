# Decision Log

Architectural and product decisions, with their context and trade-offs.

---

## DL-001 — Supabase instead of LocalStorage

**Date:** 2026-08  
**Status:** Accepted  

**Context:** The legacy Angular project used LocalStorage as its storage backend (offline-first). The v2 React rewrite moved to Supabase (PostgreSQL + REST).

**Decision:** Use Supabase with the anon key and no authentication. Data is stored in the cloud, accessible from any device.

**Trade-offs:**

- ✅ Data persists across devices and browsers without syncing
- ✅ Structured relational queries (boards → topics cascade delete)
- ✅ No serialization of nested objects — JSON columns for checklist, resources, history
- ❌ Requires network connection (offline use not possible)
- ❌ Data is only as private as the anon key security

**Alternatives considered:** IndexedDB with a sync layer. Rejected — significantly higher complexity for minimal benefit in a single-user tool.

---

## DL-002 — Single `useDataStore` hook for all state

**Date:** 2026-08  
**Status:** Accepted  

**Context:** The application needs to share board and topic data across multiple views.

**Decision:** A single hook manages all remote state (boards, topics, loading, error) and exposes mutation functions. Props are passed downward from App.tsx.

**Trade-offs:**

- ✅ Simple — no context setup, no store boilerplate
- ✅ Easy to understand the full data flow
- ✅ Appropriate for single-user, relatively small data set
- ❌ Every mutation calls fetchAll() — full re-fetch on each write
- ❌ All views re-render on any data change

**Alternatives considered:** Zustand / Jotai for global state. Rejected — additional dependency not justified at this complexity level. React Query for server state caching. Worth considering if fetchAll() performance becomes a problem.

---

## DL-003 — No URL router

**Date:** 2026-08  
**Status:** Accepted (with known limitation)  

**Context:** The app has five primary views plus board/topic detail.

**Decision:** View state is a `useState<View>` string in App.tsx. No React Router or similar.

**Trade-offs:**

- ✅ Zero dependencies, zero configuration
- ✅ View transitions are instant (no navigation overhead)
- ❌ Browser back button exits the app instead of returning to previous view
- ❌ Deep linking (sharing a URL to a specific topic) is not possible

**Future path:** React Router v6 file-based or component-based routing. The `View` string union maps 1:1 to route paths. Migration is mechanical.

---

## DL-004 — Tailwind CSS with CSS custom properties

**Date:** 2026-08  
**Status:** Accepted  

**Context:** Need a design system that supports both dark and light themes from the same utility class names.

**Decision:** Tailwind extended with a custom `ink` color ramp backed by CSS custom properties. The `:root` defines dark values; `.light` on `<html>` overrides them. Tailwind `darkMode: 'class'` is set but not used — the ink ramp handles theme inversion transparently.

**Trade-offs:**

- ✅ Single set of utility classes works in both themes
- ✅ Design tokens are visible and changeable in one place (index.css)
- ✅ No need for `dark:` prefix variants throughout the component code
- ❌ Slightly unusual pattern — developers need to understand the ink ramp concept

---

## DL-005 — JSONB columns for checklist, resources, history

**Date:** 2026-08  
**Status:** Accepted  

**Context:** Topics have nested arrays (checklist items, resources, history entries).

**Decision:** Store these as JSONB columns in the topics table rather than separate junction tables.

**Trade-offs:**

- ✅ Simple schema — no joins for the common case (fetch a topic with all its data)
- ✅ Atomic updates — updating a checklist item is one UPDATE on the topic row
- ✅ Correct for single-user app where these arrays are always accessed together
- ❌ Cannot query across checklist items or resources with SQL without jsonb operators
- ❌ No cascade deletes or FK constraints on nested items
- ❌ Arrays can grow unbounded — history in particular

**Mitigation:** History entries should be capped (e.g. last 50 entries) when written. The app currently does not enforce this.

---

## DL-006 — No authentication

**Date:** 2026-08  
**Status:** Accepted for v1  

**Context:** The product targets a single user managing their own learning.

**Decision:** No sign-in screen. The Supabase anon key is used directly. RLS policies allow all operations for any anon or authenticated request.

**Future path:** Supabase Auth can be added. The RLS policies would change from `USING (true)` to `USING (auth.uid() = user_id)` with a `user_id` column added to both tables. The React client would add a sign-in flow. The rest of the application would not need to change.

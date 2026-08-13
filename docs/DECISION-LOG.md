# Decision Log

Architectural and product decisions — their context, rationale, and trade-offs.  
New decisions are added here when they are made, not retroactively.

---

## DL-001 — Supabase over LocalStorage

**Date:** 2026-08 | **Status:** Accepted

**Context:** The legacy Angular project used LocalStorage (offline-first). v2 needed cloud persistence.

**Decision:** Supabase (PostgreSQL + REST) with the anon key, no authentication.

**Trade-offs:**
- ✅ Data persists across devices and browsers
- ✅ Relational schema — cascade delete, referential integrity
- ✅ JSONB columns for nested arrays without junction tables
- ❌ Requires network connection — no offline use
- ❌ Privacy depends on keeping the anon key private

**Alternatives considered:** IndexedDB + sync layer — rejected as significantly more complex for a single-user tool.

---

## DL-002 — Single `useDataStore` hook, no state library

**Date:** 2026-08 | **Status:** Accepted

**Context:** App needs shared board and topic data across multiple views.

**Decision:** One hook owns all remote state and mutations. Props flow downward from App.tsx.

**Trade-offs:**
- ✅ Zero boilerplate — no context providers, no slices, no selectors
- ✅ The full data flow is readable in one file
- ❌ Every structural mutation calls `fetchAll()` — full re-fetch on create/delete
- ❌ All views re-render when any data changes

**Migration path:** React Query for caching and deduplication if `fetchAll()` latency becomes noticeable. The hook interface would not need to change.

---

## DL-003 — No URL router in v1

**Date:** 2026-08 | **Status:** Accepted (known limitation)

**Context:** App has five main views plus board/topic detail.

**Decision:** `useState<View>` in App.tsx. No `react-router-dom`.

**Trade-offs:**
- ✅ Zero routing dependency or configuration
- ✅ View transitions are synchronous and instant
- ❌ Browser back/forward exits the app instead of going back within it
- ❌ Deep-linking to a board or topic is not possible

**Migration path:** React Router v6. The `View` string union maps 1:1 to route paths (`/`, `/boards`, `/boards/:id`, `/stats`, `/calendar`, `/settings`). The component tree does not change. Tracked in BACKLOG.md BL-005.

---

## DL-004 — Tailwind + CSS custom properties for theming

**Date:** 2026-08 | **Status:** Accepted

**Context:** Needed dark and light themes from the same utility class names.

**Decision:** Custom `ink` color ramp backed by CSS custom properties. `:root` defines dark values; `.light` on `<html>` overrides them. Same Tailwind class (`text-ink-300`, `bg-ink-800`) works in both themes.

**Trade-offs:**
- ✅ No `dark:` prefix variants needed anywhere in component code
- ✅ Design tokens are visible and changeable in one place (`index.css`)
- ❌ Non-standard pattern — requires understanding the ink ramp concept

---

## DL-005 — JSONB columns for checklist, resources, history

**Date:** 2026-08 | **Status:** Accepted

**Context:** Topics have nested arrays. Options: junction tables or JSONB columns.

**Decision:** JSONB columns in the `topics` table.

**Trade-offs:**
- ✅ Simple schema — no joins for the common case
- ✅ Atomic updates — one `UPDATE` per mutation, no transaction needed
- ❌ Cannot query across checklist items with standard SQL (needs `jsonb_array_elements`)
- ❌ No cascade deletes or FK constraints on nested items
- ❌ Arrays grow unbounded — history in particular

**Mitigation:** Cap history at 50 entries on write. Tracked in BACKLOG.md BL-001.

---

## DL-006 — No authentication in v1

**Date:** 2026-08 | **Status:** Accepted for v1

**Context:** Personal tool for a single user.

**Decision:** No sign-in. Supabase anon key used directly. RLS allows all operations.

**Migration path:** Supabase Auth (`signInWithOAuth`). Add `user_id uuid` to both tables. Change RLS to `USING (auth.uid() = user_id)`. Application code outside of the auth flow does not need to change. Tracked in BACKLOG.md BL-011.

---

## DL-007 — Optimistic updates for sub-item mutations

**Date:** 2026-08 | **Status:** Accepted

**Context:** Checklist toggles and resource add/delete were calling `fetchAll()` — a full network round-trip for what felt like an instant action.

**Decision:** Sub-item mutations (`addChecklistItem`, `deleteChecklistItem`, `addResource`, `deleteResource`) apply changes to local state immediately, then write to Supabase in the background. On error, local state is rolled back.

**Trade-offs:**
- ✅ Instant UI feedback — no perceived latency for common interactions
- ✅ Correct in the vast majority of cases (network errors are rare on a stable connection)
- ❌ Small window where local state could diverge from DB on error before rollback
- ❌ Slightly more complex mutation logic

---

## DL-008 — `crypto.randomUUID()` for client-generated IDs

**Date:** 2026-08 | **Status:** Accepted

**Context:** Previously IDs were generated with `` `t${Date.now()}` `` — not collision-safe for rapid consecutive inserts, and synchronous loops produced duplicate timestamps.

**Decision:** `crypto.randomUUID()` via a shared `generateId(prefix)` utility. Available in all modern browsers and Node 14.17+. IDs are prefixed for readability (`b_uuid`, `t_uuid`, `c_uuid`).

**Note:** Supabase uses `gen_random_uuid()` for database-generated UUIDs on rows inserted without an explicit `id`. Client-generated IDs are only used for nested JSONB items (checklist, resources, history) where Supabase does not assign IDs.

---

## DL-009 — `mockData.ts` removed and split

**Date:** 2026-08 | **Status:** Completed

**Context:** A file named `mockData.ts` contained no mock data — it held domain types, config maps, and utility functions. The name misled every developer who opened it.

**Decision:** Split into three separate directories:
- `src/types/index.ts` — type definitions only
- `src/config/index.ts` — semantic config maps and shared constants
- `src/utils/` — pure functions (date, analytics, id)

All 9 component files that imported from `mockData.ts` were updated. The file was deleted.

---

## DL-010 — React Router v6 для URL-навигации

**Date:** 2026-08 | **Status:** Accepted

**Context:** Приложение использовало `useState<View>` для навигации между экранами. Кнопка Back в браузере выходила из приложения, deep linking был невозможен.

**Decision:** `react-router-dom` v6 с `BrowserRouter`. Маршруты: `/`, `/boards`, `/boards/:boardId`, `/stats`, `/calendar`, `/settings`. Topic drawer — query param `?topic=<id>` поверх любого маршрута.

**Trade-offs:**
- ✅ Browser back/forward работает корректно
- ✅ Deep linking — можно поделиться ссылкой на конкретную доску или топик
- ✅ Sidebar использует `<NavLink>` — active state из URL, не из state
- ✅ `View` type и `onView` callback полностью удалены — меньше prop drilling
- ❌ +18KB к бандлу (react-router-dom gzip)
- ❌ Требует настройки сервера для SPA fallback при деплое (все пути → index.html)

**Паттерн с query param для drawer:** `?topic=<id>` вместо вложенного маршрута. Это позволяет открывать drawer поверх любого маршрута и сохранять его состояние при навигации. Альтернатива — `/boards/:boardId/topics/:topicId` — создала бы сложный вложенный layout.

---

## DL-011 — Supabase Realtime: fetchAll() при изменениях, не применение payload

**Date:** 2026-08 | **Status:** Accepted

**Context:** Realtime subscription получает события изменений из БД. Есть два подхода: (A) применять payload из события к локальному state, (B) вызывать `fetchAll()` при любом событии.

**Decision:** Вариант B — `fetchAll()` при любом событии на `boards` или `topics`.

**Rationale:**
- Payload из `postgres_changes` содержит только изменённую строку без вычисляемых полей (`topicCount`, `completedCount`, `updatedAt`). Применение payload потребует дублирования логики `mapBoard/mapTopic`.
- Для single-user инструмента события приходят редко — extra fetchAll не заметен.
- Логика в `useDataStore` остаётся простой и предсказуемой.

**Trade-offs:**
- ✅ Код простой — один `fetchAll()`, никакой логики мёржа
- ✅ Гарантированная консистентность с БД после любого события
- ❌ Каждое событие = лишний round-trip к Supabase
- ❌ При высокой частоте событий (batch import) — много лишних запросов

**Mitigation для batch:** `importData` уже вызывает `fetchAll()` в конце, а не на каждый upsert, поэтому Realtime события во время импорта схлопнутся в один финальный fetchAll.

---

## DL-012 — @dnd-kit для drag-and-drop

**Date:** 2026-08 | **Status:** Accepted

**Context:** Kanban-интерфейс без drag-and-drop требует открывать drawer для смены статуса — лишний шаг.

**Decision:** `@dnd-kit/core` (draggable + droppable primitives). Каждая карточка — `useDraggable`, каждая колонка — `useDroppable`. `DragOverlay` рендерит призрак карточки во время drag.

**Почему @dnd-kit, не react-beautiful-dnd:**
- `react-beautiful-dnd` в режиме maintenance, не поддерживает React 18 StrictMode
- `@dnd-kit` активно развивается, доступность из коробки, модульная архитектура

**Activation constraint:** `PointerSensor` с `distance: 8` — предотвращает случайный drag при клике на карточку для открытия drawer.

**Оптимистичность:** `updateTopicStatus` применяет новый статус к локальному state немедленно. При ошибке Supabase — rollback к исходному статусу. `fetchAll()` не вызывается — Realtime подхватит изменение и обновит при необходимости.

# Decision Log

Architectural and product decisions — their context, rationale, and trade-offs.  
New decisions are added here when they are made, not retroactively.

---

## DL-019 — Admin panel restructured as a hub; fixed a fixed-position modal bug

**Date:** 2026-08-28 | **Status:** Accepted

**Context:** After shipping the Knowledge Library admin section (DL-018), every modal opened from `AdminView` or `LibraryView` rendered only a dark backdrop — the modal content itself was invisible, with no console error. Root cause: `position: fixed` on an element is positioned relative to the nearest ancestor with a non-`none` `transform` (or `filter`/`perspective`/`will-change: transform`), not the viewport, if such an ancestor exists. Both `AdminView.tsx` and `LibraryView.tsx` applied `animate-fade-up` (which ends on `transform: translateY(0)` with `fill-mode: both`, so the transform persists after the animation completes) directly on the page's root `<div>`, and the modals were rendered as descendants of that same div. This broke their `fixed inset-0` positioning. Existing modals elsewhere in the app (`BoardsList`, `BoardView`, `TopicDrawer`, the header's "New topic" modal) were unaffected because `animate-fade-up` was only ever applied to inner content blocks, never to an ancestor of a modal.

**Decision:** Moved `animate-fade-up` off the root page `<div>` in `AdminView.tsx`, `LibraryView.tsx`, and the new `AdminLibraryView.tsx`, onto an inner wrapper that excludes the modal-rendering subtree. Modals now render as direct children of the (untransformed) root div, matching the pattern already used everywhere else in the codebase.

**Also decided (product request):** Restructured `/admin` from a single page with an inline Knowledge Library section into a hub: `AdminView` shows section tiles (visual style matches `BoardsList` board cards), each navigating to its own route. `Knowledge Library` moved to `/admin/library` (`AdminLibraryView.tsx`), keeping table sorting (by Title/Category/Difficulty/Tags, click-to-toggle direction) and search (across title, category, difficulty, tags) that didn't exist in the original inline version. A disabled "Users" tile marks where the Stage 2 (BL-015) platform-stats section will attach, without building it yet.

**Trade-offs:**
- ✅ Fixes a real, silent bug — no console error made this hard to diagnose without DOM inspection
- ✅ Admin sections now scale without `AdminView` accumulating unrelated inline UI
- ✅ Table sorting/search were missing from the original Library admin table — added as part of this pass
- ❌ One more route + one more file (`AdminLibraryView.tsx`) — acceptable, mirrors the hub pattern intentionally
- ❌ This CSS pitfall (transformed ancestor breaking `position: fixed`) is not enforced by any lint rule — future modal-containing components could reintroduce it if `animate-fade-up` (or any transform-based animation) is placed on a shared root ancestor

---



**Date:** 2026-08-28 | **Status:** Accepted

## DL-018 — Knowledge Library: separate table + full copy on add, not a live reference

**Date:** 2026-08-28 | **Status:** Accepted

**Context:** Product wants a global, curated set of topics ("Knowledge Library") that any user can browse and add to their own boards, without turning the tracker into a shared multi-user learning system. Prior analysis (see conversation history) considered extending `topics` with an `is_library` flag versus a separate table, and a live-reference model versus copy-on-add.

**Decision:**
- **Separate tables**: `library_topics` + `library_topic_tags`, not an extension of `topics`. Library topics have no status/progress/checklist/notes/history — those are per-user learning state, and mixing them into `topics` would create a table with two incompatible row shapes.
- **Full copy, not live reference**: adding a library topic to a board calls `addTopicFromLibrary`, which inserts a normal row into `topics` with `library_topic_id` set to the source. After that, the user's copy is completely independent — editing it never touches the library topic, and editing/deleting the library topic never touches existing copies (`ON DELETE SET NULL` on `library_topic_id`).
- **Tags reused via a new junction, not the existing one**: `topic_tags.topic_id` has an FK to `topics(id)` — library topics physically cannot be referenced there. `library_topic_tags` mirrors the same pattern against `library_topics(id)`, reusing the same global `tags` table.
- **`category` as a plain string**, not a new `Category` entity. Seeded from existing board titles (JavaScript, Docker & CI/CD, etc.) — no need for a hierarchy or metadata table yet.
- **RLS**: `SELECT` open to all authenticated users; `INSERT`/`UPDATE`/`DELETE` restricted to `is_admin()` (reusing the function from DL-016).
- **Duplicate handling**: `findExistingCopy(libraryTopicId)` checks if the user already has a copy anywhere; the UI warns but does not block — the same library topic may legitimately belong on more than one board.
- **Seed data**: one-time migration deduplicates existing `topics` by title, using the parent board's title as `category` and carrying over tags via `topic_tags` — reusing real content instead of writing placeholder seed data.

**New hook, not an extension of `useDataStore`:** `useLibraryStore` is separate because library data has a different lifecycle — read-mostly, no Realtime subscription needed, no optimistic updates. Mixing it into `useDataStore` would grow that hook's scope beyond "the user's own data."

**Admin UI placement:** Library CRUD initially lived as an inline section inside `AdminView.tsx`, since `AdminView` was an empty placeholder (Stage 2 / BL-015) and `AdminRoute` already gates it. Moved to its own route (`/admin/library`) shortly after — see DL-019.

**Trade-offs:**
- ✅ Adding/removing/editing library content never risks corrupting user data
- ✅ No new abstractions beyond what the schema already needed (tags, RLS, is_admin())
- ✅ Seed migration reuses real, already-curated content instead of fabricated placeholder data
- ❌ Editing a library topic does not propagate to topics already copied from it — by design, but means library curation improvements don't reach existing users automatically
- ❌ Two near-identical tag-sync helpers now exist (`syncTopicTags` in useDataStore, `syncLibraryTopicTags` in useLibraryStore) — acceptable duplication given the two hooks are intentionally decoupled

**What was deliberately deferred (not designed yet):**
- Curated Tracks (bundles of library topics, e.g. "Frontend Developer")
- Prerequisite relationships between library topics
- Versioning of library topics
- Propagating library edits to already-copied user topics
- AI-assisted library content generation

---



**Date:** 2026-08-26 | **Status:** Completed (BL-011)

**Context:** Приложение использовало `USING (true)` RLS — любой знающий anon key получал полный доступ ко всем данным. Для публичного деплоя необходима изоляция данных пользователей.

**Decision:** Supabase Auth с email/password. Отдельная таблица `profiles` с полем `role: 'user' | 'admin'`. RLS переключён на `auth.uid() = user_id`.

**Ключевые детали:**
- `profiles` создаётся триггером `on_auth_user_created` автоматически при регистрации
- `is_admin()` — SECURITY DEFINER функция, читает `profiles.role` без рекурсивного RLS
- Admin назначается вручную через Supabase Dashboard / SQL — намеренно, без UI
- `boards` и `topics` получили `user_id uuid NOT NULL REFERENCES auth.users`
- `tags` — глобальные, без `user_id`; `system` теги защищены от записи пользователями
- `topic_tags` RLS проверяет ownership через EXISTS на `topics.user_id`
- `AuthContext` (`src/contexts/AuthContext.tsx`) — провайдер сессии и профиля
- `ProtectedRoute` / `AdminRoute` — route guards в `src/components/ui/Routes.tsx`

**Trade-offs:**
- ✅ Полная изоляция данных по пользователям на уровне БД
- ✅ Admin-роль для платформенной статистики без отдельного сервиса
- ✅ `AuthContext` изолирован от `useDataStore` — чистое разделение ответственности
- ❌ Нет OAuth (GitHub/Google) — только email/password в текущей реализации
- ❌ `topic_tags` RLS использует subquery EXISTS — дополнительный lookup на каждую строку

**Почему не OAuth:** Supabase OAuth требует настройки provider credentials и redirect URLs на каждом окружении. Email/password достаточно для текущего масштаба и проще в деплое.

---



## DL-001 — Supabase over LocalStorage

**Date:** 2026-08 | **Status:** Accepted

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

**Migration path (as planned at the time):** React Router v6. The `View` string union maps 1:1 to route paths (`/`, `/boards`, `/boards/:id`, `/stats`, `/calendar`, `/settings`). The component tree does not change. Tracked in BACKLOG.md BL-005.

**Superseded by:** DL-010 below — the migration was carried out with React Router v7 (declarative mode), not v6 as originally forecast here; the API used is unchanged between the two for this app's needs.

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

## DL-010 — React Router v7 для URL-навигации

**Date:** 2026-08 | **Status:** Accepted

**Context:** Приложение использовало `useState<View>` для навигации между экранами. Кнопка Back в браузере выходила из приложения, deep linking был невозможен.

**Decision:** `react-router-dom` v7 (declarative mode — `BrowserRouter`, `Routes`, `Route`; без Remix-style loaders/actions, которые v7 добавляет опционально). Маршруты: `/`, `/boards`, `/boards/:boardId`, `/stats`, `/calendar`, `/settings`. Topic drawer — query param `?topic=<id>` поверх любого маршрута.

**Trade-offs:**
- ✅ Browser back/forward работает корректно
- ✅ Deep linking — можно поделиться ссылкой на конкретную доску или топик
- ✅ Sidebar использует `<NavLink>` — active state из URL, не из state
- ✅ `View` type и `onView` callback полностью удалены — меньше prop drilling
- ✅ API declarative-режима идентичен v6 — миграция с v6 на v7 не потребовала бы изменений в этом приложении
- ❌ +18KB к бандлу (react-router-dom gzip, измерено при первоначальном внедрении v6; не переизмерялось после обновления до v7)
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

**Mitigation для batch:** `importData` теперь делает два батч-вызова (`upsert([...])` для досок, затем для топиков) вместо отдельного `upsert()` на каждую запись. Финальный `fetchAll()` — канонический момент синхронизации UI после импорта. Realtime-подписка может дополнительно инициировать `fetchAll()` при получении WAL-событий от батч-вставок — debounce-механизма нет, и это нормально для single-user инструмента с редкими импортами.

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

---

## DL-013 — `Topic.updatedAtRaw` добавлен для аналитики

**Date:** 2026-08 | **Status:** Accepted

**Context:** `computeStreak`, `generateWeeklyActivity` и `generateHeatmap` (`src/utils/analytics.ts`) вызывали `new Date(t.updatedAt)`, ожидая ISO-строку. Но `Topic.updatedAt` — это результат `timeAgo()` (`"2h ago"`, `"just now"`), а не ISO-дата. `new Date("just now")` возвращает `Invalid Date`. Итог: стрик всегда показывал `{ current: 0, best: 0 }`, недельная активность на Dashboard и Statistics всегда была нулевой по всем 12 неделям, heatmap оживал только за счёт `createdAt` (даты создания), а не реальной активности.

Баг существовал с момента, когда `TASK-17`/"Real streak" были помечены выполненными в `BACKLOG.md` — сами функции действительно читали реальные данные топиков, но никогда не могли распарсить дату, поэтому фича молча не работала ни разу с момента внедрения.

**Decision:** Добавить `Topic.updatedAtRaw: string` — точная копия уже существующего паттерна `Board.updatedAtRaw` (см. `BoardsList.tsx`, где сортировка досок уже намеренно использует `updatedAtRaw` вместо форматированной строки, с комментарием "reliable, no string parsing" — тот же урок не был перенесён на `Topic`). `mapTopic()` заполняет поле из `raw.updated_at`. Три analytics-функции переключены на `t.updatedAtRaw`.

**Trade-offs:**
- ✅ Стрик, недельная активность и heatmap теперь отражают реальные данные
- ✅ Паттерн идентичен уже принятому для `Board` — не новая абстракция
- ❌ Небольшое увеличение размера объекта `Topic` (одно доп. string-поле)

**Note:** Оптимистичные мутации (`toggleChecklistItem`, `updateTopicStatus` и др.) не обновляют `updatedAtRaw` локально при optimistic update — то же самое уже было верно и для `updatedAt` до этого фикса. Небольшое расхождение до следующего `fetchAll()`/Realtime-обновления, приемлемо в рамках существующего дизайна (DL-007).

---

## DL-015 — Миграция тегов: `topics.tags text[]` → `tags` + `topic_tags`

**Date:** 2026-08-27 | **Status:** Completed (TD-21)

**Context:** При аудите обнаружено, что таблицы `tags` и `topic_tags` существовали в БД и содержали 696 записей для 352 топиков, но `useDataStore` читал и писал исключительно в `topics.tags text[]`. Данные в двух системах расходились по формату: `text[]` хранил slug-подобные строки (`CI-CD`), `topic_tags` — нормализованные имена (`CI/CD`). При любом редактировании тегов через UI данные в `topic_tags` не обновлялись.

**Decision:** Перевести `useDataStore` на `tags` + `topic_tags` как единственный источник данных о тегах. Удалить колонку `topics.tags text[]`.

**Изменения:**
- `fetchAll` — добавлен join `topic_tags(tags(name))`, тег-имена передаются в `mapTopic`
- `updateTopic` — при `data.tags` вызывает `syncTopicTags` вместо записи в `topics.tags`
- `createTopic` — `tags: []` убрано из insert (новый топик создаётся без тегов)
- `duplicateTopic`, `duplicateBoard` — теги копируются через `syncTopicTags`
- `importData` — теги синхронизируются через `syncTopicTags` после upsert topics
- `upsertTags` — upsert тегов по slug с `type: 'custom'`, возвращает `name → id` map
- `syncTopicTags` — атомарная замена всех `topic_tags` для топика
- Миграция `20260827000000_drop_topics_tags_array.sql` — удаляет `topics.tags`
- `Topic.tags: string[]` — тип не изменился, теперь содержит `tags.name` из join

**Trade-offs:**
- ✅ Единый источник правды для тегов
- ✅ Теги с цветом, slug, `type: system | custom` — фундамент для Knowledge Library
- ✅ `Topic.tags: string[]` в UI не изменился — все компоненты работают без правок
- ❌ `fetchAll` теперь делает 3 запроса вместо 2 (topics, boards, topic_tags)
- ❌ `updateTopic` при изменении тегов делает delete + upsert + insert в `topic_tags`

---

## DL-014 — `computeStatusChange()` — единая логика смены статуса топика

**Date:** 2026-08 | **Status:** Accepted

**Context:** Статус топика можно сменить двумя путями: через выпадающий список в `TopicDrawer` и через drag-and-drop карточки между колонками (`useDataStore.updateTopicStatus`). Обе реализации независимо дублировали одну и ту же логику — но **разошлись** в поведении: смена через дровер выставляла `progress: 100` при переходе в `completed` и `progress: 0` при переходе в `to_learn`; DnD-путь прогресс вообще не трогал. Итог — топик мог оказаться в статусе `completed` с `progress: 45%`, если его туда перетащили, а не выбрали статус вручную. Записи истории тоже форматировались по-разному (человекочитаемые лейблы vs сырой `status.replace('_', ' ')`).

**Decision:** Общая логика вынесена в чистую функцию `computeStatusChange(topic, newStatus) → { historyEntry }` (`src/utils/status.ts`). Оба места (`TopicDrawer.tsx: handleStatusChange`, `useDataStore.ts: updateTopicStatus`) вызывают её вместо собственной копии логики.

**Trade-offs:**
- ✅ Оба пути смены статуса теперь гарантированно ведут себя одинаково
- ✅ Единая точка форматирования текста истории
- ✅ ~15 строк дублирования устранено
- ❌ Ещё один файл в `utils/` (минимальная цена за корректность)

---

## DL-017 — Удаление поля `type` из топиков

**Date:** 2026-08 | **Status:** Accepted

**Context:** Топики имели поле `type` (`TopicType`: `learning | book | video | course | documentation | repository | interview | certification | project | custom`). Поле присутствовало в домене, БД, фильтрах BoardView, карточках Kanban и drawer-е топика. На практике оно не несло значимой нагрузки — пользователь вручную устанавливал тип при создании, но в UI тип почти не влиял на поведение (только отображался лейблом). Тегирование (`tags`) уже покрывает ту же потребность в категоризации более гибко.

**Decision:** Поле `type` полностью удалено из доменной модели, БД, всех компонентов и конфига.

Затронутые файлы:
- `supabase/migrations/20260825000000_drop_topic_type.sql` — `ALTER TABLE topics DROP COLUMN IF EXISTS type`
- `src/types/index.ts` — удалён `TopicType`, удалено поле `type` из `Topic`
- `src/config/index.ts` — удалён `topicTypeConfig`
- `src/hooks/useDataStore.ts` — удалены все упоминания `type` из `RawTopic`, `mapTopic`, `createTopic`, `updateTopic`, `duplicateTopic`, `duplicateBoard`, `importData`
- `src/components/drawer/TopicProperties.tsx` — убран select для выбора типа
- `src/components/TopicDrawer.tsx` — убрано из сигнатуры `onUpdate`
- `src/components/board/BoardFilters.tsx` — убран фильтр по типу
- `src/components/board/CardContent.tsx` — убран лейбл типа с карточки
- `src/components/Dashboard.tsx` — убран лейбл типа из "Recently updated"

**Trade-offs:**
- ✅ Упрощение доменной модели — меньше сущностей, меньше поверхности для ошибок
- ✅ Карточка чище — убран лейбл, который не давал пользователю ценной информации
- ✅ Фильтр проще — один активный критерий вместо двух
- ✅ `topicTypeConfig` с 10 вариантами и иконками полностью удалён из бандла
- ❌ Данные в колонке `type` существующих строк безвозвратно отброшены при `DROP COLUMN`
- ❌ Импортированные JSON-файлы со старым полем `type` будут корректно обработаны (поле просто игнорируется Supabase), но значение потеряется

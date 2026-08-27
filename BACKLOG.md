# Improvement Backlog

**Project:** Learning Tracker (React / Vite / Supabase)  
**Last updated:** 2026-08-12

---

## ✅ Выполнено

| ID | Описание |
|----|----------|
| TASK-01 | Удалены хардкод "Alex", стрик 23, "Best: 41d", `Math.random()` в чартах |
| TASK-02 | `mockData.ts` удалён → `src/types/`, `src/config/`, `src/utils/` |
| TASK-03 | Исправлен stale-state баг в TopicDrawer — убран `eslint-disable`, ref-based sync |
| TASK-04 | `boardIcons` и `heatmapColors` — единственный источник в `src/config/index.ts` |
| TASK-05 | Confirm dialog для удаления топиков и досок |
| TASK-06 | Прогресс-слайдер в TopicDrawer |
| TASK-07 | Редактирование тегов в TopicDrawer — add/remove |
| TASK-08 | UI удаления checklist items и resources |
| TASK-09 | DesignSystem убран из навигации |
| TASK-10 | Bell-заглушка и Star-заглушка удалены |
| TASK-11 | Сортировка досок по `updatedAtRaw` — убран хрупкий `sortRank` |
| TASK-12 | Keyboard shortcuts объединены в один `useEffect` |
| TASK-13 | Оптимистичные обновления для checklist и resource операций |
| TASK-14 | `.env.example`, `package.json` name = `learning-tracker` |
| TASK-16 | ID через `crypto.randomUUID()` |
| TASK-17 | `computeStreak` из реальных `updatedAt` |
| BL-001 | Cap history — `history.slice(-50)` в `updateTopic` |
| BL-002 | Дублирование топика — `duplicateTopic` + Copy-кнопка |
| BL-003 | Фильтры в BoardView — по difficulty и type |
| BL-004 | Описание топика редактируемо — textarea + onBlur |
| BL-005 | React Router v7 — URL-навигация, back button, `?topic=` query param |
| BL-006 | Lazy loading — Statistics, CalendarView, SettingsView |
| BL-007 | Inline редактирование заголовка в TopicDrawer |
| BL-008 | Empty state — пошаговый онбординг |
| BL-009 | Drag-and-drop между колонками — `@dnd-kit`, оптимистичный статус, DragOverlay |
| BL-010 | Supabase Realtime — multi-tab sync, индикатор соединения |
| BL-013 | Разбить TopicDrawer — вынесен в `src/components/drawer/`: `TopicHeader`, `TopicProperties`, `TopicChecklist`, `TopicResources`, `TopicNotes`, `TopicHistory`. Сам `TopicDrawer.tsx` — тонкий layout-компонент |
| BL-014 | Разбить BoardView — вынесен в `src/components/board/`: `DraggableCard`, `DroppableColumn`, `CardContent`, `BoardFilters` |

---

## 🟠 Открытые задачи

### BL-011 — Аутентификация (Supabase Auth)

**Причина:** Для публичного деплоя anon key недостаточен — любой знающий URL получает доступ к данным.  
**Стратегия:**
1. `supabase.auth.signInWithOAuth` (GitHub / Google).
2. `user_id uuid` в таблицы `boards` и `topics`.
3. RLS: `USING (auth.uid() = user_id)`.
4. Gate `App.tsx` за проверкой сессии.

**Риск:** Средний — требует миграции схемы и нового UI.

---

### BL-012 — PWA / Offline поддержка

**Причина:** Приложение недоступно без сети. Legacy-версия была offline-first.  
**Стратегия:** `vite-plugin-pwa` + service worker + IndexedDB-кэш для чтения, очередь мутаций для записи.  
**Риск:** Высокий — значительная сложность, конфликты при синхронизации.

---

## 🟡 Технический долг

### ~~TD-21~~ — ✅ Закрыто: `topics.tags text[]` → `topic_tags` + `tags`

Завершено 2026-08-27. `useDataStore` переведён на нормализованную схему. Колонка `topics.tags` удалена миграцией `20260827000000_drop_topics_tags_array.sql`. Подробности: DECISION-LOG.md DL-015.

**Диагноз:** В БД сосуществуют два механизма тегов. Расследование показало:

- `topic_tags` содержит **696 записей** для **352 топиков** — это живые данные с нормализованными названиями (`CI/CD`, `Test Design`, с пробелами и спецсимволами), цветами и slugs
- `topics.tags text[]` содержит теги для тех же **352 топиков**, но в slug-подобном формате (`CI-CD`, `Test-Design`) — данные не идентичны `topic_tags`
- `useDataStore` читает и пишет **только** `topics.tags text[]` — то есть UI работает с устаревшей системой и slug-строками вместо нормализованных названий
- При любом редактировании тегов через UI данные в `topic_tags` не обновляются — расхождение растёт

**Корень проблемы:** При bulk-импорте 23 августа данные залили в обе системы одновременно, но с разным форматированием. `useDataStore` не был переведён на новую систему.

**Действие:** Перевести `useDataStore` на `topic_tags` + `tags`:
1. `fetchAll` — join `topics` → `topic_tags` → `tags`, собирать теги как `Tag[]` (id, name, slug, color), не как `string[]`
2. `updateTopic` — при изменении тегов писать в `topic_tags`, не в `topics.tags`
3. `createTopic` / `duplicateTopic` — создавать записи в `topic_tags`
4. Обновить тип `Topic.tags: Tag[]` вместо `string[]`
5. После миграции — удалить колонку `topics.tags text[]` из схемы БД

**Риск:** Высокий — затрагивает `useDataStore`, все компоненты, работающие с тегами (`TopicProperties`, `CardContent`, фильтры), и тип `Topic`. Требует координированного изменения schema + hook + types + UI.

---

### TD-22 — `deadline_date` в `topics` не отражена в TypeScript-типе `Topic`... частично

**Проблема:** `deadline_date` присутствует в БД и в `RawTopic`, читается в `mapTopic` как `deadlineDate`, и передаётся в `updateTopic`. Но в `src/types/index.ts` тип `Topic` содержит `deadlineDate: string | null` — это уже корректно. Документация (ARCHITECTURE.md) не отражала это поле — исправлено в текущем обновлении. Фактического tech debt в коде нет, только документационный пробел.

---

### TD-23 — `resetStats` пишет несуществующую колонку `progress`

**Проблема:** `resetStats` в `useDataStore.ts` отправляет `{ progress: 0, ... }` в Supabase, но колонки `progress` в таблице `topics` нет. Supabase молча игнорирует неизвестные поля при `update` — запрос не падает, но поведение неочевидно и потенциально маскирует намерение.

Аналогично: `RawTopic` объявляет `progress: number | null` и `mapTopic` возвращает `progress: raw.progress ?? 0`, но в БД этого поля нет — `raw.progress` всегда будет `undefined`, то есть `Topic.progress` всегда `0`.

**Действие:** Либо добавить колонку `progress integer NOT NULL DEFAULT 0` в БД (восстановить намеренную функциональность), либо удалить `progress` из `RawTopic`, `mapTopic`, `Topic` и `resetStats`.

**Риск:** Средний — прогресс-слайдер в UI отображает значение из `Topic.progress`, которое всегда `0`. Пользователь видит прогресс, но он никогда не сохраняется.

---

## 📝 Зафиксировано, не трогать сейчас

Найдено при аудите — не баги, но стоит иметь в виду при следующей работе с этими типами:

- ~~**`CalendarEvent.type`** объявлял `'review' | 'deadline' | 'completed'`, но `generateCalendarEvents()` генерирует только `'review'` и `'completed'` — вариант `'deadline'` был недостижим и отображался в легенде календаря как никогда не наступающее событие.~~ **Закрыто** — `'deadline'` удалён из типа, `eventTypeConfig` и импортов `CalendarView.tsx`. `AlertCircle` также удалён как ставший мёртвым импорт.
- **`HistoryEntry.action`** (`src/types/index.ts`) объявляет `'created' | 'updated' | 'moved' | 'progress'`, но код создаёт записи истории только с `'created'` (при создании/дублировании топика) и `'moved'` (при смене статуса). Варианты `'updated'` и `'progress'` никогда не используются — возможно, задумывалась более детальная история изменений (правки полей, прогресса), но её решили не делать. Та же логика: решить явно, не убирать молча.

---

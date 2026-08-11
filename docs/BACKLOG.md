# Improvement Backlog

**Project:** Learning Tracker (React / Vite / Supabase)
**Last updated:** 2026-08-09

---

## ✅ Выполнено

### Phases 7–12

| Задача | Описание |
|--------|----------|
| TASK-01 | Удалены хардкод "Alex", стрик 23, "Best: 41d", `Math.random()` в чартах |
| TASK-02 | `mockData.ts` удалён → `src/types/`, `src/config/`, `src/utils/` |
| TASK-03 | Исправлен stale-state баг в TopicDrawer — убран `eslint-disable`, ref-based sync |
| TASK-04 | `boardIcons` и `heatmapColors` вынесены в единственный источник (`src/config/index.ts`) |
| TASK-05 | Диалог подтверждения удаления — топики (BoardView, TopicDrawer) и доски (BoardsList) |
| TASK-06 | Прогресс-слайдер в TopicDrawer (range input, шаг 5%) |
| TASK-07 | Редактирование тегов в TopicDrawer — добавление (Enter/запятая) и удаление (×) |
| TASK-08 | UI удаления checklist items и resources (Trash2 on hover + optimistic update) |
| TASK-09 | DesignSystem удалён из навигации Sidebar |
| TASK-10 | Bell-заглушка убрана из header; Star-заглушка убрана из TopicDrawer |
| TASK-11 | Сортировка по `updatedAtRaw` (ISO timestamp) — убран хрупкий `sortRank` |
| TASK-12 | Keyboard shortcuts объединены в один `useEffect` в App.tsx |
| TASK-13 | Оптимистичные обновления для checklist toggle, resource toggle, add/delete |
| TASK-14 | `.env.example` создан; `package.json` name = `learning-tracker` |
| TASK-16 | ID генерируются через `crypto.randomUUID()` — коллизий нет |
| TASK-17 | `computeStreak` вычисляет реальный стрик из `updatedAt` топиков |

---

| BL-005 | React Router v6 — URL-навигация, back button, deep links, `?topic=` query param |

### Backlog Sprint 1

| Задача | Описание |
|--------|----------|
| BL-001 | Cap history — `history.slice(-50)` в `updateTopic` |
| BL-002 | Дублирование топика — `duplicateTopic` в store + Copy-кнопка в TopicDrawer |
| BL-003 | Фильтры в BoardView — по difficulty и type, dropdown с Clear all |
| BL-004 | Описание топика редактируемо — textarea с onBlur save |
| BL-006 | Lazy loading — Statistics, CalendarView, SettingsView через `React.lazy` + `Suspense` |
| BL-007 | Inline редактирование заголовка — click-to-edit в TopicDrawer header |
| BL-008 | Empty state — пошаговый онбординг для новых пользователей |

---

## 🔴 Приоритет 1 — Критичные

Пока нет открытых критичных задач.

---

## 🟡 Приоритет 3 — Средний

| BL-005 | React Router v6 — URL-навигация, back button, deep links, `?topic=` query param |

### BL-006 — Lazy loading view-компонентов

**Причина:** Statistics, Calendar, Settings загружаются при старте приложения, даже если пользователь никогда не открывал эти вкладки. (TASK-15 из исходного backlog.)

**Стратегия:**
```tsx
const Statistics   = lazy(() => import('./components/Statistics'));
const CalendarView = lazy(() => import('./components/CalendarView'));
const SettingsView = lazy(() => import('./components/SettingsView'));
// Обернуть в <Suspense fallback={<Spinner/>}>
```

**Риск:** Низкий.

---

### BL-007 — Inline редактирование заголовка топика

**Причина:** Пользователь не может переименовать топик прямо из карточки или шапки Drawer. Нужно нажать на что-то не очевидное.

**Стратегия:** В TopicDrawer сделать `<h2>` кликабельным: по клику заменяется на `<input>`, по Enter/blur сохраняется через `onUpdate`. Карточки в BoardView аналогично.

**Риск:** Низкий.

---

### BL-008 — Пустой state для новых пользователей

**Причина:** При первом входе Dashboard показывает заголовок "Your learning dashboard" и нули. Лучше вести пользователя к первому действию.

**Стратегия:** Уже частично реализован empty-state в Dashboard (блок `if (totalTopics === 0)`). Улучшить: добавить кнопки "Create first board" и "Add first topic" с подсказками.

**Риск:** Низкий.

---

## 🟢 Приоритет 4 — Низкий / Будущее

### BL-009 — Drag-and-drop между колонками

**Причина:** Ключевая UX-особенность Kanban-инструмента. Сейчас смена статуса — только через Drawer.

**Стратегия:** `@dnd-kit/core` + `@dnd-kit/sortable`. Обновление статуса через `onUpdate` с оптимистичным UI.

**Риск:** Высокий — новая зависимость, сложная логика drag-over между колонками.

---

### BL-010 — Supabase Realtime подписки

**Причина:** При открытии в двух вкладках изменения из одной не отражаются в другой без ручного обновления.

**Стратегия:** `supabase.channel().on('postgres_changes', ...)` + вызов `fetchAll()` при изменениях.

**Риск:** Средний.

---

### BL-011 — Аутентификация (Supabase Auth)

**Причина:** Сейчас anon key позволяет читать/писать всем. Для публичного деплоя нужна Auth.

**Стратегия:**
1. Добавить `supabase.auth.signInWithOAuth` (GitHub / Google).
2. Добавить `user_id` в таблицы boards и topics.
3. Поменять RLS: `USING (auth.uid() = user_id)`.

**Риск:** Средний — требует миграции схемы.

---

### BL-012 — PWA / Offline поддержка

**Причина:** Приложение недоступно без сети. Legacy версия была offline-first (LocalStorage).

**Стратегия:** `vite-plugin-pwa` + service worker + IndexedDB кэш для чтения, очередь мутаций для записи.

**Риск:** Высокий — значительная сложность.

---

*Обновлять после каждого завершённого спринта.*

# Improvement Backlog

**Project:** Learning Tracker (React / Vite / Supabase)
**Last updated:** 2026-08-09

---

## ✅ Выполнено (Phases 7–12)

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

## 🔴 Приоритет 1 — Критичные

Пока нет открытых критичных задач.

---

## 🟠 Приоритет 2 — Высокий

### BL-001 — Ограничить рост history (cap at 50 entries)

**Причина:** `history` хранится как JSONB-массив. При интенсивном использовании он неограниченно растёт, увеличивая размер row Supabase.

**Стратегия:** В `useDataStore.updateTopic` при записи нового history entry обрезать массив до последних 50 записей: `history.slice(-50)`.

**Риск:** Низкий. Пользователь теряет историю старше 50 событий — это приемлемо.

---

### BL-002 — Дублирование топика

**Причина:** Функция предусмотрена в legacy FR-304, но не реализована в UI.

**Стратегия:**
1. Добавить `duplicateTopic(id)` в `useDataStore` — копирует все поля, обнуляет history, сбрасывает `status: 'to_learn'`, `progress: 0`.
2. Добавить пункт меню в TopicDrawer рядом с Trash2.

**Риск:** Низкий.

---

### BL-003 — Фильтрация топиков внутри board view

**Причина:** В BoardView есть поиск по заголовку/тегам, но нет фильтра по статусу, типу или сложности. Legacy FR-703.

**Стратегия:** Добавить dropdown `Filter` с чекбоксами по `status`, `type`, `difficulty`. Поскольку колонки уже разбиты по status, фильтр по нему скрывает целые колонки — это полезно для фокуса.

**Риск:** Низкий — только UI-логика, данные уже есть.

---

### BL-004 — Описание топика редактируемо из Drawer

**Причина:** Описание отображается в TopicDrawer ("No description yet") но не редактируется. Это вводит в заблуждение.

**Стратегия:** Заменить `<p>` на `<textarea>` с `onBlur` → `onUpdate(topic.id, { description })`, аналогично notes.

**Риск:** Низкий.

---

## 🟡 Приоритет 3 — Средний

### BL-005 — React Router для URL-навигации

**Причина:** Browser back/forward не работает. Глубокая ссылка на конкретный topic/board невозможна. (Задокументировано в ARCHITECTURE.md как known limitation.)

**Стратегия:**
1. Установить `react-router-dom` v6.
2. Заменить `useState<View>` в App.tsx на `useNavigate` + `useParams`.
3. Маршруты: `/`, `/boards`, `/boards/:boardId`, `/stats`, `/calendar`, `/settings`.
4. `activeTopicId` — query param `?topic=<id>` или sheet поверх текущего маршрута.

**Риск:** Средний. Требует рефакторинга навигационной логики в App.tsx и Sidebar.

---

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

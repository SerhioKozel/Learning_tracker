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
| BL-005 | React Router v6 — URL-навигация, back button, `?topic=` query param |
| BL-006 | Lazy loading — Statistics, CalendarView, SettingsView |
| BL-007 | Inline редактирование заголовка в TopicDrawer |
| BL-008 | Empty state — пошаговый онбординг |
| BL-009 | Drag-and-drop между колонками — `@dnd-kit`, оптимистичный статус, DragOverlay |
| BL-010 | Supabase Realtime — multi-tab sync, индикатор соединения |

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

### BL-013 — Разбить TopicDrawer (618 строк)

**Причина:** Компонент слишком большой — Properties, Checklist, Resources, Notes, History — каждая секция достаточно крупная для отдельного компонента.  
**Стратегия:** Выделить `TopicProperties.tsx`, `TopicChecklist.tsx`, `TopicResources.tsx` — топик и колбэки прокидываются пропсами. Сам `TopicDrawer` остаётся тонким layout-компонентом.  
**Риск:** Низкий — только разбивка, логика не меняется.

---

### BL-014 — Разбить BoardView (528 строк)

**Причина:** `DraggableCard`, `CardContent`, `DroppableColumn` уже выделены как внутренние компоненты — можно перенести в `src/components/board/`.  
**Стратегия:** `src/components/board/DraggableCard.tsx`, `DroppableColumn.tsx`, `BoardHeader.tsx`, `NewTopicInput.tsx`.  
**Риск:** Низкий.

---

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

_Пусто — предыдущие пункты (BL-013, BL-014) выполнены, см. раздел «✅ Выполнено» выше._

---

## 📝 Зафиксировано, не трогать сейчас

Найдено при аудите — не баги, но стоит иметь в виду при следующей работе с этими типами:

- ~~**`CalendarEvent.type`** объявлял `'review' | 'deadline' | 'completed'`, но `generateCalendarEvents()` генерирует только `'review'` и `'completed'` — вариант `'deadline'` был недостижим и отображался в легенде календаря как никогда не наступающее событие.~~ **Закрыто** — `'deadline'` удалён из типа, `eventTypeConfig` и импортов `CalendarView.tsx`. `AlertCircle` также удалён как ставший мёртвым импорт.
- **`HistoryEntry.action`** (`src/types/index.ts`) объявляет `'created' | 'updated' | 'moved' | 'progress'`, но код создаёт записи истории только с `'created'` (при создании/дублировании топика) и `'moved'` (при смене статуса). Варианты `'updated'` и `'progress'` никогда не используются — возможно, задумывалась более детальная история изменений (правки полей, прогресса), но её решили не делать. Та же логика: решить явно, не убирать молча.

---

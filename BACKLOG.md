# Improvement Backlog

**Project:** Learning Tracker (React / Vite / Supabase)  
**Last updated:** 2026-08-28

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
| BL-011 | Аутентификация — Supabase Auth (email/password), `profiles` таблица с ролями `user`/`admin`, RLS `auth.uid() = user_id`, `AuthContext`, `AuthView`, `AdminView` |
| BL-013 | Разбить TopicDrawer — вынесен в `src/components/drawer/` |
| BL-014 | Разбить BoardView — вынесен в `src/components/board/` |
| BL-016 | Knowledge Library — `library_topics` + `library_topic_tags`, `useLibraryStore`, `LibraryView` (`/library`), "Add to Board" (существующая доска или создание новой, предупреждение о дубликатах), сидинг из существующих 352 топиков. См. DECISION-LOG DL-018 |
| BL-017 | Admin panel переструктурирован в хаб — `AdminView` (плитки разделов) + `AdminLibraryView` (`/admin/library`, сортировка по Title/Category/Difficulty/Tags, поиск). Исправлен баг с невидимыми модалками (`animate-fade-up` на корневом div ломал `position: fixed` у вложенных модалок). См. DECISION-LOG DL-019 |
| TD-21 | Теги переведены с `topics.tags text[]` на `tags` + `topic_tags`. Колонка `topics.tags` удалена миграцией `20260827000000_drop_topics_tags_array.sql`. См. DECISION-LOG DL-015 |
| TD-23 | `progress` удалён из `Topic`, `RawTopic`, `mapTopic`, `resetStats`, `TopicDrawer`, `TopicProperties` — колонки нет в БД |
| TD-24 | Аналитика (`generateHeatmap`, `generateWeeklyActivity`, `computeStreak`, `WeekBars`) переведена с `updatedAtRaw`/`createdAt` на `history` (`moved`/`updated` записи) — создание/импорт топика больше не создаёт ложную активность на графиках |
| TD-25 | `resetStats` — batch update вместо N параллельных запросов; больше не пишет `updated_at`, чтобы не загрязнять историю активности |
| — | `computeFieldUpdates` (`src/utils/status.ts`) — `updateTopic` теперь пишет `'updated'` history-записи при изменении title/description/difficulty/deadlineDate/tags |

---

## 🟠 Открытые задачи

### BL-012 — PWA / Offline поддержка

**Причина:** Приложение недоступно без сети. Legacy-версия была offline-first.  
**Стратегия:** `vite-plugin-pwa` + service worker + IndexedDB-кэш для чтения, очередь мутаций для записи.  
**Риск:** Высокий — значительная сложность, конфликты при синхронизации.

---

## 🟡 Технический долг

### TD-22 — `reviewDate` помечен `@deprecated`, но остаётся в типе и коде

**Проблема:** `Topic.reviewDate` объявлен с `@deprecated` — поле не используется в UI, но читается из БД в `mapTopic` и сохраняется при импорте ради совместимости данных. Колонка `review_date` в БД существует.

**Действие:** Принять явное решение — либо удалить поле и колонку (если функциональность review date больше не нужна), либо убрать `@deprecated` и восстановить UI. Текущее состояние "deprecated но сохраняем" — неопределённость.

**Риск:** Низкий — не ломает ничего, но вводит в заблуждение.

---

## 📝 Зафиксировано, не трогать сейчас

- **`HistoryEntry.action`** объявляет `'created' | 'updated' | 'moved' | 'progress'`, но код создаёт записи только с `'created'` и `'moved'`. Варианты `'updated'` и `'progress'` никогда не используются. Решить явно при следующей работе с историей.
- **`topic_tags` RLS** — таблица `topic_tags` не имеет собственных RLS-политик (только `USING (true)` по умолчанию). После Auth это потенциальная дыра: пользователь может читать чужие `topic_tags` если знает `topic_id`. Закрыть при следующей работе с RLS.

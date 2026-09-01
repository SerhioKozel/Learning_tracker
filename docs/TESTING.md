# Testing Guide

## Структура тестов

```
tests/
├── vitest/              # Unit тесты (Vitest)
│   ├── date.spec.ts
│   ├── id.spec.ts
│   └── status.spec.ts
└── playwright/          # E2E тесты (Playwright)
    └── topic-drawer-actions.spec.ts
```

## Unit Tests (Vitest)

Для тестирования логики утилит и функций.

### Запуск

```bash
# Watch режим (перезапускается при изменении файлов)
npm test

# Однократный запуск
npm run test:unit

# С интерактивным UI
npm run test:unit:ui

# С отчетом о покрытии
npm run test:unit:coverage
```

### Примеры тестируемого кода

- `src/utils/date.ts` — `timeAgo()` функция
- `src/utils/id.ts` — `generateId()` функция
- `src/utils/status.ts` — `computeStatusChange()` и `computeFieldUpdates()`

---

## E2E Tests (Playwright)

Для тестирования интеграции компонентов и UI взаимодействия.

### Запуск

```bash
# Watch режим
npm run test:e2e

# С интерактивным UI (лучше для отладки)
npm run test:e2e:ui

# Debug режим (пошаговое выполнение)
npm run test:e2e:debug
```

### Требования

- Приложение должно быть запущено на `http://localhost:5173`
- Убедитесь, что Supabase доступен с тестовыми данными

### Текущие тесты

- `topic-drawer-actions.spec.ts` — проверяет добавление тега, чеклист-айтема и дедлайна

---

## CI/CD

### Запуск всех тестов

```bash
# Unit + E2E
npm run test:all

# Или отдельно
npm run test:unit
npm run test:e2e
```

### В GitHub Actions

Пример workflow:

```yaml
- name: Run unit tests
  run: npm run test:unit

- name: Run E2E tests
  run: npm run test:e2e
```

---

## Добавление новых тестов

### Unit тест (Vitest)

1. Создайте файл в `tests/vitest/name.spec.ts`
2. Импортируйте `describe`, `it`, `expect` из `vitest`
3. Напишите тесты

Пример:

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from '../../src/utils/my-util';

describe('myFunction', () => {
  it('should do something', () => {
    expect(myFunction()).toBe(expectedValue);
  });
});
```

### E2E тест (Playwright)

1. Создайте файл в `tests/playwright/name.spec.ts`
2. Импортируйте `test`, `expect` из `@playwright/test`
3. Напишите тесты

Пример:

```typescript
import { test, expect } from '@playwright/test';

test.describe('My Feature', () => {
  test('should work', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await expect(page.getByText('Hello')).toBeVisible();
  });
});
```

---

## Отладка

### Vitest

```bash
# Debug mode с браузером devtools
npm run test:unit -- --inspect-brk --inspect
```

### Playwright

```bash
# Debug mode — пошаговое выполнение
npm run test:e2e:debug

# Генерация трассировки
npm run test:e2e -- --trace on
```

---

## Полезные ресурсы

- [Vitest документация](https://vitest.dev/)
- [Playwright документация](https://playwright.dev/)

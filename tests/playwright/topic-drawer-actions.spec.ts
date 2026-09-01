import { test, expect } from '@playwright/test';

test.describe('topic drawer action persistence', () => {
  const topicUrl = 'http://localhost:5173/boards/0b334f62-7b9a-4a12-a7a1-3e712b28b1b4?topic=e1e56c55-b775-4cd2-b054-e3f666136977';

  test('adds a tag, checklist item and deadline and keeps them after reload', async ({ page }) => {
    await page.goto(topicUrl);
    await page.waitForLoadState('networkidle');

    await page.getByText('Add tag…').click();
    const tagInput = page.locator('input[placeholder="Add tag…"]').last();
    await tagInput.fill('zzzqa');
    await tagInput.press('Enter');
    await expect(page.getByText('zzzqa')).toBeVisible({ timeout: 10000 });

    await page.getByText('Add checklist item…').click();
    const checklistInput = page.locator('input[placeholder="Add item…"]').last();
    await checklistInput.fill('zzz checklist item');
    await checklistInput.press('Enter');
    await expect(page.getByText('zzz checklist item')).toBeVisible({ timeout: 10000 });

    const deadlineInput = page.locator('input[type="date"]').first();
    await deadlineInput.fill('2026-09-15');
    await deadlineInput.dispatchEvent('input');
    await deadlineInput.dispatchEvent('change');
    await expect(page.getByText('Sep 15, 2026')).toBeVisible({ timeout: 10000 });

    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('zzzqa')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('zzz checklist item')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Sep 15, 2026')).toBeVisible({ timeout: 10000 });
  });
});

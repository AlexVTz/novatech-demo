/**
 * Portfolio Filters E2E Tests
 */

import { test, expect } from '@playwright/test';

test.describe('Portfolio Filters', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pages/portfolio.html');
  });

  test('should show all projects with "All" pressed by default', async ({ page }) => {
    await expect(page.locator('.project-card:visible')).toHaveCount(6);
    await expect(page.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');
  });

  for (const { filter, label } of [
    { filter: 'web', label: 'Web Apps' },
    { filter: 'mobile', label: 'Mobile' },
    { filter: 'cloud', label: 'Cloud' },
  ]) {
    test(`should show only ${filter} projects when "${label}" is selected`, async ({ page }) => {
      await page.getByRole('button', { name: label }).click();

      await expect(page.locator(`.project-card[data-category="${filter}"]:visible`)).toHaveCount(2);
      await expect(page.locator(`.project-card:not([data-category="${filter}"])`)).toHaveCount(4);
      for (const card of await page.locator(`.project-card:not([data-category="${filter}"])`).all()) {
        await expect(card).toBeHidden();
      }
    });
  }

  test('should update aria-pressed and active class on the selected button only', async ({ page }) => {
    const mobileBtn = page.getByRole('button', { name: 'Mobile' });
    await mobileBtn.click();

    await expect(mobileBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(mobileBtn).toHaveClass(/filter-btn--active/);
    await expect(page.locator('.filter-btn[aria-pressed="true"]')).toHaveCount(1);
    await expect(page.locator('.filter-btn--active')).toHaveCount(1);
  });

  test('should restore all projects when switching back to "All"', async ({ page }) => {
    await page.getByRole('button', { name: 'Cloud' }).click();
    await expect(page.locator('.project-card:visible')).toHaveCount(2);

    await page.getByRole('button', { name: 'All' }).click();
    await expect(page.locator('.project-card:visible')).toHaveCount(6);
  });
});

/**
 * Page Smoke E2E Tests
 */

import { test, expect } from '@playwright/test';

const PAGES = [
  { path: '/pages/index.html', title: /NovaTech Solutions/, heading: '.hero__title', nav: 'Home' },
  { path: '/pages/services.html', title: /Services/, heading: '.page-hero__title', nav: 'Services' },
  { path: '/pages/portfolio.html', title: /Portfolio/, heading: '.page-hero__title', nav: 'Portfolio' },
  { path: '/pages/team.html', title: /Team/, heading: '.page-hero__title', nav: 'Team' },
  { path: '/pages/contact.html', title: /Contact/, heading: '.page-hero__title', nav: 'Contact' },
];

test.describe('Pages', () => {
  for (const { path, title, heading, nav } of PAGES) {
    test(`${nav} page should render landmarks, a single h1 and mark its nav link as current`, async ({ page }) => {
      const errors = [];
      page.on('pageerror', (err) => errors.push(err.message));

      await page.goto(path);

      await expect(page).toHaveTitle(title);
      await expect(page.locator('header')).toBeVisible();
      await expect(page.locator('main#main-content')).toBeVisible();
      await expect(page.locator('footer')).toBeVisible();
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator(heading)).toBeVisible();

      const current = page.locator('.nav__menu [aria-current="page"]');
      await expect(current).toHaveCount(1);
      await expect(current).toHaveText(nav);
      await expect(current).toHaveClass(/nav__link--active/);

      expect(errors).toEqual([]);
    });
  }

  test('should navigate to every page from the main navigation', async ({ page }) => {
    await page.goto('/pages/index.html');

    for (const { title, nav } of PAGES) {
      await page.locator('.nav__menu').getByRole('link', { name: nav }).click();
      await expect(page).toHaveTitle(title);
      await expect(page.locator('.nav__menu [aria-current="page"]')).toHaveText(nav);
    }
  });
});

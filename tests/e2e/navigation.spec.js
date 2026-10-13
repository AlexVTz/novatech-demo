/**
 * Navigation E2E Tests
 */

import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pages/index.html');
  });

  test('should display main navigation links', async ({ page }) => {
    const nav = page.locator('.nav__menu');

    await expect(nav.getByRole('link', { name: 'Home' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Services' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Portfolio' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Team' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Contact' })).toBeVisible();
  });

  test('should navigate to services page', async ({ page }) => {
    await page.click('text=Services');
    await expect(page).toHaveURL(/\/pages\/services/);
    await expect(page.locator('.page-hero__title')).toContainText('Our Services');
  });

  test('should navigate to contact page', async ({ page }) => {
    await page.click('text=Contact');
    await expect(page).toHaveURL(/\/pages\/contact/);
    await expect(page.locator('.page-hero__title')).toContainText('Contact Us');
  });

  test('should highlight active navigation link', async ({ page }) => {
    const homeLink = page.locator('.nav__link--active');
    await expect(homeLink).toContainText('Home');
  });
});

test.describe('Mobile Navigation', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should show mobile menu toggle', async ({ page }) => {
    await page.goto('/pages/index.html');

    const toggle = page.locator('.nav__toggle');
    await expect(toggle).toBeVisible();
  });

  test('should open and close mobile menu', async ({ page }) => {
    await page.goto('/pages/index.html');

    const toggle = page.locator('.nav__toggle');
    const menu = page.locator('.nav__menu');

    await toggle.click();
    await expect(menu).toHaveClass(/is-open/);

    await toggle.click();
    await expect(menu).not.toHaveClass(/is-open/);
  });

  test('should sync aria-expanded with menu state', async ({ page }) => {
    await page.goto('/pages/index.html');

    const toggle = page.locator('.nav__toggle');
    const menu = page.locator('.nav__menu');

    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(menu).toBeHidden();

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(menu).toBeVisible();

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(menu).toBeHidden();
  });

  test('should close menu and return focus to toggle on Escape', async ({ page }) => {
    await page.goto('/pages/index.html');

    const toggle = page.locator('.nav__toggle');
    await toggle.click();
    await page.keyboard.press('Escape');

    await expect(page.locator('.nav__menu')).not.toHaveClass(/is-open/);
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toBeFocused();
  });

  test('should close menu when clicking outside', async ({ page }) => {
    await page.goto('/pages/index.html');

    const toggle = page.locator('.nav__toggle');
    await toggle.click();
    await page.locator('main').click({ position: { x: 10, y: 400 } });

    await expect(page.locator('.nav__menu')).not.toHaveClass(/is-open/);
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  test('should keep menu open when clicking inside it', async ({ page }) => {
    await page.goto('/pages/index.html');

    await page.locator('.nav__toggle').click();
    await page.locator('.nav__menu').click({ position: { x: 1, y: 1 } });

    await expect(page.locator('.nav__menu')).toHaveClass(/is-open/);
  });
});

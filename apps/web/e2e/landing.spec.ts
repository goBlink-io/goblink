import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should load the landing page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/goBlink/i);
  });

  test('should display hero tagline', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Move Value Anywhere');
  });

  test('should display stats counters', async ({ page }) => {
    await page.goto('/');
    
    // Wait for stats section to be visible
    await expect(page.locator('.stat-value').first()).toBeVisible();
    
    // Verify stats are present (values should animate)
    const stats = page.locator('.stat-value');
    await expect(stats).toHaveCount(4);
  });

  test('should show CTA buttons', async ({ page }) => {
    await page.goto('/');
    
    // Main CTA should be visible
    await expect(page.getByRole('button', { name: /preview transfer/i })).toBeVisible();
  });

  test('should display swap form card', async ({ page }) => {
    await page.goto('/');
    
    // Swap form should be visible
    await expect(page.getByText(/you send/i)).toBeVisible();
    await expect(page.getByText(/you receive/i)).toBeVisible();
  });

  test('should display FAQ section', async ({ page }) => {
    await page.goto('/');
    
    // Scroll to FAQ
    await page.locator('text=Questions? Answers.').scrollIntoViewIfNeeded();
    
    // Verify FAQs are present
    await expect(page.locator('text=How does goBlink work?')).toBeVisible();
  });

  test('should expand FAQ on click', async ({ page }) => {
    await page.goto('/');
    
    // Scroll to FAQ
    await page.locator('text=How does goBlink work?').scrollIntoViewIfNeeded();
    
    // Click to expand
    await page.locator('text=How does goBlink work?').click();
    
    // Verify answer is visible
    await expect(page.locator('text=Select your tokens')).toBeVisible();
  });
});

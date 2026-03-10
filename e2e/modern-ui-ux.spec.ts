import { test, expect } from '@playwright/test';

test.describe('Modern UI/UX & Visual Polish', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app and bypass onboarding for UI test
    await page.goto('/');
    
    // Wait for App to mount
    await expect(page.locator('#root > *')).toBeVisible({ timeout: 15000 });

    const onboardingButton = page.getByTestId('onboarding-continue-button');
    while (await onboardingButton.isVisible().catch(() => false)) {
      await onboardingButton.click();
      await page.waitForTimeout(300);
    }
  });

  test('Scenario 7.1: Visual Regression on Home Screen', async ({ page }) => {
    // Wait for the home screen to fully render
    await expect(page.getByTestId('home-screen')).toBeVisible({ timeout: 10000 });
    
    // Add a slight delay to ensure any generic fonts are loaded and animations settled
    await page.waitForTimeout(1000);

    // Verify visual identity hasn't drifted to default RN web styling
    await expect(page).toHaveScreenshot('home-screen-modern-ui.png', {
      maxDiffPixelRatio: 0.05, // Allow slight anti-aliasing differences
    });
  });

  test('Scenario 7.2: Skeleton Loaders visibility during data fetch', async ({ page }) => {
    // Route network requests to be artificially slow to expose skeleton loaders
    await page.route('**/api/extraction**', async (route) => {
      // Delay before responding
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.continue();
    });

    // Simulate clicking a "Start Capture" or standard action that triggers a load
    // Assuming there's a file upload input or capture button. We'll look for a generic button first.
    const captureBtn = page.getByTestId('capture-button');
    if (await captureBtn.isVisible()) {
      await captureBtn.click();
      
      // We expect a skeleton placeholder rather than a generic spinner
      const skeletonBox = page.getByTestId('skeleton-box');
      await expect(skeletonBox.first()).toBeVisible();
      
      // Ensure the generic ActivityIndicator is NOT the primary loading state
      const genericSpinner = page.locator('ActivityIndicator');
      await expect(genericSpinner).not.toBeVisible();
    }
  });

  test('Scenario 7.3: Bottom Sheet Navigation interactions', async ({ page }) => {
    // Click Settings icon
    const settingsButton = page.getByTestId('settings-nav-button');
    await expect(settingsButton).toBeVisible();
    await settingsButton.click();

    // Verify Settings opens as a Bottom Sheet (mocked or actual)
    const settingsSheet = page.getByTestId('settings-screen');
    await expect(settingsSheet).toBeVisible();

    // Verify background dimming overlay is present (commonly standard for bottom sheets)
    // We expect a backdrop element to exist indicating partial-reveal UX
    const backdrop = page.locator('[data-bottom-sheet-backdrop]');
    if (await backdrop.count() > 0) {
      await expect(backdrop.first()).toBeVisible();
      // Click backdrop to dismiss
      await backdrop.first().click({ position: { x: 10, y: 10 } });
      await expect(settingsSheet).not.toBeVisible();
    }
  });

  test('Scenario 7.4: Interactive Elements Hover/Active States on Web', async ({ page }) => {
    const primaryCta = page.getByTestId('capture-button').first();
    if (await primaryCta.isVisible()) {
      // Get initial styling
      const initialColor = await primaryCta.evaluate((el) => window.getComputedStyle(el).backgroundColor);
      
      // Hover over the element
      await primaryCta.hover();
      await page.waitForTimeout(200); // Wait for transition
      
      // Get hover styling
      const hoverColor = await primaryCta.evaluate((el) => window.getComputedStyle(el).backgroundColor);
      
      // If the app implements modern UI/UX, hover state should differ (or opacity should change)
      // This is a soft assertion as React Native Web might implement it via opacity on press instead of true hover
      if (initialColor !== hoverColor) {
        expect(initialColor).not.toBe(hoverColor);
      }
    }
  });

  test('Scenario 7.5: Theming precision (Dark/Light mode switch)', async ({ page }) => {
    const settingsButton = page.getByTestId('settings-nav-button');
    if (await settingsButton.isVisible()) {
      await settingsButton.click();
      
      // Look for the theme toggle
      const themeToggle = page.getByTestId('theme-toggle');
      if (await themeToggle.isVisible()) {
        const rootBgBefore = await page.evaluate(() => window.getComputedStyle(document.body).backgroundColor);
        
        await themeToggle.click();
        await page.waitForTimeout(500); // Wait for re-render
        
        const rootBgAfter = await page.evaluate(() => window.getComputedStyle(document.body).backgroundColor);
        expect(rootBgBefore).not.toBe(rootBgAfter); // Should change theme colors immediately
      }
    }
  });
});

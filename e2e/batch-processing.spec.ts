import { test, expect } from '@playwright/test';

test.describe('Suite 4: Batch Processing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#root > *')).toBeVisible({ timeout: 15000 });
    const onboardingButton = page.getByTestId('onboarding-continue-button');
    while (await onboardingButton.isVisible().catch(() => false)) {
      await onboardingButton.click();
      await page.waitForTimeout(300);
    }
  });

  test('Scenario 4.1: Multi-file batch progress tracking', async ({ page }) => {
    // Navigate to Batch mode if there's a specific button
    const batchBtn = page.getByTestId('home-batch-button');
    if (await batchBtn.isVisible()) {
      await batchBtn.click();
    }

    // Mock batch extraction status
    await page.route('**/api/batch-status', async (route) => {
      await route.fulfill({
        json: {
          processed: 2,
          total: 5,
          items: [
            { id: 1, status: 'completed' },
            { id: 2, status: 'completed' },
            { id: 3, status: 'processing' },
            { id: 4, status: 'pending' },
            { id: 5, status: 'pending' },
          ]
        }
      });
    });

    // Check for batch progress UI
    await expect(page.getByTestId('batch-progress-container')).toBeVisible();
    await expect(page.getByText('2 of 5 documents processed')).toBeVisible();
    
    // Verify per-item progress indicators
    const processingItem = page.getByTestId('batch-item-3-status');
    await expect(processingItem).toContainText('processing');
  });

  test('Scenario 4.2: Concurrency limiter setting effect', async ({ page }) => {
    // Navigate to settings
    await page.getByTestId('settings-nav-button').click();
    
    const concurrencySlider = page.getByTestId('concurrency-slider');
    if (await concurrencySlider.isVisible()) {
      // Change concurrency to 2
      await concurrencySlider.fill('2');
      
      // Verify setting update (implementation detail depends on component)
      await expect(page.getByText('Max Concurrency: 2')).toBeVisible();
    }
  });
});

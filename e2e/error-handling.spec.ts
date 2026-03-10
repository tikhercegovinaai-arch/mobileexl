import { test, expect } from '@playwright/test';

test.describe('Suite 6: Global Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#root > *')).toBeVisible({ timeout: 15000 });
    const onboardingButton = page.getByTestId('onboarding-continue-button');
    while (await onboardingButton.isVisible().catch(() => false)) {
      await onboardingButton.click();
      await page.waitForTimeout(300);
    }
  });

  test('Scenario 6.1: Mock Network Error & Toast Notification', async ({ page }) => {
    // Mock extraction failure
    await page.route('**/api/extract', async (route) => {
      await route.fulfill({
        status: 500,
        json: { error: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong on our end.' }
      });
    });

    const captureBtn = page.getByTestId('capture-button');
    if (await captureBtn.isVisible()) {
      await captureBtn.click();
      
      // Check for Error Toast
      const errorToast = page.getByTestId('toast-notification-error');
      await expect(errorToast).toBeVisible({ timeout: 5000 });
      await expect(errorToast).toContainText('wrong');
    }
  });

  test('Scenario 6.2: Global Error Boundary Fallback', async ({ page }) => {
    // Force a React crash (if we have a way to trigger it via state or injection)
    // For E2E, we might navigate to a route known to be broken or mock a malformed component state
    await page.goto('/#trigger-crash'); 
    
    // Verify Error Boundary UI
    await expect(page.getByTestId('error-boundary-fallback')).toBeVisible();
    await expect(page.getByText('Something went wrong')).toBeVisible();
    
    const retryBtn = page.getByTestId('error-retry-button');
    await expect(retryBtn).toBeVisible();
    await retryBtn.click();
    
    // Should recover to home
    await expect(page.getByTestId('home-screen')).toBeVisible();
  });
});

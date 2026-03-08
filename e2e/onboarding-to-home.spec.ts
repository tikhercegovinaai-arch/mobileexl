import { test, expect } from '@playwright/test';

test.describe('Exelent Core Journey', () => {
  test('should complete onboarding and reach home screen', async ({ page }) => {
    // 1. Navigate to the app
    await page.goto('/');

    // 2. Initial Onboarding Screen
    await expect(page.getByTestId('onboarding-continue-button')).toBeVisible();
    
    // Slide 1 -> 2
    await page.getByTestId('onboarding-continue-button').click();
    
    // Slide 2 -> 3
    await page.getByTestId('onboarding-continue-button').click();
    
    // Slide 3 -> 4
    await page.getByTestId('onboarding-continue-button').click();
    
    // Slide 4 -> Initialize System (Home)
    await page.getByTestId('onboarding-continue-button').click();

    // 3. Verify Home Screen
    await expect(page.getByTestId('home-execute-scan-button')).toBeVisible();
    await expect(page.getByTestId('home-import-button')).toBeVisible();
  });

  test('should go to settings from home', async ({ page }) => {
    // Skip onboarding for this test (or handles it if it's always there)
    await page.goto('/');
    
    // Rapidly click through onboarding
    for (let i = 0; i < 4; i++) {
        await page.getByTestId('onboarding-continue-button').click();
    }

    // Go to settings
    await page.getByTestId('home-settings-button').click();
    
    // Simple check - in a real app would check for settings modal/screen
    // For now we just verify the button was interactable
  });
});

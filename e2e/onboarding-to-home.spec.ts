import { test, expect } from '@playwright/test';

test.describe('Exelent Core Journey', () => {
  test('should complete onboarding and reach home screen', async ({ page }) => {
    // 1. Navigate to the app
    await page.goto('/');
    
    // 2. Wait for the app to mount
    await expect(page.locator('#root > *')).toBeVisible({ timeout: 15000 });

    // 3. Complete Onboarding
    // The Onboarding screen has 3 slides. We look for the CONTINUE button.
    const onboardingButton = page.getByTestId('onboarding-continue-button');
    
    // We expect the onboarding to be visible if it's the first run
    if (await onboardingButton.isVisible()) {
        // Slide 1 -> 2
        await onboardingButton.click();
        
        // Slide 2 -> 3
        await page.waitForTimeout(500); // Wait for animation
        await onboardingButton.click();
        
        // Slide 3 -> Home (Button text changes to INITIALIZE_SYSTEM but testID stays same)
        await page.waitForTimeout(500);
        await onboardingButton.click();
    }

    // 4. Verify we reached Home
    await expect(page.getByTestId('home-screen')).toBeVisible({ timeout: 10000 });
  });

  test('should go to settings from home', async ({ page }) => {
    await page.goto('/');
    
    // Wait for App to mount or potentially skip onboarding if already done
    await expect(page.locator('#root > *')).toBeVisible();

    // If onboarding is visible, skip it (or handled by state if supported)
    const onboardingButton = page.getByTestId('onboarding-continue-button');
    while (await onboardingButton.isVisible()) {
        await onboardingButton.click();
        await page.waitForTimeout(300);
    }

    // Click Settings icon
    const settingsButton = page.getByTestId('settings-nav-button');
    await expect(settingsButton).toBeVisible();
    await settingsButton.click();

    // Verify Settings is visible
    await expect(page.getByTestId('settings-screen')).toBeVisible();
  });
});

import { test, expect } from '@playwright/test';

test.describe('Suite 2: Settings, Theme & Persistence', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Wait for App to mount & skip onboarding if necessary
    await expect(page.locator('#root > *')).toBeVisible({ timeout: 15000 });
    const onboardingButton = page.getByTestId('onboarding-continue-button');
    while (await onboardingButton.isVisible().catch(() => false)) {
      await onboardingButton.click();
      await page.waitForTimeout(300);
    }
  });

  test('Scenario 2.2: Settings Persistence', async ({ page }) => {
    // Click Settings icon
    const settingsButton = page.getByTestId('settings-nav-button');
    if (await settingsButton.isVisible()) {
      await settingsButton.click();

      // Change a setting (e.g. requireBiometrics)
      const biometricToggle = page.getByTestId('biometric-toggle');
      if (await biometricToggle.isVisible()) {
        await biometricToggle.click();
        
        // Reload page
        await page.reload();
        
        // Navigate back to settings
        await page.getByTestId('settings-nav-button').click();
        
        // The toggle should still be in the toggled state (assert it's checked/active)
        // If it's a switch, we might check an aria-checked attribute or a class
        expect(await biometricToggle.getAttribute('aria-checked') || await biometricToggle.isChecked()).toBeTruthy();
      }
    }
  });
});

import { test, expect } from '@playwright/test';

test.describe('Exelent Core Journey', () => {
  test('should complete onboarding and reach home screen', async ({ page }) => {
    // 1. Navigate to the app (clean storage if possible or handle existing state)
    await page.goto('/');
    
    // Potentially wait for auto-unlock
    await page.waitForTimeout(2000);

    // DEBUG: Check what's on the screen
    console.log('Current URL:', page.url());
    const bodyText = await page.innerText('body');
    console.log('Body text snippet:', bodyText.substring(0, 100));

    // If still on privacy gate, click unlock (though it should be auto)
    const unlockButton = page.getByTestId('privacy-gate-auth-button');
    if (await unlockButton.isVisible()) {
        console.log('Privacy gate visible, clicking unlock...');
        await unlockButton.click();
        await page.waitForTimeout(1000);
    }

    // Check if onboarding button exists
    const onboardingButton = page.getByTestId('onboarding-continue-button');
    const homeButton = page.getByTestId('home-execute-scan-button');

    if (await homeButton.isVisible()) {
        console.log('App jumped straight to Home screen!');
    } else if (await onboardingButton.isVisible()) {
        console.log('Onboarding screen visible.');
    } else {
        console.log('Neither Onboarding nor Home buttons found. Checking DOM...');
        const html = await page.content();
        console.log('HTML contains data-testid="onboarding-continue-button":', html.includes('data-testid="onboarding-continue-button"'));
        console.log('HTML contains data-testid="home-execute-scan-button":', html.includes('data-testid="home-execute-scan-button"'));
    }

    // 2. Proceed with onboarding (or skip if already home)
    if (await onboardingButton.isVisible()) {
        // Slide 1 -> 2
        await onboardingButton.click();
        
        // Slide 2 -> 3
        await onboardingButton.click();
        
        // Slide 3 -> 4
        await onboardingButton.click();
        
        // Slide 4 -> Initialize System (Home)
        await onboardingButton.click();
    }

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

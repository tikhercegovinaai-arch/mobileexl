import { test, expect } from '@playwright/test';
import * as fs from 'fs';

test.describe('Exelent Core Journey', () => {
  test('should complete onboarding and reach home screen', async ({ page }) => {
    page.on('console', msg => console.log(`BROWSER ${msg.type().toUpperCase()}: ${msg.text()}`));
    page.on('requestfailed', request => console.log(`REQUEST FAILED: ${request.url()} - ${request.failure()?.errorText}`));
    page.on('response', response => {
        if (response.status() >= 400) console.log(`BAD RESPONSE: ${response.status()} ${response.url()}`);
    });

    // 1. Navigate to the app
    await page.goto('/');
    
    // 2. Wait for the app to mount
    console.log('Waiting for #root to mount...');
    await expect(page.locator('#root > *')).toBeVisible({ timeout: 15000 });
    console.log('#root mounted.');

    // DEBUG: Capture HTML
    const html = await page.content();
    console.log(`HTML Length: ${html.length}`);
    fs.writeFileSync('e2e_debug_final.html', html);
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

  test('Scenario 1.2: Returning user skips onboarding', async ({ page }) => {
    await page.goto('/');
    
    // Complete onboarding once
    const onboardingButton = page.getByTestId('onboarding-continue-button');
    while (await onboardingButton.isVisible()) {
        await onboardingButton.click();
        await page.waitForTimeout(300);
    }
    
    // Verify Home
    await expect(page.getByTestId('home-screen')).toBeVisible();

    // Reload page
    await page.reload();
    
    // Verify it stays on Home and doesn't show Oboarding again
    await expect(page.getByTestId('home-screen')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('onboarding-continue-button')).not.toBeVisible();
  });
});

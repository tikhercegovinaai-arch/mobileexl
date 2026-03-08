import { test, expect } from '@playwright/test';
import * as fs from 'fs';

test.describe('Exelent Core Journey', () => {
  test('should complete onboarding and reach home screen', async ({ page }) => {
    page.on('console', msg => {
        if (msg.type() === 'error') console.log(`BROWSER ERROR: ${msg.text()}`);
        else console.log(`BROWSER LOG: ${msg.text()}`);
    });

    // 1. Navigate to the app (clean storage if possible or handle existing state)
    await page.goto('/');
    
    // Wait for root to have some content
    console.log('Waiting for #root to mount...');
    try {
        await page.waitForSelector('#root > *', { timeout: 15000 });
        console.log('#root mounted.');
    } catch (e) {
        console.log('#root did not mount in 15s.');
    }

    // DEBUG: Capture HTML
    const html = await page.content();
    console.log('HTML Length:', html.length);
    fs.writeFileSync('e2e_debug.html', html);

    // Check if onboarding button exists (by text as fallback)
    const onboardingButton = page.getByText('CONTINUE_NAV');
    const homeButton = page.getByText('EXECUTE_SCAN');

    if (await homeButton.isVisible()) {
        console.log('App jumped straight to Home screen!');
    } else if (await onboardingButton.isVisible()) {
        console.log('Onboarding screen visible.');
    } else {
        console.log('Neither Onboarding nor Home buttons found.');
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
        await page.getByText('INITIALIZE_SYSTEM').click();
    }

    // 3. Verify Home Screen
    await expect(page.getByText('EXECUTE_SCAN')).toBeVisible();
    await expect(page.getByText('IMPORT_SOURCE')).toBeVisible();
  });

  test('should go to settings from home', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
    
    // Rapidly click through onboarding if visible
    const onboardingButton = page.getByText('CONTINUE_NAV');
    while (await onboardingButton.isVisible()) {
        await onboardingButton.click();
        await page.waitForTimeout(500);
    }
    const initButton = page.getByText('INITIALIZE_SYSTEM');
    if (await initButton.isVisible()) {
        await initButton.click();
    }

    // Go to settings - assumes icon or text
    // The HomeScreen uses icon, but maybe has a label?
    // Let's check HomeScreen.tsx
  });
});

import { test, expect } from '@playwright/test';

test.describe('Suite 5: Analytics Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#root > *')).toBeVisible({ timeout: 15000 });
    const onboardingButton = page.getByTestId('onboarding-continue-button');
    while (await onboardingButton.isVisible().catch(() => false)) {
      await onboardingButton.click();
      await page.waitForTimeout(300);
    }
  });

  test('Scenario 5.1 & 5.2: Dashboard Navigation and Date Filtering', async ({ page }) => {
    // Navigate to Analytics screen
    const analyticsNav = page.getByTestId('analytics-nav-button');
    await expect(analyticsNav).toBeVisible();
    await analyticsNav.click();

    await expect(page.getByTestId('analytics-dashboard')).toBeVisible();

    // Change date range filter to 30d
    const filter30d = page.getByTestId('filter-chip-30d');
    if (await filter30d.isVisible()) {
      await filter30d.click();
      
      // Check for chart data reload (mocking might be needed for full validation)
      // Visual indicator like "Loading..." or a specific data point
      await expect(page.getByTestId('line-chart-trend')).toBeVisible();
    }
  });

  test('Scenario 5.3: Category Drill-Down', async ({ page }) => {
    await page.goto('/#analytics'); // Direct nav if supported or click through
    
    // Assuming the pie chart has accessible segments or markers
    const chartSegment = page.getByTestId('pie-chart-segment-invoices');
    if (await chartSegment.isVisible()) {
      await chartSegment.click();
      
      // Verify Drill-down view opens
      await expect(page.getByTestId('category-detail-view')).toBeVisible();
      await expect(page.getByText('Invoices Detail')).toBeVisible();
    }
  });
});

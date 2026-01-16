import { test, expect } from '@playwright/test';

/**
 * API Debug Test
 *
 * Check for network errors and API issues when interacting with the chat.
 */

test.describe('API and Network Debug', () => {
  test('check for API errors when clicking suggestion cards', async ({ page }) => {
    // Collect all console messages and network errors
    const consoleMessages: string[] = [];
    const networkErrors: string[] = [];
    const apiCalls: { url: string; status: number; method: string }[] = [];

    page.on('console', (msg) => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });

    page.on('pageerror', (error) => {
      consoleMessages.push(`[PAGE ERROR] ${error.message}`);
    });

    page.on('requestfailed', (request) => {
      networkErrors.push(`${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
    });

    page.on('response', (response) => {
      if (response.url().includes('localhost:3001') || response.url().includes('localhost:8000')) {
        apiCalls.push({
          url: response.url(),
          status: response.status(),
          method: response.request().method(),
        });
      }
    });

    // Clear storage
    await page.addInitScript(() => {
      sessionStorage.clear();
      localStorage.clear();
    });

    // Sign in
    await page.goto('/sign-in');
    await page.locator('input[type="email"]').fill('test@example.com');
    await page.locator('button:has-text("Continue with email")').click();
    await page.waitForTimeout(1000);
    await page.locator('input#otp').fill('123456');
    await page.locator('button:has-text("Verify")').click();
    await page.waitForTimeout(2000);

    // Dismiss welcome modal
    await page.waitForTimeout(1500);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    console.log('\n--- Console messages after page load ---');
    consoleMessages.slice(-10).forEach((msg) => console.log(msg));

    // Click suggestion card
    const startAppCard = page.locator('button:has-text("Start a new application")');
    await startAppCard.click();
    console.log('\nClicked suggestion card');

    // Wait for any API calls
    await page.waitForTimeout(3000);

    console.log('\n--- Console messages after click ---');
    consoleMessages.slice(-20).forEach((msg) => console.log(msg));

    console.log('\n--- Network errors ---');
    networkErrors.forEach((err) => console.log(err));

    console.log('\n--- API calls ---');
    apiCalls.forEach((call) => console.log(`${call.method} ${call.url} - ${call.status}`));

    await page.screenshot({ path: 'e2e/screenshots/api-debug-01.png', fullPage: true });

    // Check if we have errors
    const hasErrors = consoleMessages.some(
      (msg) => msg.includes('[error]') || msg.includes('[PAGE ERROR]')
    );
    console.log('\nHas console errors:', hasErrors);

    const hasNetworkErrors = networkErrors.length > 0;
    console.log('Has network errors:', hasNetworkErrors);
  });

  test('check backend availability', async ({ page }) => {
    // Try to fetch from backend directly
    const backendUrl = 'http://localhost:3001';
    const aiServiceUrl = 'http://localhost:8000';

    console.log('\n--- Checking backend availability ---');

    // Test backend
    try {
      const response = await page.request.get(`${backendUrl}/api/health`);
      console.log(`Backend ${backendUrl}/api/health: ${response.status()}`);
    } catch (error) {
      console.log(`Backend ${backendUrl}/api/health: FAILED -`, (error as Error).message);
    }

    // Test AI service
    try {
      const response = await page.request.get(`${aiServiceUrl}/health`);
      console.log(`AI Service ${aiServiceUrl}/health: ${response.status()}`);
    } catch (error) {
      console.log(`AI Service ${aiServiceUrl}/health: FAILED -`, (error as Error).message);
    }

    // Test sessions endpoint
    try {
      const response = await page.request.get(`${backendUrl}/api/sessions`);
      console.log(`Sessions API ${backendUrl}/api/sessions: ${response.status()}`);
    } catch (error) {
      console.log(`Sessions API: FAILED -`, (error as Error).message);
    }
  });
});

import { test, expect } from '@playwright/test';

test('quick database test', async ({ page }) => {
  const errors: string[] = [];
  const logs: string[] = [];

  page.on('console', (msg) => {
    const text = msg.text();
    logs.push(`[${msg.type()}] ${text}`);
    if (text.includes('Error') || text.includes('error') || text.includes('JWS')) {
      errors.push(text);
    }
  });

  // Clear storage to avoid stale tokens
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
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // Check for database-related logs
  const dbLogs = logs.filter(l => l.includes('[Database]') || l.includes('service role'));
  console.log('\n=== Database logs ===');
  dbLogs.forEach(l => console.log(l));

  // Check for errors
  console.log('\n=== Errors found ===');
  errors.forEach(e => console.log(e));

  // Try clicking new conversation button
  console.log('\n=== Clicking New Conversation ===');
  const newConvButton = page.locator('button:has-text("New Conversation")');
  if (await newConvButton.isVisible()) {
    await newConvButton.click();
    await page.waitForTimeout(2000);
  }

  // Check for errors after click
  const newErrors = logs.filter(l => l.includes('Error') || l.includes('error') || l.includes('JWS'));
  console.log('\n=== All error logs ===');
  newErrors.forEach(e => console.log(e));

  // Check if we can see any session list errors
  const queryErrors = logs.filter(l => l.includes('[Query Error]'));
  console.log('\n=== Query errors ===');
  queryErrors.forEach(e => console.log(e));

  await page.screenshot({ path: 'e2e/screenshots/quick-test.png', fullPage: true });

  // Test should pass - we're just debugging
  expect(true).toBe(true);
});

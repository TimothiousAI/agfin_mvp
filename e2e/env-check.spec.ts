import { test, expect } from '@playwright/test';

test.describe('Environment Check', () => {
  test('check environment variables via console log', async ({ page }) => {
    const logs: string[] = [];
    page.on('console', (msg) => {
      if (msg.text().includes('[Database]') || msg.text().includes('[ENV]')) {
        logs.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForTimeout(3000);

    console.log('Console logs about env:', logs);
  });
});

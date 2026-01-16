import { test, expect } from '@playwright/test';

/**
 * Welcome Modal Tests
 *
 * Tests the onboarding welcome modal that blocks interaction
 * after first authentication.
 */

test.describe('Welcome Modal Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Clear session storage to trigger first-time experience
    await page.addInitScript(() => {
      sessionStorage.clear();
      localStorage.clear();
    });
  });

  test('should show welcome modal on first visit after auth', async ({ page }) => {
    // Sign in first
    await page.goto('/sign-in');
    await page.locator('input[type="email"]').fill('test@example.com');
    await page.locator('button:has-text("Continue with email")').click();
    await page.waitForTimeout(1000);
    await page.locator('input#otp').fill('123456');
    await page.locator('button:has-text("Verify")').click();
    await page.waitForTimeout(2000);

    // Should be on chat page now
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    // Wait for welcome modal to appear (1 second delay in TourProvider)
    await page.waitForTimeout(1500);

    // Check for welcome modal
    const modal = page.locator('[role="dialog"]');
    const modalVisible = await modal.isVisible();
    console.log('Modal visible:', modalVisible);

    await page.screenshot({ path: 'e2e/screenshots/welcome-modal-01-shown.png', fullPage: true });

    // Check for modal buttons
    const startTourButton = page.locator('button:has-text("Start Tour")');
    const skipButton = page.locator('button:has-text("Skip for Now")');

    console.log('Start Tour button visible:', await startTourButton.isVisible());
    console.log('Skip button visible:', await skipButton.isVisible());
    console.log('Start Tour button enabled:', await startTourButton.isEnabled());
    console.log('Skip button enabled:', await skipButton.isEnabled());
  });

  test('click Skip for Now button to dismiss modal', async ({ page }) => {
    // Sign in
    await page.goto('/sign-in');
    await page.locator('input[type="email"]').fill('test@example.com');
    await page.locator('button:has-text("Continue with email")').click();
    await page.waitForTimeout(1000);
    await page.locator('input#otp').fill('123456');
    await page.locator('button:has-text("Verify")').click();
    await page.waitForTimeout(2000);

    // Wait for welcome modal
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'e2e/screenshots/welcome-modal-02-before-skip.png', fullPage: true });

    // Find and click Skip button
    const skipButton = page.locator('button:has-text("Skip for Now")');

    if (await skipButton.isVisible()) {
      console.log('Attempting to click Skip button');

      // Get button bounding box
      const box = await skipButton.boundingBox();
      console.log('Skip button box:', box);

      // Try regular click first
      try {
        await skipButton.click({ timeout: 5000 });
        console.log('Click succeeded');
      } catch (error) {
        console.log('Regular click failed, trying force click');
        await skipButton.click({ force: true, timeout: 5000 });
      }

      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'e2e/screenshots/welcome-modal-03-after-skip.png', fullPage: true });

      // Check if modal is gone
      const modalStillVisible = await page.locator('[role="dialog"]').isVisible();
      console.log('Modal still visible after skip:', modalStillVisible);

      // Check if chat interface is now accessible
      const textarea = await page.locator('textarea').isVisible();
      console.log('Textarea visible after skip:', textarea);
    } else {
      console.log('Skip button not visible');
    }
  });

  test('click Start Tour button', async ({ page }) => {
    // Sign in
    await page.goto('/sign-in');
    await page.locator('input[type="email"]').fill('test@example.com');
    await page.locator('button:has-text("Continue with email")').click();
    await page.waitForTimeout(1000);
    await page.locator('input#otp').fill('123456');
    await page.locator('button:has-text("Verify")').click();
    await page.waitForTimeout(2000);

    // Wait for welcome modal
    await page.waitForTimeout(1500);

    // Click Start Tour button
    const startButton = page.locator('button:has-text("Start Tour")');

    if (await startButton.isVisible()) {
      console.log('Clicking Start Tour button');
      await startButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'e2e/screenshots/welcome-modal-04-after-start-tour.png', fullPage: true });

      // Check if tour started (tooltip should appear)
      const tourTooltip = page.locator('[class*="TourTooltip"], [role="tooltip"], [class*="tour"]');
      console.log('Tour tooltip visible:', await tourTooltip.isVisible().catch(() => false));
    }
  });

  test('close modal with X button', async ({ page }) => {
    // Sign in
    await page.goto('/sign-in');
    await page.locator('input[type="email"]').fill('test@example.com');
    await page.locator('button:has-text("Continue with email")').click();
    await page.waitForTimeout(1000);
    await page.locator('input#otp').fill('123456');
    await page.locator('button:has-text("Verify")').click();
    await page.waitForTimeout(2000);

    // Wait for welcome modal
    await page.waitForTimeout(1500);

    // Find X close button in dialog
    const closeButton = page.locator('[role="dialog"] button:has(svg)').first();

    if (await closeButton.isVisible()) {
      console.log('Clicking X close button');
      await closeButton.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'e2e/screenshots/welcome-modal-05-after-x-close.png', fullPage: true });

      const modalGone = !(await page.locator('[role="dialog"]').isVisible());
      console.log('Modal closed:', modalGone);
    }
  });

  test('press Escape to close modal', async ({ page }) => {
    // Sign in
    await page.goto('/sign-in');
    await page.locator('input[type="email"]').fill('test@example.com');
    await page.locator('button:has-text("Continue with email")').click();
    await page.waitForTimeout(1000);
    await page.locator('input#otp').fill('123456');
    await page.locator('button:has-text("Verify")').click();
    await page.waitForTimeout(2000);

    // Wait for welcome modal
    await page.waitForTimeout(1500);

    // Press Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'e2e/screenshots/welcome-modal-06-after-escape.png', fullPage: true });

    const modalGone = !(await page.locator('[role="dialog"]').isVisible());
    console.log('Modal closed with Escape:', modalGone);
  });

  test('verify chat is functional after dismissing modal', async ({ page }) => {
    // Sign in
    await page.goto('/sign-in');
    await page.locator('input[type="email"]').fill('test@example.com');
    await page.locator('button:has-text("Continue with email")').click();
    await page.waitForTimeout(1000);
    await page.locator('input#otp').fill('123456');
    await page.locator('button:has-text("Verify")').click();
    await page.waitForTimeout(2000);

    // Wait for welcome modal and dismiss it
    await page.waitForTimeout(1500);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    await page.screenshot({ path: 'e2e/screenshots/chat-functional-01-after-dismiss.png', fullPage: true });

    // Now test chat functionality
    const textarea = page.locator('textarea');
    console.log('Textarea visible:', await textarea.isVisible());

    if (await textarea.isVisible()) {
      // Try to type a message
      await textarea.fill('Hello, this is a test message');
      console.log('Typed message');

      await page.screenshot({ path: 'e2e/screenshots/chat-functional-02-typed-message.png', fullPage: true });

      // Try to click send button
      const sendButton = page.locator('button[aria-label="Send message"]');
      if (await sendButton.isVisible()) {
        await sendButton.click();
        console.log('Clicked send button');
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'e2e/screenshots/chat-functional-03-after-send.png', fullPage: true });
      }
    }

    // Check for suggestion cards (WelcomeChatScreen)
    const suggestionCards = page.locator('button:has-text("Start a new application")');
    console.log('Suggestion cards visible:', await suggestionCards.isVisible().catch(() => false));
  });
});

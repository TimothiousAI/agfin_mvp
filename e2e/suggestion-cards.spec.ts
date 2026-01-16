import { test, expect } from '@playwright/test';

/**
 * Suggestion Cards Test
 *
 * Tests that clicking suggestion cards on the WelcomeChatScreen
 * actually triggers chat functionality.
 */

test.describe('Suggestion Cards Functionality', () => {
  test.beforeEach(async ({ page }) => {
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
  });

  test('should show suggestion cards on welcome screen', async ({ page }) => {
    await page.screenshot({ path: 'e2e/screenshots/suggestion-01-welcome.png', fullPage: true });

    // Check for suggestion cards
    const startAppCard = page.locator('button:has-text("Start a new application")');
    const uploadDocsCard = page.locator('button:has-text("Upload documents")');
    const checkStatusCard = page.locator('button:has-text("Check application status")');

    expect(await startAppCard.isVisible()).toBeTruthy();
    expect(await uploadDocsCard.isVisible()).toBeTruthy();
    expect(await checkStatusCard.isVisible()).toBeTruthy();

    console.log('All suggestion cards visible');
  });

  test('click "Start a new application" card', async ({ page }) => {
    await page.screenshot({ path: 'e2e/screenshots/suggestion-02-before-click.png', fullPage: true });

    const startAppCard = page.locator('button:has-text("Start a new application")');

    // Get card info
    const box = await startAppCard.boundingBox();
    console.log('Start app card box:', box);

    // Check if card is visible and enabled
    const isVisible = await startAppCard.isVisible();
    const isEnabled = await startAppCard.isEnabled();
    console.log('Card visible:', isVisible, 'enabled:', isEnabled);

    // Click the card
    await startAppCard.click();
    console.log('Clicked Start a new application card');

    // Wait for response
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'e2e/screenshots/suggestion-03-after-click.png', fullPage: true });

    // Check if chat interface appeared with the message
    const chatMessages = page.locator('[class*="message"], [class*="Message"]');
    const messageCount = await chatMessages.count();
    console.log('Message count:', messageCount);

    // Check if textarea appeared (ChatCenter should be shown now)
    const textarea = page.locator('textarea');
    const textareaVisible = await textarea.isVisible();
    console.log('Textarea visible after click:', textareaVisible);

    // Check current URL
    console.log('Current URL:', page.url());
  });

  test('click "New Conversation" button in sidebar', async ({ page }) => {
    const newConvButton = page.locator('button:has-text("New Conversation")');

    if (await newConvButton.isVisible()) {
      console.log('Clicking New Conversation button');
      await newConvButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'e2e/screenshots/suggestion-04-after-new-conv.png', fullPage: true });

      // Check what happened
      const currentUrl = page.url();
      console.log('URL after New Conversation:', currentUrl);
    }
  });

  test('type directly in chat input (if available)', async ({ page }) => {
    // First click a suggestion card to get the chat interface
    const startAppCard = page.locator('button:has-text("Start a new application")');
    await startAppCard.click();
    await page.waitForTimeout(2000);

    // Now try to type in the textarea
    const textarea = page.locator('textarea');

    if (await textarea.isVisible()) {
      await textarea.fill('This is a test message');
      console.log('Typed test message');

      await page.screenshot({ path: 'e2e/screenshots/suggestion-05-typed-message.png', fullPage: true });

      // Try pressing Enter to send
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2000);

      await page.screenshot({ path: 'e2e/screenshots/suggestion-06-after-send.png', fullPage: true });
      console.log('Pressed Enter to send');
    } else {
      console.log('Textarea not visible');
      await page.screenshot({ path: 'e2e/screenshots/suggestion-05-no-textarea.png', fullPage: true });
    }
  });
});

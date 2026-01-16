import { test, expect, Page } from '@playwright/test';

/**
 * Chat Functionality Diagnostic Tests
 *
 * Tests to diagnose why buttons and chat functionality aren't working on /chat page.
 * Based on PRD user journey:
 * - After login, user lands on chat interface
 * - User can click suggestion cards
 * - User can start a new conversation
 * - User can send messages
 */

test.describe('Chat Page Functionality Diagnosis', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to chat page
    await page.goto('/chat');
    await page.waitForLoadState('domcontentloaded');
  });

  test('diagnose page load state and element visibility', async ({ page }) => {
    // Wait for potential redirects or loading states
    await page.waitForTimeout(2000);

    // Take screenshot of initial state
    await page.screenshot({ path: 'e2e/screenshots/chat-01-initial-state.png', fullPage: true });

    // Check what URL we're actually on (might have redirected)
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    // Check if we're on sign-in page (authentication redirect)
    const isSignInPage = currentUrl.includes('sign-in');
    console.log('On sign-in page:', isSignInPage);

    if (isSignInPage) {
      console.log('ISSUE: Redirected to sign-in - need authentication');
      await page.screenshot({ path: 'e2e/screenshots/chat-02-signin-redirect.png', fullPage: true });
    }

    // Check for any error messages on page
    const errorElements = await page.locator('[class*="error"], [role="alert"], .error, #error').all();
    console.log('Error elements found:', errorElements.length);

    // Check for loading indicators
    const loadingElements = await page.locator('[class*="loading"], [class*="spinner"], .loading').all();
    console.log('Loading elements found:', loadingElements.length);

    // Log all visible buttons
    const buttons = await page.locator('button').all();
    console.log('Total buttons on page:', buttons.length);

    for (let i = 0; i < Math.min(buttons.length, 10); i++) {
      const btn = buttons[i];
      const isVisible = await btn.isVisible();
      const isEnabled = await btn.isEnabled();
      const text = await btn.textContent();
      const boundingBox = await btn.boundingBox();
      console.log(`Button ${i}: visible=${isVisible}, enabled=${isEnabled}, text="${text?.trim()}", box=`, boundingBox);
    }
  });

  test('check for overlapping elements blocking clicks', async ({ page }) => {
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'e2e/screenshots/chat-03-before-click-test.png', fullPage: true });

    // Find a clickable element (suggestion card or button)
    const clickTargets = [
      'button:has-text("Start a new application")',
      'button:has-text("Create Application")',
      'button:has-text("New")',
      '[class*="SuggestionCard"]',
      'textarea',
      'button[aria-label="Send message"]',
    ];

    for (const selector of clickTargets) {
      const element = page.locator(selector).first();
      const isVisible = await element.isVisible().catch(() => false);

      if (isVisible) {
        console.log(`\n--- Testing element: ${selector} ---`);
        const box = await element.boundingBox();
        console.log('Bounding box:', box);

        if (box) {
          // Check what element is at the center of this element
          const centerX = box.x + box.width / 2;
          const centerY = box.y + box.height / 2;

          const elementAtPoint = await page.evaluate(
            ({ x, y }) => {
              const el = document.elementFromPoint(x, y);
              if (!el) return null;
              return {
                tagName: el.tagName,
                className: el.className,
                id: el.id,
                textContent: el.textContent?.substring(0, 50),
                pointerEvents: window.getComputedStyle(el).pointerEvents,
              };
            },
            { x: centerX, y: centerY }
          );
          console.log('Element at center point:', elementAtPoint);

          // Try to click and see what happens
          try {
            await element.click({ timeout: 3000 });
            console.log('Click succeeded!');
          } catch (error) {
            console.log('Click failed:', (error as Error).message);
          }
        }
      } else {
        console.log(`Element not visible: ${selector}`);
      }
    }

    await page.screenshot({ path: 'e2e/screenshots/chat-04-after-click-test.png', fullPage: true });
  });

  test('check for JavaScript errors', async ({ page }) => {
    const jsErrors: string[] = [];
    const consoleMessages: string[] = [];

    // Listen for console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        jsErrors.push(msg.text());
      }
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });

    // Listen for page errors
    page.on('pageerror', (error) => {
      jsErrors.push(`Page Error: ${error.message}`);
    });

    await page.waitForTimeout(3000);

    console.log('\n--- Console Messages ---');
    consoleMessages.slice(0, 20).forEach((msg) => console.log(msg));

    console.log('\n--- JavaScript Errors ---');
    jsErrors.forEach((err) => console.log(err));

    await page.screenshot({ path: 'e2e/screenshots/chat-05-js-error-check.png', fullPage: true });
  });

  test('check CSS pointer-events and z-index issues', async ({ page }) => {
    await page.waitForTimeout(2000);

    // Check for elements with pointer-events: none
    const pointerEventsNone = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const problematic: Array<{ tag: string; className: string; pointerEvents: string }> = [];

      elements.forEach((el) => {
        const style = window.getComputedStyle(el);
        if (style.pointerEvents === 'none' && el.tagName !== 'SVG' && el.tagName !== 'PATH') {
          problematic.push({
            tag: el.tagName,
            className: (el as HTMLElement).className?.toString()?.substring(0, 100) || '',
            pointerEvents: style.pointerEvents,
          });
        }
      });

      return problematic.slice(0, 20);
    });

    console.log('\n--- Elements with pointer-events: none ---');
    pointerEventsNone.forEach((el) => console.log(el));

    // Check for high z-index overlays
    const highZIndex = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const highZ: Array<{ tag: string; className: string; zIndex: string; position: string }> = [];

      elements.forEach((el) => {
        const style = window.getComputedStyle(el);
        const zIndex = parseInt(style.zIndex, 10);
        if (!isNaN(zIndex) && zIndex > 10) {
          highZ.push({
            tag: el.tagName,
            className: (el as HTMLElement).className?.toString()?.substring(0, 100) || '',
            zIndex: style.zIndex,
            position: style.position,
          });
        }
      });

      return highZ;
    });

    console.log('\n--- Elements with high z-index ---');
    highZIndex.forEach((el) => console.log(el));
  });

  test('check for modal/overlay blocking interaction', async ({ page }) => {
    await page.waitForTimeout(2000);

    // Check for modals, dialogs, overlays
    const overlays = await page.evaluate(() => {
      const selectors = [
        '[role="dialog"]',
        '[role="alertdialog"]',
        '[class*="modal"]',
        '[class*="overlay"]',
        '[class*="backdrop"]',
        '[class*="Overlay"]',
        '[class*="Modal"]',
        '.fixed.inset-0',
      ];

      const found: Array<{ selector: string; count: number; visible: boolean[] }> = [];

      selectors.forEach((selector) => {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          const visible = Array.from(elements).map((el) => {
            const style = window.getComputedStyle(el);
            return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
          });
          found.push({ selector, count: elements.length, visible });
        }
      });

      return found;
    });

    console.log('\n--- Potential blocking overlays ---');
    overlays.forEach((o) => console.log(o));

    await page.screenshot({ path: 'e2e/screenshots/chat-06-overlay-check.png', fullPage: true });
  });

  test('test clicking new conversation button in sidebar', async ({ page }) => {
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'e2e/screenshots/chat-07-before-new-chat.png', fullPage: true });

    // Look for new conversation button
    const newChatButtons = [
      'button:has-text("New")',
      'button:has-text("New Conversation")',
      'button:has-text("New Chat")',
      'button[aria-label*="new"]',
      '[data-testid="new-conversation"]',
    ];

    for (const selector of newChatButtons) {
      const button = page.locator(selector).first();
      if (await button.isVisible().catch(() => false)) {
        console.log(`Found new chat button: ${selector}`);

        // Force click (bypasses pointer-events: none)
        try {
          await button.click({ force: true, timeout: 5000 });
          console.log('Force click succeeded');
          await page.waitForTimeout(1000);
          await page.screenshot({ path: 'e2e/screenshots/chat-08-after-new-chat-click.png', fullPage: true });
        } catch (error) {
          console.log('Force click failed:', (error as Error).message);
        }
        break;
      }
    }
  });

  test('test sending a message', async ({ page }) => {
    await page.waitForTimeout(2000);

    // Find the text input
    const textInput = page.locator('textarea, input[type="text"]').first();

    if (await textInput.isVisible().catch(() => false)) {
      console.log('Found text input');

      // Try to type in it
      try {
        await textInput.click({ force: true });
        await page.waitForTimeout(200);
        await textInput.fill('Hello, test message');
        console.log('Text input succeeded');

        await page.screenshot({ path: 'e2e/screenshots/chat-09-after-typing.png', fullPage: true });

        // Find send button
        const sendButton = page.locator('button[aria-label="Send message"], button:has(svg[class*="Send"])').first();
        if (await sendButton.isVisible().catch(() => false)) {
          console.log('Found send button');
          await sendButton.click({ force: true });
          await page.waitForTimeout(2000);
          await page.screenshot({ path: 'e2e/screenshots/chat-10-after-send.png', fullPage: true });
        }
      } catch (error) {
        console.log('Text input failed:', (error as Error).message);
      }
    } else {
      console.log('Text input not visible');
    }
  });

  test('check DOM structure for expected components', async ({ page }) => {
    await page.waitForTimeout(2000);

    const components = await page.evaluate(() => {
      return {
        // Check for main layout components
        appLayout: !!document.querySelector('[class*="AppLayout"], [class*="app-layout"]'),
        sidebar: !!document.querySelector('[class*="Sidebar"], aside, nav'),
        chatCenter: !!document.querySelector('[class*="ChatCenter"], main'),
        artifactPanel: !!document.querySelector('[class*="ArtifactPanel"], [class*="Artifact"]'),

        // Check for welcome screen
        welcomeScreen: !!document.querySelector('[class*="Welcome"]'),
        suggestionCards: document.querySelectorAll('[class*="Suggestion"]').length,

        // Check for input elements
        textarea: !!document.querySelector('textarea'),
        buttons: document.querySelectorAll('button').length,

        // Check for loading states
        loadingScreen: !!document.querySelector('[class*="Loading"]'),
        spinner: !!document.querySelector('[class*="spinner"], [class*="Spinner"]'),

        // Check body classes
        bodyClasses: document.body.className,

        // Get the outermost container structure
        rootStructure: (() => {
          const root = document.getElementById('root');
          if (!root) return 'No #root found';
          const firstChild = root.firstElementChild;
          if (!firstChild) return '#root is empty';
          return `#root > ${firstChild.tagName}.${firstChild.className?.toString()?.substring(0, 50)}`;
        })(),
      };
    });

    console.log('\n--- DOM Structure Check ---');
    Object.entries(components).forEach(([key, value]) => {
      console.log(`${key}:`, value);
    });
  });

  test('full user journey simulation with force interactions', async ({ page }) => {
    await page.waitForTimeout(2000);

    console.log('\n=== SIMULATING USER JOURNEY ===\n');

    // Step 1: Initial state
    await page.screenshot({ path: 'e2e/screenshots/journey-01-initial.png', fullPage: true });

    // Step 2: Try clicking a suggestion card
    const suggestionCard = page.locator('button:has-text("Start a new application")').first();
    if (await suggestionCard.isVisible().catch(() => false)) {
      console.log('Step 2: Clicking suggestion card');
      await suggestionCard.click({ force: true });
      await page.waitForTimeout(1500);
      await page.screenshot({ path: 'e2e/screenshots/journey-02-after-suggestion.png', fullPage: true });
    } else {
      console.log('Step 2: Suggestion card not visible');
    }

    // Step 3: Try typing a message
    const input = page.locator('textarea').first();
    if (await input.isVisible().catch(() => false)) {
      console.log('Step 3: Typing in text area');
      await input.focus();
      await input.fill('I want to start a new crop loan application');
      await page.screenshot({ path: 'e2e/screenshots/journey-03-after-typing.png', fullPage: true });

      // Step 4: Send the message
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'e2e/screenshots/journey-04-after-send.png', fullPage: true });
    } else {
      console.log('Step 3: Textarea not visible');
    }

    console.log('\n=== JOURNEY COMPLETE ===\n');
  });
});

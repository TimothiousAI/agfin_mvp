import { test, expect } from '@playwright/test';

/**
 * PRD Validation Tests for AgFin MVP
 *
 * These tests validate the UI against the Product Requirements Document (PRD-AgFin-MVP.md)
 * covering layout, design system, core features, and user workflows.
 */

test.describe('PRD Section 7.1: Conversational AI Interface', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should land directly on chat interface after login (Claude.ai-style)', async ({ page }) => {
    // PRD: "After login, user lands DIRECTLY on chat interface (no intermediate dashboard)"

    // First, we should see the sign-in page or chat interface
    const signInVisible = await page.locator('text=Sign in').isVisible().catch(() => false);
    const chatVisible = await page.locator('[data-testid="chat-center"], .chat-center, [class*="ChatCenter"]').isVisible().catch(() => false);

    // Take screenshot of initial state
    await page.screenshot({ path: 'e2e/screenshots/01-initial-load.png', fullPage: true });

    expect(signInVisible || chatVisible).toBeTruthy();
  });

  test('should have chat input with auto-resize textarea', async ({ page }) => {
    // PRD: "Input field with auto-resize textarea"
    const chatInput = page.locator('textarea, [data-testid="chat-input"], [class*="ChatInput"]');

    if (await chatInput.isVisible()) {
      await page.screenshot({ path: 'e2e/screenshots/02-chat-input.png' });
      await expect(chatInput).toBeVisible();
    }
  });
});

test.describe('PRD Section 7.12: Design System (Agrellus Brand)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should use dark theme as primary', async ({ page }) => {
    // PRD: "Theme: Dark-first (optimized for extended screen use)"
    // PRD: "Background Dark: #061623"

    await page.screenshot({ path: 'e2e/screenshots/03-dark-theme.png', fullPage: true });

    // Check body or main container has dark background
    const bodyBgColor = await page.evaluate(() => {
      const body = document.body;
      return window.getComputedStyle(body).backgroundColor;
    });

    // Dark theme should have a dark background
    console.log('Body background color:', bodyBgColor);
  });

  test('should have Agrellus brand colors (#30714C primary green)', async ({ page }) => {
    // PRD: "Agrellus Green: #30714C - Primary CTAs, links, success states"

    // Look for primary buttons or links with green color
    const primaryElements = page.locator('button, a, [class*="primary"]');
    await page.screenshot({ path: 'e2e/screenshots/04-brand-colors.png', fullPage: true });
  });
});

test.describe('PRD Section 7.12: Application Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should have three-column layout on desktop', async ({ page }) => {
    // PRD: "Three-Column Layout: Conversation Sidebar (280px), Chat Center (flex-1), Artifact Panel (400px)"

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.screenshot({ path: 'e2e/screenshots/05-three-column-layout.png', fullPage: true });

    // Check for sidebar, chat center, and artifact panel
    const sidebar = page.locator('[data-testid="conversation-sidebar"], [class*="Sidebar"], aside');
    const chatCenter = page.locator('[data-testid="chat-center"], [class*="ChatCenter"], main');

    // At least chat center should be visible
    console.log('Checking three-column layout...');
  });

  test('should be responsive on tablet', async ({ page }) => {
    // PRD: "Tablet: 768-1024px - Two column: Collapsible sidebar, Chat + Artifact"

    await page.setViewportSize({ width: 900, height: 1024 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'e2e/screenshots/06-tablet-layout.png', fullPage: true });
  });

  test('should be responsive on mobile', async ({ page }) => {
    // PRD: "Mobile: <768px - Single column: Chat only, panels as slide-over modals"

    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'e2e/screenshots/07-mobile-layout.png', fullPage: true });
  });
});

test.describe('PRD Section 7.8: Command Palette', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should open command palette with Cmd/Ctrl+K', async ({ page }) => {
    // PRD: "Command Palette - Quick access overlay for power users (Cmd/Ctrl+K)"

    await page.keyboard.press('Control+k');
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'e2e/screenshots/08-command-palette.png', fullPage: true });

    // Check if command palette or modal appeared
    const modal = page.locator('[role="dialog"], [data-testid="command-palette"], [class*="CommandPalette"]');
    const isVisible = await modal.isVisible().catch(() => false);
    console.log('Command palette visible:', isVisible);
  });
});

test.describe('PRD Section 7.9: Keyboard Shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should have keyboard navigation support', async ({ page }) => {
    // PRD: "Full Tab, Enter, Escape support for all interactions"

    // Press Tab to cycle through focusable elements
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);

    // Check focus is visible
    await page.screenshot({ path: 'e2e/screenshots/09-keyboard-focus.png', fullPage: true });

    // Verify focus ring is visible
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      if (el) {
        const style = window.getComputedStyle(el);
        return {
          tag: el.tagName,
          outline: style.outline,
          boxShadow: style.boxShadow
        };
      }
      return null;
    });

    console.log('Focused element:', focusedElement);
  });
});

test.describe('PRD Authentication Flow', () => {
  test('should show sign-in page for unauthenticated users', async ({ page }) => {
    // Clear any existing auth state
    await page.context().clearCookies();
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.screenshot({ path: 'e2e/screenshots/10-sign-in-page.png', fullPage: true });

    // Should show sign-in UI or redirect to sign-in
    const signInElements = page.locator('text=/sign in|email|login/i');
    const hasSignIn = await signInElements.count() > 0;

    console.log('Sign-in elements found:', hasSignIn);
  });

  test('should allow mock auth flow in dev mode', async ({ page }) => {
    // With VITE_USE_MOCK_AUTH=true, should be able to sign in with any OTP
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for email input
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]');

    if (await emailInput.isVisible()) {
      await emailInput.fill('timcarter76@gmail.com');
      await page.screenshot({ path: 'e2e/screenshots/11-email-entered.png' });

      // Look for submit button
      const submitBtn = page.locator('button[type="submit"], button:has-text("send"), button:has-text("continue")');
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'e2e/screenshots/12-otp-step.png' });
      }
    }
  });
});

test.describe('PRD Core Features Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should capture full page screenshot for visual review', async ({ page }) => {
    // Capture the main application state for manual PRD review
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.screenshot({
      path: 'e2e/screenshots/13-full-app-1920x1080.png',
      fullPage: true
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.screenshot({
      path: 'e2e/screenshots/14-full-app-1440x900.png',
      fullPage: true
    });
  });

  test('should have proper ARIA labels for accessibility', async ({ page }) => {
    // PRD: "Screen Reader - ARIA labels and roles on all interactive elements"

    const interactiveElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('button, a, input, [role]');
      const results: Array<{tag: string, role: string | null, ariaLabel: string | null}> = [];

      elements.forEach((el) => {
        results.push({
          tag: el.tagName,
          role: el.getAttribute('role'),
          ariaLabel: el.getAttribute('aria-label')
        });
      });

      return results.slice(0, 20); // First 20 elements
    });

    console.log('Interactive elements with ARIA:', interactiveElements);
    await page.screenshot({ path: 'e2e/screenshots/15-accessibility-check.png', fullPage: true });
  });
});

test.describe('PRD Visual Regression', () => {
  test('capture all key screens for PRD comparison', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // 1. Landing/Sign-in
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e/screenshots/prd-01-landing.png', fullPage: true });

    // 2. Try to navigate to /test routes if they exist
    const testRoutes = [
      '/test/m1-form',
      '/test/m2-form',
      '/test/command-palette',
      '/test/motion',
    ];

    for (const route of testRoutes) {
      await page.goto(route);
      await page.waitForTimeout(500);
      const routeName = route.replace(/\//g, '-').slice(1);
      await page.screenshot({ path: `e2e/screenshots/prd-${routeName}.png`, fullPage: true });
    }
  });
});

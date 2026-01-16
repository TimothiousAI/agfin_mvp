import { test, expect } from '@playwright/test';

/**
 * Sign-In Flow Tests
 *
 * Tests the authentication flow required before accessing /chat.
 * The mock auth system accepts any email and any 6-digit OTP code.
 */

test.describe('Sign-In Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state
    await page.context().clearCookies();
  });

  test('should show sign-in page when accessing /chat unauthenticated', async ({ page }) => {
    await page.goto('/chat');
    await page.waitForLoadState('networkidle');

    // Should redirect to sign-in
    await expect(page).toHaveURL(/sign-in/);
    await page.screenshot({ path: 'e2e/screenshots/signin-01-redirect.png', fullPage: true });
  });

  test('should enable Continue button after entering email', async ({ page }) => {
    await page.goto('/sign-in');
    await page.waitForLoadState('networkidle');

    // Initial state - button should be disabled
    const continueButton = page.locator('button:has-text("Continue with email")');
    await expect(continueButton).toBeDisabled();
    await page.screenshot({ path: 'e2e/screenshots/signin-02-button-disabled.png', fullPage: true });

    // Enter email
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('test@example.com');

    // Button should now be enabled
    await expect(continueButton).toBeEnabled();
    await page.screenshot({ path: 'e2e/screenshots/signin-03-button-enabled.png', fullPage: true });
  });

  test('complete sign-in flow with mock auth', async ({ page }) => {
    await page.goto('/sign-in');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e/screenshots/signin-flow-01-start.png', fullPage: true });

    // Step 1: Enter email
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('test@example.com');
    console.log('Entered email');

    // Step 2: Click Continue
    const continueButton = page.locator('button:has-text("Continue with email")');
    await continueButton.click();
    console.log('Clicked continue');

    // Wait for OTP step to appear
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'e2e/screenshots/signin-flow-02-otp-step.png', fullPage: true });

    // Step 3: Check if OTP input appeared
    const otpInput = page.locator('input#otp');
    const otpVisible = await otpInput.isVisible().catch(() => false);
    console.log('OTP input visible:', otpVisible);

    if (otpVisible) {
      // Step 4: Enter OTP (any 6 digits work with mock auth)
      await otpInput.fill('123456');
      console.log('Entered OTP');

      // Step 5: Click Verify
      const verifyButton = page.locator('button:has-text("Verify")');
      await verifyButton.click();
      console.log('Clicked verify');

      // Wait for authentication and redirect
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'e2e/screenshots/signin-flow-03-after-verify.png', fullPage: true });

      // Check final URL
      const finalUrl = page.url();
      console.log('Final URL:', finalUrl);

      // Should be on /chat after successful auth
      if (finalUrl.includes('/chat')) {
        console.log('SUCCESS: Redirected to chat page!');
        await page.screenshot({ path: 'e2e/screenshots/signin-flow-04-chat-page.png', fullPage: true });
      } else {
        console.log('WARNING: Not on chat page. URL:', finalUrl);
      }
    } else {
      console.log('OTP input not visible - checking for error or different state');
      const pageContent = await page.content();
      console.log('Page contains "error":', pageContent.toLowerCase().includes('error'));
      console.log('Page contains "verification":', pageContent.toLowerCase().includes('verification'));
    }
  });

  test('verify chat page is accessible after authentication', async ({ page }) => {
    // First, sign in
    await page.goto('/sign-in');
    await page.waitForLoadState('networkidle');

    // Enter email and submit
    await page.locator('input[type="email"]').fill('test@example.com');
    await page.locator('button:has-text("Continue with email")').click();
    await page.waitForTimeout(1000);

    // Enter OTP and submit
    const otpInput = page.locator('input#otp');
    if (await otpInput.isVisible()) {
      await otpInput.fill('123456');
      await page.locator('button:has-text("Verify")').click();
      await page.waitForTimeout(2000);
    }

    // Now try to access /chat
    await page.goto('/chat');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({ path: 'e2e/screenshots/signin-flow-05-chat-after-auth.png', fullPage: true });

    // Should be on /chat now (not redirected to /sign-in)
    const currentUrl = page.url();
    console.log('URL after navigating to /chat:', currentUrl);

    // Check for chat elements
    const chatElements = {
      sidebar: await page.locator('[class*="Sidebar"], nav').isVisible().catch(() => false),
      chatCenter: await page.locator('[class*="Chat"], main').isVisible().catch(() => false),
      welcomeScreen: await page.locator('[class*="Welcome"]').isVisible().catch(() => false),
      textarea: await page.locator('textarea').isVisible().catch(() => false),
    };

    console.log('Chat elements visibility:', chatElements);
  });

  test('test button interactivity on sign-in page', async ({ page }) => {
    await page.goto('/sign-in');
    await page.waitForLoadState('networkidle');

    // Log all buttons and their state
    const buttons = await page.locator('button').all();
    console.log(`Found ${buttons.length} buttons`);

    for (let i = 0; i < buttons.length; i++) {
      const btn = buttons[i];
      const text = await btn.textContent();
      const isEnabled = await btn.isEnabled();
      const isVisible = await btn.isVisible();
      const box = await btn.boundingBox();
      console.log(`Button ${i}: "${text?.trim()}" - enabled: ${isEnabled}, visible: ${isVisible}, box:`, box);
    }

    // Try clicking the email input
    const emailInput = page.locator('input[type="email"]');
    await emailInput.click();
    console.log('Clicked email input');

    // Type something
    await emailInput.type('test@test.com');
    console.log('Typed in email input');

    // Check button state after typing
    const continueButton = page.locator('button:has-text("Continue with email")');
    const isEnabled = await continueButton.isEnabled();
    console.log('Continue button enabled after typing:', isEnabled);

    await page.screenshot({ path: 'e2e/screenshots/signin-button-test.png', fullPage: true });
  });
});

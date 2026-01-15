# Accessibility Testing Checklist

This checklist ensures that our application meets WCAG 2.1 Level AA accessibility standards and provides an excellent experience for all users, including those using assistive technologies.

## Table of Contents

- [Keyboard Navigation](#keyboard-navigation)
- [Screen Reader Testing](#screen-reader-testing)
- [Color and Contrast](#color-and-contrast)
- [Zoom and Text Scaling](#zoom-and-text-scaling)
- [Touch Targets](#touch-targets)
- [ARIA Validation](#aria-validation)
- [Automated Testing](#automated-testing)
- [Manual Testing Workflow](#manual-testing-workflow)

---

## Keyboard Navigation

All interactive elements must be keyboard accessible without requiring a mouse.

### Testing Steps

- [ ] **Tab Navigation**
  - Press `Tab` to move forward through interactive elements
  - Press `Shift+Tab` to move backward
  - Verify logical tab order (left-to-right, top-to-bottom)
  - Ensure no keyboard traps (can always escape from components)

- [ ] **Focus Indicators**
  - All focused elements have visible focus indicators
  - Focus indicators have sufficient contrast (3:1 minimum)
  - Focus indicators are not hidden by design

- [ ] **Interactive Elements**
  - Buttons: `Enter` or `Space` to activate
  - Links: `Enter` to follow
  - Checkboxes: `Space` to toggle
  - Radio buttons: `Arrow keys` to navigate, `Space` to select
  - Dropdowns: `Arrow keys` to navigate, `Enter` to select
  - Dialogs: `Esc` to close

- [ ] **Custom Components**
  - Command palette: `Cmd/Ctrl+K` to open, `Esc` to close
  - Modals: `Esc` to close, focus trapped within modal
  - Tooltips: Accessible via keyboard focus
  - Menus: `Arrow keys` to navigate, `Enter` to select

- [ ] **Skip Links**
  - Skip to main content link appears on first `Tab`
  - Skip link works correctly
  - Skip link is visually hidden until focused

### Expected Behavior

✅ **Pass**: All interactive elements are reachable and operable via keyboard
❌ **Fail**: Any element requires mouse interaction

---

## Screen Reader Testing

Test with popular screen readers to ensure content is announced correctly.

### Tools

- **macOS**: VoiceOver (built-in)
  - Start: `Cmd+F5`
  - Navigate: `VO+Arrow keys` (VO = `Control+Option`)

- **Windows**: NVDA (free) or JAWS (paid)
  - Download: https://www.nvaccess.org/
  - Navigate: `Arrow keys`, `Tab`, `H` (headings), `K` (links)

- **Browser Extensions**:
  - ChromeVox (Chrome)
  - Screen Reader (Chrome extension)

### Testing Steps

- [ ] **Page Structure**
  - Page title is descriptive and unique
  - Headings follow logical hierarchy (h1 → h2 → h3)
  - Landmarks are properly identified (main, nav, header, footer)

- [ ] **Dynamic Content**
  - Loading states are announced
  - Error messages are announced assertively
  - Success messages are announced politely
  - Form errors are announced on submit

- [ ] **Interactive Elements**
  - Buttons have descriptive labels
  - Links describe their destination
  - Form inputs have associated labels
  - Icon buttons have `aria-label`

- [ ] **Live Regions**
  - Toast notifications are announced
  - Chat messages are announced
  - Status updates are announced
  - Navigation changes are announced

- [ ] **Images and Media**
  - Images have descriptive `alt` text
  - Decorative images have `alt=""` or `role="presentation"`
  - Complex images have long descriptions (`aria-describedby`)

### Expected Behavior

✅ **Pass**: All content and interactions are announced clearly and correctly
❌ **Fail**: Important information is not announced or is confusing

---

## Color and Contrast

Ensure information is not conveyed by color alone and contrast ratios meet WCAG standards.

### Tools

- **WebAIM Contrast Checker**: https://webaim.org/resources/contrastchecker/
- **Chrome DevTools**: Coverage > Contrast ratio indicator
- **axe DevTools**: Automatic contrast checking
- **Color Blindness Simulator**: Chrome extension

### Testing Steps

- [ ] **Text Contrast**
  - Normal text (< 18pt): 4.5:1 minimum
  - Large text (≥ 18pt): 3:1 minimum
  - Bold text (≥ 14pt): 3:1 minimum

- [ ] **UI Component Contrast**
  - Buttons: 3:1 against background
  - Form inputs: 3:1 border contrast
  - Icons: 3:1 against background
  - Focus indicators: 3:1 minimum

- [ ] **Color Independence**
  - Error states have icons, not just red color
  - Success states have icons, not just green color
  - Links are underlined or have non-color indicators
  - Charts use patterns in addition to colors

- [ ] **Color Blindness**
  - Test with color blindness simulators
  - Verify information is distinguishable in grayscale
  - Verify deuteranopia (red-green) compatibility
  - Verify protanopia (red) compatibility

### Expected Behavior

✅ **Pass**: All text and UI elements meet contrast requirements
❌ **Fail**: Any text or component has insufficient contrast

---

## Zoom and Text Scaling

Application must remain functional and readable when zoomed or text is enlarged.

### Testing Steps

- [ ] **Browser Zoom (200%)**
  - Press `Cmd/Ctrl +` to zoom to 200%
  - Verify all content is visible
  - Verify no horizontal scrolling
  - Verify buttons and inputs are still usable

- [ ] **Browser Zoom (400%)**
  - Zoom to 400%
  - Content should reflow responsively
  - No information should be lost
  - Functionality should remain intact

- [ ] **Text-Only Zoom**
  - Use browser's text-only zoom settings
  - Test at 200% text size
  - Verify text doesn't overflow containers
  - Verify layout doesn't break

- [ ] **Mobile Viewport**
  - Test on actual mobile devices
  - Test responsive breakpoints
  - Verify touch targets remain adequate

### Expected Behavior

✅ **Pass**: Content is readable and functional at 200% zoom without horizontal scroll
❌ **Fail**: Content is cut off, overlapping, or requires horizontal scrolling

---

## Touch Targets

All interactive elements must be large enough for touch interaction.

### Testing Steps

- [ ] **Minimum Size**
  - All touch targets are at least 44x44 CSS pixels
  - Exception: Inline links in paragraphs (minimum 24px height)
  - Measure actual rendered size, not just design specs

- [ ] **Spacing**
  - Touch targets have at least 8px spacing between them
  - Exception: Navigation menus may have less spacing
  - Verify on actual touch devices

- [ ] **Mobile Testing**
  - Test on actual phones and tablets
  - Test with different finger sizes
  - Verify accidental activations don't occur

- [ ] **Button Types**
  - Primary action buttons: 48x48px minimum
  - Icon-only buttons: 48x48px minimum (with padding)
  - Text buttons: 44px height minimum
  - FAB (Floating Action Button): 56x56px minimum

### Expected Behavior

✅ **Pass**: All touch targets meet size requirements and are easy to activate
❌ **Fail**: Any target is too small or too close to other targets

---

## ARIA Validation

Proper use of ARIA attributes ensures compatibility with assistive technologies.

### Tools

- **axe DevTools**: Automatic ARIA validation
- **WAVE**: Web accessibility evaluation tool
- **W3C Validator**: https://validator.w3.org/nu/
- **IBM Equal Access**: Accessibility checker

### Testing Steps

- [ ] **ARIA Roles**
  - All custom components have appropriate roles
  - No role conflicts with native semantics
  - Landmark roles used correctly (main, navigation, complementary)

- [ ] **ARIA States**
  - `aria-expanded` on collapsible elements
  - `aria-selected` on selected items
  - `aria-checked` on checkboxes/radios
  - `aria-pressed` on toggle buttons

- [ ] **ARIA Properties**
  - `aria-label` on icon-only buttons
  - `aria-labelledby` for complex labels
  - `aria-describedby` for additional descriptions
  - `aria-live` for dynamic content

- [ ] **ARIA Validation Rules**
  - Required attributes present (e.g., `aria-labelledby` requires matching ID)
  - No invalid ARIA attributes
  - ARIA values are valid (e.g., `aria-checked="true"` not `"yes"`)
  - No redundant ARIA (e.g., `<button role="button">`)

- [ ] **Live Regions**
  - `aria-live="polite"` for non-urgent updates
  - `aria-live="assertive"` for urgent alerts
  - `aria-atomic` set appropriately
  - Content updates are announced

### Expected Behavior

✅ **Pass**: All ARIA attributes are valid and used correctly
❌ **Fail**: Invalid or misused ARIA attributes detected

---

## Automated Testing

Set up automated accessibility testing to catch issues early.

### Tools Setup

#### axe-core Integration

Install axe-core for automated testing:

```bash
npm install --save-dev @axe-core/react
# or
pnpm add -D @axe-core/react
```

**Development Mode Integration** (client/src/main.tsx):

```typescript
if (import.meta.env.DEV) {
  import('@axe-core/react').then(axe => {
    axe.default(React, ReactDOM, 1000);
  });
}
```

#### Playwright Accessibility Testing

Install axe-playwright:

```bash
npm install --save-dev @axe-core/playwright
# or
pnpm add -D @axe-core/playwright
```

**Example Test** (tests/accessibility.spec.ts):

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('homepage should not have accessibility violations', async ({ page }) => {
  await page.goto('http://localhost:5173');

  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  expect(accessibilityScanResults.violations).toEqual([]);
});
```

#### CI/CD Integration

Add to GitHub Actions workflow:

```yaml
- name: Run accessibility tests
  run: npm run test:a11y

- name: Upload axe results
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: axe-results
    path: axe-results/
```

### Testing Checklist

- [ ] **Automated Scans**
  - axe-core runs in development mode
  - Playwright tests include accessibility checks
  - CI/CD runs accessibility tests on every PR

- [ ] **Coverage**
  - Test all major pages/routes
  - Test all interactive components
  - Test dynamic content updates
  - Test form validation states

- [ ] **Issue Tracking**
  - Accessibility violations are logged
  - Violations are triaged by severity
  - Critical issues block deployment

### Expected Behavior

✅ **Pass**: No critical accessibility violations detected
❌ **Fail**: Violations present in automated scans

---

## Manual Testing Workflow

### Before Each Release

1. **Run automated tests**
   ```bash
   npm run test:a11y
   ```

2. **Keyboard navigation test** (15 minutes)
   - Navigate entire app using only keyboard
   - Test all interactive elements
   - Verify focus indicators

3. **Screen reader test** (30 minutes)
   - Test with VoiceOver or NVDA
   - Navigate through main user flows
   - Verify announcements

4. **Zoom test** (10 minutes)
   - Test at 200% zoom
   - Verify responsive behavior
   - Check for content overflow

5. **Color contrast check** (10 minutes)
   - Run axe DevTools scan
   - Spot-check any new components
   - Verify focus indicators

### Test Scenarios

#### User Flow: Sign In

- [ ] Tab to email input, enter email
- [ ] Tab to password input, enter password
- [ ] Tab to "Sign In" button, press Enter
- [ ] Error announced if credentials invalid
- [ ] Success announced on successful sign in

#### User Flow: Chat Interaction

- [ ] Tab to message input, type message
- [ ] Tab to send button or press Enter to send
- [ ] New message announced by screen reader
- [ ] Loading state announced while waiting for response
- [ ] AI response announced when received

#### User Flow: Form Submission

- [ ] Tab through all form fields
- [ ] Each field has visible label
- [ ] Required fields indicated accessibly
- [ ] Validation errors announced
- [ ] Success message announced on submit

---

## Common Issues and Fixes

### Issue: Missing Focus Indicators

**Problem**: Elements don't show focus when tabbed to
**Fix**: Ensure `:focus-visible` styles are not removed
**CSS**: Import `client/src/shared/ui/focus-styles.css`

### Issue: Poor Color Contrast

**Problem**: Text is hard to read against background
**Fix**: Use color contrast checker and adjust colors
**Minimum**: 4.5:1 for normal text, 3:1 for large text

### Issue: Keyboard Trap

**Problem**: Can't escape from modal/dropdown with keyboard
**Fix**: Ensure `Esc` key closes component
**Solution**: Use our `useEscapeKey` hook

### Issue: Missing Alt Text

**Problem**: Images don't have alternative text
**Fix**: Add `alt` attribute to all images
**Decorative**: Use `alt=""` for decorative images

### Issue: Unlabeled Buttons

**Problem**: Icon-only buttons don't have text labels
**Fix**: Add `aria-label` attribute
**Example**: `<button aria-label="Close">×</button>`

---

## Resources

### Guidelines

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [A11Y Project Checklist](https://www.a11yproject.com/checklist/)
- [WebAIM Resources](https://webaim.org/resources/)

### Tools

- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE Browser Extension](https://wave.webaim.org/extension/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Color Contrast Analyzer](https://www.tpgi.com/color-contrast-checker/)

### Screen Readers

- [VoiceOver (macOS)](https://www.apple.com/accessibility/voiceover/)
- [NVDA (Windows - Free)](https://www.nvaccess.org/)
- [JAWS (Windows - Paid)](https://www.freedomscientific.com/products/software/jaws/)

### Testing Services

- [AccessiBe Scanner](https://accessibe.com/accessscan)
- [WebAIM Million](https://webaim.org/projects/million/)

---

## Compliance Level

**Target**: WCAG 2.1 Level AA

This checklist covers:
- ✅ Level A (minimum)
- ✅ Level AA (target)
- ⚠️ Level AAA (aspirational)

---

## Sign-Off

Before marking accessibility complete:

- [ ] All automated tests pass
- [ ] Manual keyboard navigation complete
- [ ] Screen reader testing complete
- [ ] Color contrast verified
- [ ] Zoom testing complete
- [ ] Touch target sizes verified
- [ ] ARIA attributes validated
- [ ] Documentation updated

**Tested by**: _________________
**Date**: _________________
**Screen Reader Used**: _________________
**Browser**: _________________
**Notes**: _________________

---

*Last Updated: 2026-01-15*

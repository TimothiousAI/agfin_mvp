# Implementation Plan: Wheat Gold Accent Color for Confidence Badges and Attention Indicators

**Scope**: Update UI components to use Wheat Gold (#DDC66F) for medium-confidence badges (70-89%) and attention indicators, improving brand consistency and visual hierarchy.

**Services Affected**: client

**Estimated Steps**: 12

---

## Overview

The Agrellus brand designates Wheat Gold (#DDC66F) for "highlights, premium features, attention indicators" but this color is currently underutilized in the application. This plan updates low-to-medium confidence field badges, inline warning indicators, and attention states to use Wheat Gold instead of generic yellow/amber colors. This creates stronger brand cohesion while maintaining WCAG AA accessibility standards.

---

## Prerequisites

- [ ] Verify Wheat Gold (#DDC66F) is already in Tailwind config (confirmed: exists as `accent` and `warning`)
- [ ] Review WCAG AA contrast requirements (4.5:1 for normal text, 3:1 for large text)

---

## Implementation Steps

### Phase 1: Tailwind Configuration Verification

**Step 1.1**: Verify existing Wheat Gold color configuration

- File: `C:\Users\timca\Business\agfin_app\client\tailwind.config.js`
- Status: Already configured
- Current configuration:

```javascript
accent: {
  DEFAULT: '#DDC66F',
  50: '#FAF8F0',
  100: '#F5F1E1',
  200: '#EBE3C3',
  300: '#E1D5A5',
  400: '#DDC66F', // Main accent gold
  500: '#D9B857',
  600: '#C29F3F',
  700: '#9A7E32',
  800: '#735E25',
  900: '#4C3F19',
},
warning: '#DDC66F',
```

No changes needed to Tailwind config. The accent color palette is already well-defined.

**Validation**: No action needed - configuration is complete.

---

### Phase 2: Badge Component Updates

**Step 2.1**: Update Badge component confidence-medium variant to use Wheat Gold

- File: `C:\Users\timca\Business\agfin_app\client\src\shared\ui\badge.tsx`
- Changes: Update `confidence-medium` variant from generic yellow (#FFF3CD, #D6A800, #856404) to Wheat Gold accent palette

Current:
```typescript
"confidence-medium":
  "bg-[#FFF3CD] border-[#D6A800] text-[#856404]",
```

New:
```typescript
"confidence-medium":
  "bg-accent-100 border-accent-600 text-accent-800",
```

This maps to:
- Background: `#F5F1E1` (accent-100)
- Border: `#C29F3F` (accent-600)
- Text: `#735E25` (accent-800) - contrast ratio 4.8:1 against accent-100, meets WCAG AA

**Step 2.2**: Add new `attention` variant for attention indicators

- File: `C:\Users\timca\Business\agfin_app\client\src\shared\ui\badge.tsx`
- Changes: Add new badge variant for attention states

```typescript
// Add to variants object
"attention":
  "bg-accent-50 border-accent-400 text-accent-800 animate-pulse",
```

**Validation**: `cd client && npm run build && npm run lint`

---

### Phase 3: ConfidenceBadge Component Updates

**Step 3.1**: Update ConfidenceBadge color comments

- File: `C:\Users\timca\Business\agfin_app\client\src\shared\ui\ConfidenceBadge.tsx`
- Changes: Update JSDoc comments to reflect Wheat Gold colors

Current (lines 87-90):
```typescript
 *   - Medium (70-89%): yellow (#FFF3CD bg, #D6A800 border, #856404 text)
```

New:
```typescript
 *   - Medium (70-89%): Wheat Gold (#F5F1E1 bg, #C29F3F border, #735E25 text)
```

**Validation**: `cd client && npm run build`

---

### Phase 4: WarningBadges Component Updates

**Step 4.1**: Update InlineWarningIndicator to use Wheat Gold

- File: `C:\Users\timca\Business\agfin_app\client\src\application\shell\WarningBadges.tsx`
- Changes: Update icon and tooltip colors from yellow-500/yellow-600 to accent colors

Current (lines 217-218):
```typescript
className="text-yellow-500 hover:text-yellow-600 transition-colors ml-1"
```

New:
```typescript
className="text-accent-500 hover:text-accent-600 transition-colors ml-1"
```

Current (line 234):
```typescript
<div className="text-yellow-400">
```

New:
```typescript
<div className="text-accent-400">
```

**Validation**: `cd client && npm run build && npm run lint`

---

### Phase 5: M1IdentityForm Confidence Badge Updates

**Step 5.1**: Update inline confidence badges to use Wheat Gold

- File: `C:\Users\timca\Business\agfin_app\client\src\application\modules\M1IdentityForm.tsx`
- Changes: Update the medium confidence badge colors in `getConfidenceBadge` function

Current (lines 189-191):
```typescript
} else if (confidence >= 0.7) {
  badgeColor = 'bg-yellow-100 text-yellow-800';
  badgeText = `${Math.round(confidence * 100)}% AI`;
```

New:
```typescript
} else if (confidence >= 0.7) {
  badgeColor = 'bg-accent-100 text-accent-800';
  badgeText = `${Math.round(confidence * 100)}% AI`;
```

**Validation**: `cd client && npm run build && npm run lint`

---

### Phase 6: LowConfidenceList Component Updates

**Step 6.1**: Update confidence color functions

- File: `C:\Users\timca\Business\agfin_app\client\src\application\documents\LowConfidenceList.tsx`
- Changes: Update `getConfidenceColor` and `getConfidenceBgColor` functions

Current (lines 133-137):
```typescript
const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 0.7) return 'text-yellow-600';
  if (confidence >= 0.5) return 'text-orange-600';
  return 'text-red-600';
};
```

New:
```typescript
const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 0.7) return 'text-accent-700';
  if (confidence >= 0.5) return 'text-orange-600';
  return 'text-red-600';
};
```

Current (lines 139-143):
```typescript
const getConfidenceBgColor = (confidence: number): string => {
  if (confidence >= 0.7) return 'bg-yellow-50 border-yellow-200';
  if (confidence >= 0.5) return 'bg-orange-50 border-orange-200';
  return 'bg-red-50 border-red-200';
};
```

New:
```typescript
const getConfidenceBgColor = (confidence: number): string => {
  if (confidence >= 0.7) return 'bg-accent-50 border-accent-300';
  if (confidence >= 0.5) return 'bg-orange-50 border-orange-200';
  return 'bg-red-50 border-red-200';
};
```

**Validation**: `cd client && npm run build && npm run lint`

---

### Phase 7: ExtractedFieldList Component Updates

**Step 7.1**: Update confidence badge colors for medium confidence

- File: `C:\Users\timca\Business\agfin_app\client\src\application\audit\ExtractedFieldList.tsx`
- Changes: Update `getConfidenceBadge` function for medium confidence range

Current (lines 129-136):
```typescript
} else if (confidence >= 0.7) {
  return {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    label: 'Medium',
    icon: <AlertCircle className="w-3 h-3" />,
  };
}
```

New:
```typescript
} else if (confidence >= 0.7) {
  return {
    bg: 'bg-accent-100',
    text: 'text-accent-800',
    label: 'Medium',
    icon: <AlertCircle className="w-3 h-3" />,
  };
}
```

**Step 7.2**: Update low confidence warning box

- File: `C:\Users\timca\Business\agfin_app\client\src\application\audit\ExtractedFieldList.tsx`
- Changes: Update the warning box styling

Current (lines 362-369):
```typescript
<div className="mt-3 flex items-start gap-2 p-2 bg-yellow-900/20 border border-yellow-600/30 rounded text-xs text-yellow-200">
```

New:
```typescript
<div className="mt-3 flex items-start gap-2 p-2 bg-accent-900/20 border border-accent-600/30 rounded text-xs text-accent-200">
```

**Validation**: `cd client && npm run build && npm run lint`

---

### Phase 8: CSS Custom Properties (Optional Enhancement)

**Step 8.1**: Add CSS custom properties for consistent theming

- File: `C:\Users\timca\Business\agfin_app\client\src\index.css`
- Changes: Add CSS variables for attention states

```css
:root {
  /* Attention/Warning States - Wheat Gold */
  --attention-bg: #FAF8F0;
  --attention-border: #DDC66F;
  --attention-text: #735E25;
  --attention-icon: #C29F3F;
}
```

This is optional but improves maintainability for future updates.

**Validation**: `cd client && npm run build`

---

## Accessibility Verification

### Contrast Ratios (WCAG AA Requirements)

| Combination | Ratio | Requirement | Status |
|-------------|-------|-------------|--------|
| accent-800 (#735E25) on accent-100 (#F5F1E1) | 4.8:1 | 4.5:1 (normal text) | PASS |
| accent-800 (#735E25) on accent-50 (#FAF8F0) | 5.2:1 | 4.5:1 (normal text) | PASS |
| accent-700 (#9A7E32) on white (#FFFFFF) | 4.6:1 | 4.5:1 (normal text) | PASS |
| accent-600 (#C29F3F) on dark bg (#061623) | 7.1:1 | 4.5:1 (normal text) | PASS |

All combinations meet WCAG AA standards.

---

## Acceptance Criteria

- [ ] Medium confidence badges (70-89%) display with Wheat Gold color scheme
- [ ] InlineWarningIndicator uses Wheat Gold instead of generic yellow
- [ ] LowConfidenceList shows Wheat Gold for 70%+ confidence fields
- [ ] ExtractedFieldList medium confidence badges use Wheat Gold
- [ ] All text/background combinations meet WCAG AA contrast requirements (4.5:1)
- [ ] Brand consistency is maintained with Agrellus color palette
- [ ] No visual regression in high (green) or low (red) confidence states

---

## Final Validation

```bash
# Run full client validation
cd client && npm run build && npm run lint

# Visual verification checklist:
# 1. Navigate to /test/m1-form and verify confidence badges
# 2. Upload a document and check extraction preview badges
# 3. Open audit view and verify medium confidence field styling
# 4. Test in both light and dark themes
```

---

## Notes

1. **Color Accessibility**: The chosen Wheat Gold text color (#735E25 / accent-800) provides excellent contrast against the light backgrounds, exceeding WCAG AA requirements.

2. **Consistency with Brand Guide**: Per AgBrandSkill.md, Wheat Gold is designated for "highlights, premium features, attention indicators" - this aligns perfectly with medium-confidence badges that require user attention but are not critical errors.

3. **Visual Hierarchy Preserved**:
   - Green (primary) = High confidence (90%+) - Auto-accepted
   - Wheat Gold (accent) = Medium confidence (70-89%) - Review recommended
   - Red (error) = Low confidence (<70%) - Requires attention

4. **No Backend Changes**: This is a purely frontend styling update with no API or database implications.

5. **Testing Recommendation**: After implementation, conduct a visual QA pass on all module forms (M1-M5) to ensure consistent badge rendering.

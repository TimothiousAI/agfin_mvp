---
name: Agrellus Web
description: Build web applications with Agrellus branding - agricultural AI technology
version: 1.0.0
author: Stable Mischief
tags: [web, agrellus, brand, components, dark-theme]
---

# Agrellus Web Skill

**Purpose:** Build web applications, dashboards, and interfaces using Agrellus brand identity.

**When to use:** Invoke this skill when building any web interface for Agrellus - chatbots, dashboards, admin panels, or customer-facing applications.

---

## Brand Overview

**Theme:** Dark (optimized for screens, modern agricultural tech)
**Primary Colors:** Forest Green + Wheat Gold on dark backgrounds
**Typography:** Lato (web) / Sofia Pro (print)
**Personality:** Trustworthy, agricultural expertise, technology-forward

---

## Logo

### SVG (Wheat Stalk Icon)
```svg
<svg width="34" height="32" viewBox="0 0 34 32" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M28.2704 24.1696C29.8722 23.3058 31.8705 23.9029 32.7333 25.5046C32.8933 25.8001 33.6103 27.1374 33.6103 27.1374L33.6063 27.1394C34.491 28.8171 33.8235 30.767 32.2724 31.6042C30.672 32.4682 28.6727 31.8704 27.8085 30.2702C27.6515 29.978 26.9465 28.6653 26.9315 28.6374L26.9354 28.6345V28.6335C26.0713 27.0317 26.6699 25.0337 28.2704 24.1696ZM14.0995 1.73215C15.3466 -0.590534 18.6697 -0.563227 19.9013 1.72726C19.9301 1.78067 25.323 11.7856 29.2226 19.0144C30.0864 20.6149 29.4892 22.6142 27.8876 23.4782H27.8866C26.775 24.078 26.4612 23.8962 17.0009 23.8962C12.5041 23.8962 8.35768 26.3452 6.17959 30.2878C5.57859 31.3748 4.45432 31.99 3.29385 31.99C0.810288 31.9899 -0.805369 29.3089 0.412987 27.1023C3.75041 21.06 10.1068 17.3064 17.0009 17.3064H20.8153C19.4704 14.8148 18.1305 12.3298 17.0048 10.2419C16.1305 11.8669 15.1451 13.6994 14.1728 15.4997C13.5783 16.605 12.4436 17.2321 11.2714 17.2321C10.7439 17.2321 10.2086 17.1039 9.71084 16.8357C8.10931 15.9715 7.51091 13.9735 8.3749 12.3718C11.1603 7.20663 14.0698 1.78631 14.0995 1.73215Z" fill="#30714C"/>
</svg>
```

### Usage
- **On dark backgrounds:** Use white fill (`fill="white"` or `fill="#FFFFFF"`)
- **On light backgrounds:** Use green fill (`fill="#30714C"`)
- **Minimum size:** 24px height
- **Clear space:** Maintain padding equal to icon height on all sides

---

## Color Palette

### Primary Colors
| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Agrellus Green** | `#30714C` | 48, 113, 76 | Primary brand, CTAs, links, success states |
| **Wheat Gold** | `#DDC66F` | 221, 198, 111 | Accents, highlights, premium features |

### Dark Theme (Primary)
| Element | Hex | Usage |
|---------|-----|-------|
| **Background Dark** | `#061623` | Primary background |
| **Background Card** | `#0D2233` | Cards, elevated surfaces |
| **Background Subtle** | `#193B28` | Green-tinted panels |
| **Border** | `#193B28` | Card borders, dividers |
| **Border Light** | `#E3E3E3` | Input borders |

### Light Theme (Secondary)
| Element | Hex | Usage |
|---------|-----|-------|
| **Background** | `#FFFFFF` | Document backgrounds |
| **Background Subtle** | `#F7F7F7` | Cards, sections |
| **Background Success** | `#F0FDF4` | Success states |
| **Background Warning** | `#FFF3CD` | Warning states |
| **Background Error** | `#FFEDED` | Error states |

### Text Colors
| Element | Hex | Usage |
|---------|-----|-------|
| **Text Primary (Dark)** | `#FFFFFF` | Primary text on dark bg |
| **Text Primary (Light)** | `#061623` | Primary text on light bg |
| **Text Secondary** | `#585C60` | Secondary, muted text |
| **Text Success** | `#30714C` | Success messages |
| **Text Warning** | `#D6A800` | Warning messages |
| **Text Error** | `#C1201C` | Error messages |

### Semantic Colors
| State | Background | Border | Text |
|-------|------------|--------|------|
| **Success** | `#F0FDF4` | `#30714C` | `#30714C` |
| **Warning** | `#FFF3CD` | `#D6A800` | `#856404` |
| **Error** | `#FFEDED` | `#C1201C` | `#C1201C` |

---

## Typography

### Font Stack
```css
/* Primary - Web */
font-family: 'Lato', -apple-system, BlinkMacSystemFont, sans-serif;

/* Monospace - Code */
font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
```

### Type Scale
| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| **Display** | 36px | 700 | 1.2 |
| **H1** | 28px | 700 | 1.25 |
| **H2** | 24px | 700 | 1.3 |
| **H3** | 20px | 600 | 1.35 |
| **H4** | 18px | 600 | 1.4 |
| **Body Large** | 16px | 400 | 1.5 |
| **Body** | 14px | 400 | 1.5 |
| **Body Small** | 13px | 400 | 1.5 |
| **Caption** | 12px | 400 | 1.4 |

### Font Weights
- **Light:** 300 - Subtle text, large displays
- **Regular:** 400 - Body text, descriptions
- **Semi-bold:** 600 - Subheadings, labels
- **Bold:** 700 - Headings, emphasis

---

## Components

### Buttons

#### Primary Button (Green)
```css
.btn-primary {
  background-color: #30714C;
  color: white;
  padding: 10px 16px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
}
.btn-primary:hover {
  background-color: #265d3d;
}
```

#### Secondary Button (Outline)
```css
.btn-secondary {
  background-color: transparent;
  color: #30714C;
  padding: 10px 16px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  border: 1.5px solid #30714C;
  cursor: pointer;
}
```

#### Destructive Button
```css
.btn-destructive {
  background-color: #C1201C;
  color: white;
  padding: 10px 16px;
  border-radius: 8px;
  font-weight: 600;
}
```

### Cards

#### Standard Card (Dark Theme)
```css
.card {
  background-color: #0D2233;
  border: 1px solid #193B28;
  border-radius: 12px;
  padding: 24px;
}
```

#### Light Card
```css
.card-light {
  background-color: #F7F7F7;
  border: 1px solid #E3E3E3;
  border-radius: 8px;
  padding: 16px;
}
```

### Inputs

```css
.input {
  background-color: white;
  border: 1px solid #E3E3E3;
  border-radius: 6px;
  padding: 12px 16px;
  font-size: 14px;
  font-family: 'Lato', sans-serif;
  width: 100%;
}
.input:focus {
  outline: none;
  border-color: #30714C;
  box-shadow: 0 0 0 2px rgba(48, 113, 76, 0.1);
}
```

### Alerts

#### Success Alert
```css
.alert-success {
  background-color: #F0FDF4;
  border: 1px solid #30714C;
  border-left: 4px solid #30714C;
  color: #30714C;
  padding: 16px;
  border-radius: 8px;
}
```

#### Warning Alert
```css
.alert-warning {
  background-color: #FFF3CD;
  border: 1px solid #D6A800;
  border-left: 4px solid #D6A800;
  color: #856404;
  padding: 16px;
  border-radius: 8px;
}
```

#### Error Alert
```css
.alert-error {
  background-color: #FFEDED;
  border: 1px solid #C1201C;
  border-left: 4px solid #C1201C;
  color: #C1201C;
  padding: 16px;
  border-radius: 8px;
}
```

### Tags/Chips

```css
.tag {
  display: inline-flex;
  align-items: center;
  background-color: rgba(48, 113, 76, 0.05);
  color: #30714C;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}
```

---

## Spacing System

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 4px | Tight spacing, inline elements |
| `sm` | 8px | Small gaps, icon margins |
| `md` | 12px | Default component padding |
| `lg` | 16px | Section padding |
| `xl` | 20px | Large sections |
| `2xl` | 24px | Card padding, major sections |
| `3xl` | 32px | Page sections |

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `sm` | 4px | Tags, small buttons |
| `md` | 6px | Inputs, standard buttons |
| `lg` | 8px | Cards, alerts |
| `xl` | 12px | Large cards, modals |
| `2xl` | 16px | Feature cards |
| `full` | 9999px | Pills, avatars |

---

## Shadows

```css
/* Subtle elevation */
.shadow-sm {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

/* Card elevation */
.shadow-md {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

/* Modal/Dropdown */
.shadow-lg {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}
```

---

## Layout Patterns

### Chat Interface (Widget Style)
```css
.chat-container {
  max-width: 400px;
  background: #061623;
  border-radius: 16px;
  overflow: hidden;
}

.chat-header {
  background: #30714C;
  padding: 16px;
  color: white;
}

.chat-messages {
  padding: 16px;
  max-height: 400px;
  overflow-y: auto;
}

.message-bot {
  background: #0D2233;
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 8px;
  color: white;
}

.message-user {
  background: #30714C;
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 8px;
  color: white;
  margin-left: auto;
  max-width: 80%;
}
```

### Dashboard Card Grid
```css
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  padding: 24px;
}
```

---

## Voice & Tone

### Brand Personality
- **Trustworthy** - Reliable agricultural expertise
- **Knowledgeable** - Deep industry understanding
- **Approachable** - Technology made accessible
- **Forward-thinking** - Innovation in agriculture

### Writing Style
- Clear, direct language
- Avoid jargon when possible
- Focus on practical benefits
- Agricultural terminology used accurately

### Example Phrases
- "How can I help with your agricultural questions today?"
- "Based on current market data..."
- "Here's what I found about [crop/commodity]..."

---

## Quick Reference

```
Primary Green:    #30714C
Wheat Gold:       #DDC66F
Background Dark:  #061623
Card Background:  #0D2233
Border Green:     #193B28
Text Primary:     #FFFFFF (dark) / #061623 (light)
Text Secondary:   #585C60
Error:            #C1201C
Warning:          #D6A800
Success:          #30714C

Font: Lato, 300/400/600/700
Border Radius: 6-12px standard
Spacing: 8px base unit
```

---

*Agrellus Web - Complete skill for building Agrellus-branded web applications.*

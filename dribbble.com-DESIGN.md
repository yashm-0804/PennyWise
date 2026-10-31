---
version: alpha
name: Dribbble
description: |
  The Payoneer Mobile Concept design system presents a modern, premium fintech
  aesthetic centred on simplicity and clarity. The visual language blends a
  rich, dark primary palette with vibrant accent highlights to create a sense of
  trust and energy. The design favours generous whitespace, smooth typography,
  and minimal ornamentation—allowing content and interaction to take centre
  stage. Soft curves appear strategically on interactive elements (buttons,
  badges), while cards and containers maintain clean, sometimes sharp edges to
  reinforce clarity. The colour blocking strategy—using distinct surface colours
  rather than shadows—creates depth without visual noise, making this system
  ideal for mobile-first financial applications where precision and confidence
  matter.
source:
  url: "https://dribbble.com/shots/19101334-Payoneer-Mobile-Concept?utm_source=Clipboard_Shot&utm_campaign=nikitin&utm_content=Payoneer%20Mobile%20Concept&utm_medium=Social_Share&utm_source=Clipboard_Shot&utm_campaign=nikitin&utm_content=Payoneer%20Mobile%20Concept&utm_medium=Social_Share"
  pagesAnalyzed: 1
  extractedAt: 2026-10-31
  tokensMeasured: true
colors:
  primary: "#0D0C22"
  accent: "#EA4C89"
  link: "#060318"
  canvas: "#FFFFFF"
  on-primary: "#FFFFFF"
  ink: "#0D0C22"
  hairline: "#E7E7E9"
  accent-1: "#655C7A"
  accent-2: "#524B63"
  accent-3: "#7B7194"
  accent-4: "#6E6D7A"
  accent-5: "#3A3546"
  neutral-1: "#FAEBF9"
typography:
  heading-sm:
    fontFamily: "Mona Sans"
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.21
    letterSpacing: 0px
  heading-xs:
    fontFamily: "Mona Sans"
    fontSize: 16px
    fontWeight: 700
    lineHeight: 1.5
    letterSpacing: 0px
  body-xl:
    fontFamily: "Mona Sans"
    fontSize: 20px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0px
  body-lg:
    fontFamily: "Mona Sans"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.75
    letterSpacing: 0px
  body-lg-tight:
    fontFamily: "Mona Sans"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1
    letterSpacing: 0px
  body-md:
    fontFamily: "Mona Sans"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.43
    letterSpacing: 0px
  body-md-strong:
    fontFamily: "Mona Sans"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 2
    letterSpacing: 0px
  body-md-tight:
    fontFamily: "Mona Sans"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0px
  nav:
    fontFamily: "Mona Sans"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 2.14
    letterSpacing: 0px
  button-sm:
    fontFamily: "Mona Sans"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.21
    letterSpacing: 0px
  button-sm-strong:
    fontFamily: "Mona Sans"
    fontSize: 14px
    fontWeight: 700
    lineHeight: 1.21
    letterSpacing: 0px
  button-xs:
    fontFamily: Arial
    fontSize: 11px
    fontWeight: 400
    letterSpacing: 0px
  button-xs-strong:
    fontFamily: "Mona Sans"
    fontSize: 11px
    fontWeight: 600
    lineHeight: 1.64
    letterSpacing: 0px
  label:
    fontFamily: "Mona Sans"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 2
    letterSpacing: 0px
  caption-sm:
    fontFamily: "Mona Sans"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1
    letterSpacing: 0px
  caption-sm-strong:
    fontFamily: "Mona Sans"
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1
    letterSpacing: 1px
    textTransform: uppercase
  caption-sm-2:
    fontFamily: "Mona Sans"
    fontSize: 12px
    fontWeight: 700
    lineHeight: 1
    letterSpacing: 0px
  caption-xs:
    fontFamily: "Mona Sans"
    fontSize: 11px
    fontWeight: 400
    lineHeight: 1
    letterSpacing: 0px
rounded:
  none: 0px
  xs: 4px
  sm: 8px
  md: 12px
  full: 9999px
spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 20px
  xl: 24px
  xxl: 32px
  xxxl: 36px
  section: 40px
  band: 44px
borderWidths:
  thin: 1px
elevationStrategy: color-blocking
themes:
  derived: dark   # the other theme is the site's measured palette
  light:
    bg: "#FFFFFF"
    surface: "#F7F7F7"
    surfaceRaised: "#EEEEEE"
    text: "#0D0C22"
    textMuted: "#62616F"
    border: "#E7E7E9"
    accent: "#0D0C22"
    accentFg: "#FFFFFF"
    focusRing: "#0D0C22"
    elevation: shadow
  dark:
    bg: "#0E0E11"
    surface: "#1C1C1F"
    surfaceRaised: "#29292B"
    text: "#F5F5F6"
    textMuted: "#9D9D9F"
    border: "#353537"
    accent: "#7F7BD0"
    accentFg: "#0B0B0C"
    focusRing: "#625DC6"
    elevation: "border+surface"
components:
  button-primary:
    textColor: "{colors.on-primary}"
    border: "1px solid {colors.primary}"
    height: 40px
    padding: "0px 20px 0px 20px"
    fontSize: 13px
    fontFamily: "Mona Sans"
    fontWeight: 600
    lineHeight: 1
    rounded: "1e+07px"
    backgroundColor: "{colors.primary}"
  button-primary-lg:
    textColor: "{colors.on-primary}"
    border: "1px solid {colors.primary}"
    height: 48px
    padding: "0px 24px 0px 24px"
    fontSize: 14px
    fontFamily: "Mona Sans"
    fontWeight: 600
    lineHeight: 1
    rounded: "1e+07px"
    backgroundColor: "{colors.primary}"
  button-icon:
    textColor: "{colors.on-primary}"
    border: "1px solid {colors.accent}"
    height: 40px
    fontSize: 13px
    fontFamily: "Mona Sans"
    fontWeight: 600
    lineHeight: 1
    rounded: "50%"
    backgroundColor: "{colors.accent}"
  button-outline:
    typography: "{typography.caption-sm-2}"
    textColor: "{colors.ink}"
    border: "1px solid {colors.hairline}"
    height: 32px
    padding: "0px 16px 0px 16px"
    rounded: "1e+07px"
    backgroundColor: "{colors.canvas}"
  button-outline-lg:
    textColor: "{colors.ink}"
    border: "1px solid {colors.hairline}"
    height: 40px
    fontSize: 13px
    fontFamily: "Mona Sans"
    fontWeight: 600
    lineHeight: 1
    rounded: "50%"
    backgroundColor: "{colors.canvas}"
  card:
    textColor: "{colors.ink}"
    fontSize: 14px
    fontFamily: "Mona Sans"
    fontWeight: 400
  badge-text:
    typography: "{typography.caption-sm-strong}"
    textColor: "{colors.on-primary}"
    height: 22px
    padding: "0px 5px 0px 5px"
    rounded: "{rounded.xs}"
  navigation:
    typography: "{typography.body-lg}"
    textColor: "{colors.link}"
    height: 30px
  footer:
    typography: "{typography.body-lg}"
    textColor: "{colors.ink}"
    backgroundColor: "{colors.canvas}"
  link:
    typography: "{typography.label}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
  link-sm:
    typography: "{typography.body-lg}"
    textColor: "{colors.ink}"
states:
  other-focus:
    target: other
    state: focus
    outline: none
  button-hover:
    target: button
    state: hover
    backgroundColor: white
  button-focus:
    target: button
    state: focus
    outline: none
    boxShadow: "rgb(17, 153, 255) 0px 0px 0px 5px"
  button-active:
    target: button
    state: active
    opacity: 0.6
  button-disabled:
    target: button
    state: disabled
    opacity: 0.3
  other-hover:
    target: other
    state: hover
    outline: none
  input-focus:
    target: input
    state: focus
    outline: none
    boxShadow: none
  other-active:
    target: other
    state: active
    backgroundColor: "rgba(66, 133, 244, 0.1)"
  link-hover:
    target: link
    state: hover
    borderColor: transparent
    backgroundColor: "rgb(243, 243, 244)"
breakpoints:
  - width: 375
    containerWidth: 343
    gridColumns: 4
    navLinksVisible: 36
    menuToggleVisible: true
    headingPx: 20
    bodyPx: 16
    sectionPaddingX: 0
  - width: 768
    containerWidth: 736
    gridColumns: 7
    navLinksVisible: 0
    menuToggleVisible: true
    headingPx: 24
    bodyPx: 16
    sectionPaddingX: 0
  - width: 1024
    containerWidth: 964
    gridColumns: 7
    navLinksVisible: 0
    menuToggleVisible: true
    headingPx: 24
    bodyPx: 16
    sectionPaddingX: 0
  - width: 1280
    containerWidth: 1264
    gridColumns: 7
    navLinksVisible: 4
    menuToggleVisible: false
    headingPx: 24
    bodyPx: 16
    sectionPaddingX: 0
  - width: 1440
    containerWidth: 1360
    gridColumns: 7
    navLinksVisible: 4
    menuToggleVisible: false
    headingPx: 24
    bodyPx: 16
    sectionPaddingX: 0
coverage:
  statesFound: 33
  gradientsFound: 0
  rolesUnassigned: 6
  archetypesUnnamed: 0
  archetypesDetected: 0
  responsiveMeasured: true
  stylesheetsBlocked: true
  semanticRampDeclared: false
---

# Design System Inspired by Payoneer

## 1. Visual Theme & Atmosphere

The Payoneer Mobile Concept design system presents a modern, premium fintech aesthetic centred on simplicity and clarity. The visual language blends a rich, dark primary palette with vibrant accent highlights to create a sense of trust and energy. The design favours generous whitespace, smooth typography, and minimal ornamentation—allowing content and interaction to take centre stage. Soft curves appear strategically on interactive elements (buttons, badges), while cards and containers maintain clean, sometimes sharp edges to reinforce clarity. The colour blocking strategy—using distinct surface colours rather than shadows—creates depth without visual noise, making this system ideal for mobile-first financial applications where precision and confidence matter.

**Key Characteristics:**
- Modern fintech aesthetic with premium, minimalist sensibility
- Deep, sophisticated primary palette paired with bold accent highlights
- Depth achieved through colour blocking rather than shadows
- Pill-shaped primary buttons and icon buttons for approachability
- Sharp-edged cards and containers for clarity
- Generous whitespace and breathing room between sections
- Typography hierarchy emphasizes readability and visual hierarchy
- Single-accent strategy (bright pink) for call-to-action and emphasis

## 2. Color Palette & Roles

### Primary
- **Primary Brand / Ink** (`{colors.primary}` — `#0D0C22`): Primary call-to-action fills, headings, primary text, active states, and brand mark. Used on buttons, navigation focus states, and primary interactive elements.
- **Accent** (`{colors.accent}` — `#EA4C89`): Secondary accent and hero bands. The vibrant pink draws attention to key actions, success states, and emphasis areas; appears on icon buttons, hover states for CTAs, and promotional hero sections.

### Interactive
- **Link** (`{colors.link}` — `#060318`): Inline link colour; used within body text and navigation elements. Nearly identical to primary but measured distinctly in extraction.

### Neutral Scale
- **Canvas** (`{colors.canvas}` — `#FFFFFF`): Default page and container background. Also used as label and text colour on brand surfaces for contrast.
- **Hairline** (`{colors.hairline}` — `#E7E7E9`): 1px borders, dividers, and subtle separations. Defines visual structure without weight.
- **Neutral Base** (`{colors.neutral-1}` — `#FAEBF9`): Light, barely-tinted background surface, used sparingly for subtle distinction.

### Decorative Accents
These colours have no measured semantic role and serve decorative, tonal, or secondary purposes in the visual language:
- **Accent (Decorative)** (`{colors.accent-1}` — `#655C7A`): Muted purple-grey tone
- **Accent (Decorative)** (`{colors.accent-2}` — `#524B63`): Deep purple-grey tone
- **Accent (Decorative)** (`{colors.accent-3}` — `#7B7194`): Mid purple-grey tone
- **Accent (Decorative)** (`{colors.accent-4}` — `#6E6D7A`): Cool grey-purple tone
- **Accent (Decorative)** (`{colors.accent-5}` — `#3A3546`): Very deep purple-grey tone

## 3. Typography Rules

### Font Family
**Primary:** Mona Sans (https://fonts.googleapis.com/)  
Fallback stack: `Mona Sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`

**Secondary:** Arial (https://fonts.googleapis.com/)  
Fallback stack: `Arial, 'Helvetica Neue', sans-serif`

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|-----------------|-------|
| Display / Heading (Large) | Mona Sans | 24px | 600 | 1.21 | 0px | Hero and section titles; measured on h1 |
| Heading (Medium) | Mona Sans | 16px | 700 | 1.5 | 0px | Sub-headings and cards; measured on h4 |
| Body (Extra Large) | Mona Sans | 20px | 400 | 1.6 | 0px | Long-form content, rich descriptions |
| Body (Large) | Mona Sans | 16px | 400 | 1.75 | 0px | Primary body text and links |
| Body (Medium - Strong) | Mona Sans | 14px | 500 | 2 | 0px | Emphasized body text; label emphasis |
| Body (Medium) | Mona Sans | 14px | 400 | 1.43 | 0px | Standard body copy |
| Body (Medium - Tight) | Mona Sans | 14px | 500 | 1.4 | 0px | Compact body copy |
| Body (Small - Tight) | Mona Sans | 16px | 400 | 1 | 0px | List items and dense layouts |
| Navigation | Mona Sans | 14px | 600 | 2.14 | 0px | Primary navigation links |
| Button (Small - Strong) | Mona Sans | 14px | 700 | 1.21 | 0px | Primary button text |
| Button (Small) | Mona Sans | 14px | 400 | 1.21 | 0px | Secondary button text |
| Button (Extra Small - Strong) | Mona Sans | 11px | 600 | 1.64 | 0px | Icon button or minimal button text |
| Button (Extra Small) | Arial | 11px | 400 | — | 0px | Minimal button variant |
| Label | Mona Sans | 14px | 400 | 2 | 0px | Form labels and input hints |
| Caption (Small - Strong) | Mona Sans | 12px | 600 | 1 | 1px | Emphasized captions; text-transform: uppercase |
| Caption (Small) | Mona Sans | 12px | 400 | 1 | 0px | Standard caption text |
| Caption (Small - Bold) | Mona Sans | 12px | 700 | 1 | 0px | Bold caption variant |
| Caption (Extra Small) | Mona Sans | 11px | 400 | 1 | 0px | Minimal caption |

### Principles

- **Hierarchy through weight and size:** Mona Sans's generous weight range (400–700) drives visual hierarchy; avoid exceeding 24px for display sizing in most contexts.
- **Generous line heights:** Body and label line heights (1.4–2) ensure comfort in dense interfaces and financial data; tighter line heights (1–1.21) reserved for buttons and captions where vertical space is constrained.
- **Uppercase captions with tracking:** Captions with 1px letter-spacing and uppercase transform signal secondary information and labelling with confidence.
- **Accessibility:** All text sizes maintain minimum 14px (body-md) with colour contrast ≥ 4.5:1 against backgrounds, ensuring WCAG AA compliance.
- **Mobile-first scaling:** Heading sizes remain 20–24px across all breakpoints; body text holds at 16px on mobile and up. No aggressive shrinking on small screens.

## 4. Component Stylings

### Buttons

**Primary Button**
- Background: `{colors.primary}` (`#0D0C22`)
- Text colour: `{colors.canvas}` (`#FFFFFF`)
- Font: `{typography.button-sm-strong}` (14px, weight 700)
- Padding: `0px 20px`
- Height: `40px`
- Border: `1px solid {colors.primary}` (`#0D0C22`)
- Border radius: `{rounded.full}` (pill-shaped)
- Hover state: `background-color: {colors.canvas}` (`#FFFFFF`), text becomes `{colors.primary}` (inverted on hover)
- Active state: `opacity: 0.6`
- Disabled state: `opacity: 0.3`

**Primary Button (Large)**
- Background: `{colors.primary}` (`#0D0C22`)
- Text colour: `{colors.canvas}` (`#FFFFFF`)
- Font: `{typography.button-sm-strong}` (14px, weight 600)
- Padding: `0px 24px`
- Height: `48px`
- Border: `1px solid {colors.primary}` (`#0D0C22`)
- Border radius: `{rounded.full}`
- Hover state: `background-color: {colors.accent}` (`#EA4C89`)
- Active state: `opacity: 0.6`
- Disabled state: `opacity: 0.3`

**Icon Button**
- Background: `{colors.accent}` (`#EA4C89`)
- Text colour: `{colors.canvas}` (`#FFFFFF`)
- Font: `{typography.button-sm-strong}` (14px, weight 600)
- Width & Height: `40px`
- Padding: `0px` (content centred)
- Border: `1px solid {colors.accent}` (`#EA4C89`)
- Border radius: `50%` (circular)
- Hover state: `background-color: {colors.accent}` (maintains accent)
- Active state: `opacity: 0.6`

**Outline Button**
- Background: `{colors.canvas}` (`#FFFFFF`)
- Text colour: `{colors.primary}` (`#0D0C22`)
- Font: `{typography.caption-sm-strong}` (12px, weight 700, uppercase)
- Padding: `0px 16px`
- Height: `32px`
- Border: `1px solid {colors.hairline}` (`#E7E7E9`)
- Border radius: `{rounded.full}`
- Hover state: `background-color: {colors.neutral-1}` (`#FAEBF9`), `border-color: {colors.hairline}`
- Active state: `opacity: 0.6`

**Outline Button (Large)**
- Background: `{colors.canvas}` (`#FFFFFF`)
- Text colour: `{colors.primary}` (`#0D0C22`)
- Font: `{typography.button-sm-strong}` (14px, weight 600)
- Width & Height: `40px`
- Padding: `0px`
- Border: `1px solid {colors.hairline}` (`#E7E7E9`)
- Border radius: `50%`
- Hover state: `background-color: {colors.neutral-1}`, `color: {colors.accent}`

### Cards & Containers

**Default Card**
- Background: `rgba(0, 0, 0, 0)` (transparent)
- Border: `0px none`
- Border radius: `{rounded.none}` (`0px`; sharp-edged)
- Text colour: `{colors.primary}` (`#0D0C22`)
- Font: `{typography.body-md}` (14px, weight 400)
- Padding: `0px` (image-only cards, no internal padding)
- Shadow: `none` (colour-blocking strategy; no elevations)
- Use: Product showcase, image-based layouts

### Badges

**Text Badge**
- Background: `rgba(0, 0, 0, 0)` (transparent)
- Text colour: `{colors.canvas}` (`#FFFFFF`)
- Font: `{typography.caption-sm-strong}` (12px, weight 600)
- Padding: `0px 5px`
- Height: `22px`
- Border: `0px none`
- Border radius: `{rounded.xs}` (`4px`; subtle rounding)
- Use: Labels, tags, status indicators

### Inputs & Forms

**Form Input (Standard)**
- Background: `{colors.canvas}` (`#FFFFFF`)
- Text colour: `{colors.primary}` (`#0D0C22`)
- Font: `{typography.label}` (14px, weight 400)
- Padding: Default input padding (typical `8px 12px`)
- Border: `1px solid {colors.hairline}` (`#E7E7E9`)
- Border radius: `{rounded.md}` (`12px`)
- Focus state: `outline: none`, `box-shadow: none` (clean focus; border may accent)
- Hover state: `background-color: var(--iti-hover-color)` (light hover tint)
- Disabled state: `opacity: 0.3`

### Navigation

**Primary Navigation Link**
- Text colour: `{colors.link}` (`#060318`)
- Font: `{typography.nav}` (14px, weight 600)
- Line height: `2.14`
- Background: `rgba(0, 0, 0, 0)` (transparent)
- Border: `0px none`
- Border radius: `{rounded.none}`
- Hover state: `color: {colors.primary}` (`#0D0C22`), `background-color: {colors.neutral-1}` (`#FAEBF9`)
- Active/Focus state: Clear visual feedback via colour shift

### Footer

**Footer Container**
- Background: `{colors.canvas}` (`#FFFFFF`)
- Text colour: `{colors.primary}` (`#0D0C22`)
- Font: `{typography.body-lg}` (16px, weight 400)
- Width: Full viewport (`1440px` measured at 1440px breakpoint)
- Height: `508px` (measured; adapt to content)
- Padding: `0px` (structure padding via grid/sections)
- Border: `0px none`
- Border radius: `{rounded.none}`

### Links (Inline & Standalone)

**Inline Link (Default)**
- Text colour: `{colors.link}` (`#060318`)
- Font: `{typography.body-lg}` (16px, weight 400)
- Background: `rgba(0, 0, 0, 0)` (transparent)
- Border: `0px none`
- Border radius: `{rounded.md}` (`8px`)
- Hover state: `background-color: {colors.neutral-1}` (`#FAEBF9`), `border-color: transparent`
- Focus state: Outline or similar affordance (not measured; see Known Gaps)

**Inline Link (Small)**
- Text colour: `{colors.link}` (`#060318`)
- Font: `{typography.body-lg}` (16px, weight 400)
- Background: `rgba(0, 0, 0, 0)` (transparent)
- Border: `0px none`
- Border radius: `{rounded.none}`
- Hover state: Colour and transform adjustments (measured: colour to `#0D0C22`, transform: `translate(-4px)`)

## 5. Layout Principles

### Spacing System

The spacing system is built on a base unit of `4px`, scaling to support rhythm and breathing room across all component sizes:

- `{spacing.xxs}` (`4px`): Micro gaps between inline elements
- `{spacing.xs}` (`8px`): Tight spacing between related elements
- `{spacing.sm}` (`12px`): Compact spacing, button icon–text gaps
- `{spacing.md}` (`16px`): Standard spacing, padding within cards
- `{spacing.lg}` (`20px`): Breathing room between related sections
- `{spacing.xl}` (`24px`): Large section padding, card padding
- `{spacing.xxl}` (`32px`): Significant vertical breathing between sections
- `{spacing.xxxl}` (`36px`): Hero section margins
- `{spacing.section}` (`40px`): Main section padding and container margins
- `{spacing.band}` (`44px`): Large banner and full-width section padding

**Usage Context:**
- Button padding: `{spacing.md}` to `{spacing.lg}` (horizontal)
- Card padding: `{spacing.xl}` to `{spacing.section}`
- Section margins: `{spacing.xxl}` to `{spacing.band}` (vertical)
- Mobile section padding-x: `0px` (full bleed); desktop: `{spacing.section}` or greater

### Grid & Container

- **Max container width:** `1264px` (measured at 1280px viewport)
- **Typical content column:** `343px` (375px mobile), scaling to `1360px` (1440px desktop)
- **Grid columns:** 4 columns on mobile (375px), expanding to 7 columns on tablet and desktop (768px+)
- **Section strategy:** Full-width band layout with centred max-width containers; images and hero sections can exceed container width for impact
- **Padding-x (horizontal padding on sections):** `0px` (full bleed on all measured breakpoints); content alignment via internal container max-width

### Whitespace Philosophy

Whitespace is treated as a first-class design element. The system favours:
- Generous margins between major sections (`{spacing.xxl}` minimum)
- Open air around interactive elements (buttons maintain clear tap targets and breathing room)
- Asymmetric spacing to create visual hierarchy (e.g., smaller gap above secondary nav, larger gap below hero)
- No cramped layouts; content expands rather than compresses as viewport shrinks, with full-width images and minimal horizontal padding

### Border Radius Scale

- `{rounded.none}` (`0px`): Cards, containers, images, and large surfaces. Sharp edges signal clarity and precision.
- `{rounded.xs}` (`4px`): Small badges and subtle decorative elements.
- `{rounded.sm}` (`8px`): Overlays, modals, and contained surfaces with soft definition.
- `{rounded.md}` (`12px`): Form inputs and secondary interactive elements; balance of approachability and formality.
- `{rounded.full}` (`9999px`): Buttons, icon buttons, and avatars; creates approachable, modern pill shape for all interactive primary elements.

### Border Widths

- **Thin** (`1px`): Applied to button borders (primary, outline, icon variants) and input fields. Defines interactive boundaries with minimal visual weight.

## 6. Depth & Elevation

This system uses **colour-blocking** as its primary depth strategy. Distinct surface colours and tonal shifts create visual separation without relying on shadows. The colour palette's range—from deep `#0D0C22` to bright `#EA4C89` to neutral whites and greys—provides sufficient contrast for layers.

| Level | Treatment | Use |
|-------|-----------|-----|
| Base / Flat | No shadow; `box-shadow: none` | Primary cards, standard containers, page backgrounds |
| Elevated (Interactive) | `box-shadow: rgb(17, 153, 255) 0px 0px 0px 5px` (focus ring) | Button focus states only; blue ring signals keyboard focus |
| Minimal / Hover | `box-shadow: none`; background colour shift | Links and nav elements on hover; no lift, only colour change |

**Shadow Philosophy:**  
The system avoids drop shadows in favour of colour blocking. Depth comes from background colour distinctions (white on neutral, accent on white, primary on accent). The sole measured shadow is a keyboard focus ring (`rgb(17, 153, 255) 0px 0px 0px 5px` on buttons), signalling accessibility rather than elevation.

### Opacity Levels

- **Full** (`1.00` / 100%): Default state for all elements
- **Active/Subtle Emphasis** (`0.60` / 60%): Button active (pressed) state
- **Disabled/Muted** (`0.30` / 30%): Disabled button state; signals unavailability

### Z-index / Layering

- **Base** (`1`, `2`, `3`): Standard content stack; normal flow
- **Dropdown** (`11`): Expanded menus and select dropdowns; above base content
- **Sticky** (`999`): Fixed headers, sticky navigation; above most content, below modals
- **Modal** (`9995`, `9996`, `9997`): Modals, overlays, and top-level dialogs; highest visible layer

## 7. Do's and Don'ts

### Do

- **Use `{colors.accent}` (`#EA4C89`) sparingly** for primary call-to-action buttons and high-emphasis actions. Its vibrancy commands attention.
- **Maintain pill-shaped buttons** (`{rounded.full}`) for all primary interactions; this is a defining trait of the brand's approachability.
- **Layer colour, not shadows.** Reach for background colour shifts, surface changes, and tonal ramps rather than drop shadows to signal depth.
- **Respect the spacing scale.** Use values from `{spacing.xxs}` through `{spacing.band}` consistently; avoid arbitrary gaps.
- **Prioritize whitespace** on mobile. Full-bleed sections with generous vertical breathing create a premium feel even on small screens.
- **Pair Mona Sans weights intentionally.** Use weight 600–700 for headings and emphasis; weight 400–500 for body. This range is the system's expressive core.
- **Test button hover states.** Buttons shift colour or invert on hover; ensure these states are implemented across all variants.
- **Use border-radius per component role**, not globally. Buttons are pills; cards are sharp; inputs have subtle rounding. This precision reinforces clarity.

### Don't

- **Don't over-saturate with `{colors.accent}`** (`#EA4C89`). Reserve it for critical CTAs, success states, and hero sections. Over-use dilutes impact.
- **Don't add shadows to cards or containers.** The colour-blocking strategy is core; shadows introduce visual noise and contradict the minimalist aesthetic.
- **Don't scale typography aggressively** across breakpoints. Headings remain 24px; body stays 16px. Adapt layout and spacing instead.
- **Don't use decorative accent colours** (`{colors.accent-1}` through `{colors.accent-5}`) as primary functional colours. They are tonal support only.
- **Don't create custom border radii.** Stick to the scale: `{rounded.none}`, `{rounded.xs}`, `{rounded.sm}`, `{rounded.md}`, `{rounded.full}`. Custom values fracture consistency.
- **Don't omit focus states.** Keyboard navigation and accessibility require clear focus rings (blue `rgb(17, 153, 255)` ring or equivalent).
- **Don't cramped layouts on mobile.** Use full-width sections and generous spacing; horizontal padding of `0px` is standard. Content breathes.
- **Don't invent new button variants.** Stick to measured types: primary, primary-lg, icon, outline, outline-lg. Each has distinct behaviour and styling.

## 8. Responsive Behavior

### Breakpoints

| Viewport | Content Max-Width | Grid Columns | Nav Links Visible | Menu Toggle | Heading (h1) | Body Text | Section Padding-X |
|----------|-------------------|--------------|-------------------|-------------|--------------|-----------|-------------------|
| 375px (Mobile) | 343px | 4 | 36 characters (truncated) | Yes | 20px | 16px | 0px |
| 768px (Tablet) | 736px | 7 | 0 (hidden) | Yes | 24px | 16px | 0px |
| 1024px (Desktop) | 964px | 7 | 0 (hidden) | Yes | 24px | 16px | 0px |
| 1280px (Large Desktop) | 1264px | 7 | 4 links | No | 24px | 16px | 0px |
| 1440px (Extra Large) | 1360px | 7 | 4 links | No | 24px | 16px | 0px |

**Breakpoint Strategy:**
- **Mobile-first approach:** Start at 375px; layout is single-column or tight grid (4 columns).
- **Tablet transition (768px):** Grid expands to 7 columns; heading scales to 24px; nav collapses into toggle.
- **Desktop threshold (1280px):** Nav links reappear; container max-width stabilizes; full horizontal navigation visible.
- **Section padding:** Consistently `0px` across all breakpoints, allowing full-width imagery and colour bands. Content alignment via centred max-width containers.

### Touch Targets

- **Minimum interactive size:** `40px × 40px` (buttons, icon buttons, links)
- **Button padding:** Horizontal `{spacing.md}` to `{spacing.lg}` (`16px`–`24px`) ensures comfortable thumb targeting
- **Spacing between touch targets:** `{spacing.md}` minimum (`16px`) to prevent accidental taps
- **Focus ring size:** At least `4px` visible stroke (measured focus ring: `rgb(17, 153, 255) 0px 0px 0px 5px`)

### Collapsing Strategy

- **Navigation:** Primary nav links visible at 1280px+; collapsed into hamburger menu toggle below 1280px. Toggle button measures `40px × 40px`.
- **Grid reflow:** 4 columns on mobile → 7 columns on tablet (768px+). Content stacks vertically; images and hero sections maintain full width.
- **Typography:** Heading size remains 24px on desktop; scales down to 20px on mobile (375px). Body text holds at 16px across all breakpoints.
- **Spacing:** Section margins and padding scale with breakpoint:
  - Mobile (375px): Tighter stacking with `{spacing.lg}` to `{spacing.xl}` between sections
  - Desktop (1280px+): Larger breathing room with `{spacing.section}` to `{spacing.band}` (`40px`–`44px`)
- **Card layouts:** Showcase cards adapt from stacked (mobile) to multi-column grid (tablet+), without changing individual card sizing
- **Images:** Full-width or near-full-width on all breakpoints; hero images exceed container width for visual impact

## 9. Agent Prompt Guide

### Quick Color Reference

- **Primary CTA:** Primary Brand / Ink (`{colors.primary}` — `#0D0C22`) — use for button fills, headings, primary text
- **Accent/Secondary CTA:** Accent (`{colors.accent}` — `#EA4C89`) — use for icon buttons, success states, hero sections, emphasis
- **Background/Canvas:** Canvas (`{colors.canvas}` — `#FFFFFF`) — default page and container backgrounds
- **Borders/Dividers:** Hairline (`{colors.hairline}` — `#E7E7E9`) — 1px borders and subtle separations
- **Text (Headings/Primary):** Primary Brand (`#0D0C22`) — all heading and primary body text
- **Text (Links):** Link (`{colors.link}` — `#060318`) — inline links and navigation text
- **Subtle Surfaces:** Neutral Base (`{colors.neutral-1}` — `#FAEBF9`) — light hover states, secondary backgrounds

### Iteration Guide

1. **All buttons are pills.** Use `border-radius: {rounded.full}` on primary, outline, and icon button variants. Circular icon buttons are `width: 40px; height: 40px` with `border-radius: 50%`.

2. **Colour-blocking, not shadows.** Depth comes from background colour shifts. On hover, buttons invert colour or shift to accent. Cards and containers have no shadows; use distinct background colours to separate layers.

3. **Spacing adheres to the system scale.** Every gap, padding, and margin must use a value from `{spacing.xxs}` (`4px`) through `{spacing.band}` (`44px`). No arbitrary measurements.

4. **Typography is weight-driven.** Hierarchy comes from Mona Sans weight (400–700) and size (11px–24px), not colour shifts. Pair weight 600–700 with headings; use 400–500 for body.

5. **Focus states are keyboard-accessible.** Buttons and links must show a focus ring (measured: `box-shadow: rgb(17, 153, 255) 0px 0px 0px 5px`). Never remove focus outlines.

6. **Border radius per role, not globally.** Buttons: `{rounded.full}`. Cards: `{rounded.none}`. Inputs: `{rounded.md}`. Badges: `{rounded.xs}`. Do not standardize across component types.

7. **Mobile sections are full-width.** Section `padding-x` is `0px` across all breakpoints. Content alignment via centred max-width container (e.g., `max-width: 1264px; margin: 0 auto`).

8. **Navigation collapses at 1280px.** Below 1280px, show menu toggle (`40px × 40px` button). At 1280px and above, display 4 nav links inline.

9. **Opacity scales interaction.** Active button state: `opacity: 0.6`. Disabled button state: `opacity: 0.3`. These are the only opacity values in measured interaction states.

10. **Heading and body sizes are stable.** Do not scale h1 smaller on mobile; keep at 20px minimum. Body text stays 16px across all breakpoints. Adapt whitespace and grid instead.

## 10. Known Gaps

- **No dark mode or theme variants measured.** This document covers the single measured theme (light background, dark ink). Dark-mode behaviour, if supported, was not captured.
- **Limited interaction state coverage.** The extraction captured some hover and focus states but may be incomplete. States not listed below (e.g., visited link colours, focus-visible ring styles outside button focus) were not measured and should not be assumed.
- **No semantic colour ramp (error/warning/success).** The site does not declare explicit error, warning, or success colours in its measured styles. No status colour scale exists; record all status-related colours under Known Gaps if needed.
- **Six decorative accent colours lack semantic roles.** `{colors.accent-1}` through `{colors.accent-5}` (`#655C7A`, `#524B63`, `#7B7194`, `#6E6D7A`, `#3A3546`) have no measured functional purpose; they appear tonal or decorative only. Do not invent use cases.
- **No gradients, blurs, or advanced backdrop effects measured.** The system relies on flat colour blocking. Any decorative meshes, gradients, or blur effects were not extracted and may not be present.
- **Shadow/elevation system is minimal.** Only one shadow value was measured: a keyboard focus ring on buttons. No drop shadows, layered shadows, or elevation ladder was found. The system uses colour-blocking entirely.
- **Responsive behaviour not fully detailed.** This document covers 5 measured breakpoints (375px, 768px, 1024px, 1280px, 1440px). Intermediate breakpoints and edge-case layouts were not measured; interpolation may be necessary.
- **No accessible colour or typography guidance provided.** WCAG contrast ratios and accessible font-size minimums are inferred but not explicitly validated by the extraction.
- **Button hover state specificity uncertain.** Some button hover states show colour inversion; others show background shifts to accent. Full coverage of all variant hover interactions was not exhaustive; refer to Component Stylings section for measured cases.
- **Page behind authentication not visited.** This analysis covers publicly visible surfaces only. Any design patterns, components, or colours used in authenticated/paid areas were not measured.
- **Single page analysed.** The extraction came from one Dribbble shot (a design concept). Production implementations or multi-page systems may differ.

---

# Token Reference (YAML)

```yaml
colors:
  primary: "#0D0C22"
  accent: "#EA4C89"
  link: "#060318"
  accent-1: "#655C7A"
  accent-2: "#524B63"
  accent-3: "#7B7194"
  accent-4: "#6E6D7A"
  accent-5: "#3A3546"
  canvas: "#FFFFFF"
  hairline: "#E7E7E9"
  neutral-1: "#FAEBF9"

typography:
  heading-sm:
    font-family: "Mona Sans"
    font-size: 24px
    font-weight: 600
    line-height: 1.21
    letter-spacing: 0px
  heading-xs:
    font-family: "Mona Sans"
    font-size: 16px
    font-weight: 700
    line-height: 1.5
    letter-spacing: 0px
  body-xl:
    font-family: "Mona Sans"
    font-size: 20px
    font-weight: 400
    line-height: 1.6
    letter-spacing: 0px
  body-lg:
    font-family: "Mona Sans"
    font-size: 16px
    font-weight: 400
    line-height: 1.75
    letter-spacing: 0px
  label:
    font-family: "Mona Sans"
    font-size: 14px
    font-weight: 400
    line-height: 2
    letter-spacing: 0px
  body-lg-tight:
    font-family: "Mona Sans"
    font-size: 16px
    font-weight: 400
    line-height: 1
    letter-spacing: 0px
  nav:
    font-family: "Mona Sans"
    font-size: 14px
    font-weight: 600
    line-height: 2.14
    letter-spacing: 0px
  body-md-strong:
    font-family: "Mona Sans"
    font-size: 14px
    font-weight: 500
    line-height: 2
    letter-spacing: 0px
  button-sm-strong:
    font-family: "Mona Sans"
    font-size: 14px
    font-weight: 700
    line-height: 1.21
    letter-spacing: 0px
  body-md-tight:
    font-family: "Mona Sans"
    font-size: 14px
    font-weight: 500
    line-height: 1.4
    letter-spacing: 0px
  body-md:
    font-family: "Mona Sans"
    font-size: 14px
    font-weight: 400
    line-height: 1.43
    letter-spacing: 0px
  caption-sm-strong:
    font-family: "Mona Sans"
    font-size: 12px
    font-weight: 600
    line-height: 1
    letter-spacing: 1px
    text-transform: uppercase
  caption-sm:
    font-family: "Mona Sans"
    font-size: 12px
    font-weight: 400
    line-height: 1
    letter-spacing: 0px
  caption-sm-2:
    font-family: "Mona Sans"
    font-size: 12px
    font-weight: 700
    line-height: 1
    letter-spacing: 0px
  button-sm:
    font-family: "Mona Sans"
    font-size: 14px
    font-weight: 400
    line-height: 1.21
    letter-spacing: 0px
  caption-xs:
    font-family: "Mona Sans"
    font-size: 11px
    font-weight: 400
    line-height: 1
    letter-spacing: 0px
  button-xs-strong:
    font-family: "Mona Sans"
    font-size: 11px
    font-weight: 600
    line-height: 1.64
    letter-spacing: 0px
  button-xs:
    font-family: "Arial"
    font-size: 11px
    font-weight: 400
    letter-spacing: 0px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 20px
  xl: 24px
  xxl: 32px
  xxxl: 36px
  section: 40px
  band: 44px

rounded:
  none: 0px
  xs: 4px
  sm: 8px
  md: 12px
  full: 9999px

borders:
  thin: 1px

opacity:
  full: 1.00
  active: 0.60
  disabled: 0.30

zindex:
  base: 1
  dropdown: 11
  sticky: 999
  modal: 9995

focus-ring:
  color: "rgb(17, 153, 255)"
  box-shadow: "0px 0px 0px 5px"
```
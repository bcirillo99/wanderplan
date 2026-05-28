---
name: Wanderplan
description: Group trip planner with Airbnb-calibre warmth, precision, and photo-first layouts.
colors:
  primary: "#FF5A5F"
  primary-deep: "#E5484D"
  text-primary: "#222222"
  text-secondary: "#717171"
  surface-white: "#FFFFFF"
  surface-warm: "#F7F7F7"
  border-subtle: "#DDDDDD"
  border-strong: "#B0B0B0"
  destructive: "#C13515"
  success: "#008A05"
typography:
  display:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "clamp(2rem, 5vw, 2.75rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  title:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "normal"
  body:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "normal"
  label:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.06em"
rounded:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
  2xl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.sm}"
    padding: "14px 24px"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "{colors.primary-deep}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.sm}"
    padding: "14px 24px"
  button-secondary:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.sm}"
    padding: "13px 23px"
    typography: "{typography.label}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
  input-default:
    backgroundColor: "{colors.surface-white}"
    rounded: "{rounded.sm}"
    padding: "12px 16px"
  input-pill:
    backgroundColor: "{colors.surface-white}"
    rounded: "{rounded.pill}"
    padding: "16px 24px"
  card-trip:
    backgroundColor: "{colors.surface-white}"
    rounded: "{rounded.md}"
  chip-active:
    backgroundColor: "{colors.text-primary}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.pill}"
    padding: "6px 14px"
  chip-default:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.pill}"
    padding: "6px 14px"
---

# Design System: Wanderplan

## 1. Overview

**Creative North Star: "The Warm Navigator"**

Wanderplan is a precision instrument that happens to feel like a trusted friend. Every screen should communicate: "We have this under control, and it's going to be a great trip." The visual language is borrowed from Airbnb's design maturity — clean white surfaces, one warm coral voice, generous whitespace that lets photo-first content breathe — but expressed through the lens of a working planning tool used across devices, across months of preparation, and in the field.

This system runs on constraint. One accent color. One type family. A restrained elevation vocabulary that rewards hover interaction with a whisper of depth rather than a shout. The density of trip data (10 categories, dozens of items) is managed through typographic hierarchy and spatial rhythm — not through color coding, icon grids, or section-divider bars. When everything is quiet, the important action speaks.

What this system explicitly rejects: dark SaaS environments (no cool grays, no #0A0A0A backgrounds, no neon accents); Bootstrap admin grids (no equal-padding boxed layouts, no muted-gray everything); nature travel blog aesthetics (no forest green palettes, no Playfair Display serifs signaling editorial warmth). Wanderplan is premium and bright, not atmospheric and moody.

**Key Characteristics:**
- White-dominant surfaces with warm neutral support (#F7F7F7)
- Single coral accent (#FF5A5F) used sparingly — ≤15% of any screen
- DM Sans at all scales: humanist warmth without serif nostalgia
- Photo-first cards: images anchor trips, data layers beside or below
- Border-then-shadow card elevation: flat at rest, lifted on hover
- Pill-shaped search and filter inputs as signature interaction pattern
- Responsive-first layout: desktop planning, mobile field reference

## 2. Colors: The Rausch Palette

One warm accent anchors everything. Neutrals carry the surface; coral earns attention.

### Primary
- **Rausch Coral** (#FF5A5F): Airbnb's signature accent. Used for primary CTAs (New Trip, Save, Book), active tab underlines, progress indicators, and toggle-on states. Never used as a background fill for full-width sections or panels. Its rarity is what makes it feel urgent.
- **Rausch Deep** (#E5484D): Hover and pressed state for the primary button. Also used for destructive confirmation buttons when coral is too cheerful for the context.

### Neutral
- **Charcoal** (#222222): Primary text, active icon fills, strong labels. Near-black with just enough warmth to avoid harshness. Never pure `#000000`.
- **Fog** (#717171): Secondary text, placeholders, metadata (dates, counts, secondary labels). Strong enough to pass 4.5:1 on white.
- **Canvas White** (#FFFFFF): Primary surface. Page backgrounds, card backgrounds, modal backgrounds, form fields.
- **Warm Mist** (#F7F7F7): Secondary surface. Page-level backgrounds that sit behind cards, tab content zones, sidebar fills. Never used inside a card (no nested neutral surfaces).
- **Feather** (#DDDDDD): Borders on inputs and cards at rest. Dividers between list items. Tab bar bottom border.
- **Graphite** (#B0B0B0): Stronger borders for focused inputs, interactive borders on hover before shadow takes over.
- **Alarm** (#C13515): Destructive actions, validation errors. Distinct from coral to avoid ambiguity between "action" and "danger."
- **Grove** (#008A05): Confirmation states, success toasts, checked packing items.

### Named Rules
**The One Voice Rule.** Coral appears on ≤15% of any given screen. Every additional coral element dilutes the attention signal. If you need a second accent to differentiate content, use typographic weight — not another color.

**The No-Gray-On-Gray Rule.** Text is always on white (#FFFFFF) or warm mist (#F7F7F7). Never place #717171 text on #F7F7F7 as body copy — that combination clips below the contrast threshold. Fog (#717171) on Canvas White (#FFFFFF) is the floor.

## 3. Typography: The DM Sans System

**Display Font:** DM Sans (Google Fonts, weights 400/500/600/700)
**Body Font:** DM Sans (same family)
**Mono Font:** system-ui monospace, for booking references and codes only

**Character:** DM Sans is a geometric humanist — precise enough for data-dense interfaces, warm enough to never feel clinical. Using it at all scales (from 2.75rem display down to 0.6875rem labels) creates a coherent voice: the tool does not switch personas between a trip hero and a packing list row.

Playfair Display is prohibited. It belongs to the travel blog the design explicitly rejects.

### Hierarchy
- **Display** (700, clamp 2rem → 2.75rem, 1.1 line-height, -0.02em tracking): Trip titles in the detail header. Hero heading on the home page. One per screen.
- **Headline** (600, 1.375rem, 1.25 line-height, -0.01em tracking): Section headings within tabs ("Upcoming Flights", "Packing Progress"). Tab panel titles. Modal titles.
- **Title** (600, 1rem, 1.35 line-height): Card titles (trip name in the grid), list item primary labels (flight number, hotel name), form section groupings.
- **Body** (400, 0.9375rem, 1.55 line-height): Descriptions, notes, form helper text. Max 65ch line length. The workhorse of the interface.
- **Label** (500, 0.6875rem, 1.2 line-height, 0.06em tracking, uppercase): Category chips, status badges, metadata lines ("3 NIGHTS", "ECONOMY"), button copy. Always uppercase. Never more than 4 words.

### Named Rules
**The Single Family Rule.** One typeface. Hierarchy comes from weight contrast (400 → 700 spans a 1.75 ratio). A second typeface signals "this part is different" — in a data tool, that's noise, not emphasis.

**The Scale Ratio Rule.** Adjacent levels must differ by at least 1.2× in size or 100 in weight. Body (0.9375rem/400) and Title (1rem/600) are intentionally close in size — the weight jump carries the distinction.

## 4. Elevation

Flat by default. Surfaces are indistinguishable in depth until interaction calls for it. Depth appears only as a response to state — hover, focus, or float.

The system uses two instruments: borders (structural, always present) and shadows (behavioral, earned through interaction). A card at rest has a 1px `#DDDDDD` border and no shadow. When the user hovers, the border fades and a soft shadow appears. This transition communicates interactivity without requiring color change.

### Shadow Vocabulary
- **Card Hover** (`0 2px 16px rgba(0, 0, 0, 0.12)`): Appears on trip cards and list items on mouse hover. Border simultaneously fades to transparent. This is the primary depth signal.
- **Floating** (`0 8px 28px rgba(0, 0, 0, 0.16)`): Modals, drawers, dropdowns, autocomplete panels. Communicates detachment from the page surface.
- **Search Pill Rest** (`0 2px 8px rgba(0, 0, 0, 0.10)`): The signature search/filter pill carries subtle ambient lift at rest to distinguish it from flat form inputs.
- **Search Pill Focus** (`0 4px 16px rgba(0, 0, 0, 0.16)`): Focus state for the search pill, expanding the lift to signal engagement.

### Named Rules
**The Flat-By-Default Rule.** Shadows appear only as state responses, never as decoration. A card that looks lifted at rest in a grid of flat cards is a broken affordance signal.

**The Border-Then-Shadow Rule.** Cards and list items carry a 1px border at rest, transition to shadow on hover (border: transparent simultaneously). Never both at once — the combination reads as double-outlined and unresolved.

## 5. Components

### Buttons
Compact, readable, consistent. Copy is always uppercase label-weight — the button does not compete with surrounding body text for weight.

- **Shape:** Gently rounded (8px radius). Oval pill-buttons are reserved for filter chips; action buttons stay rectangular-ish.
- **Primary:** Rausch Coral (#FF5A5F) background, white text, 14px 24px padding, 500 weight, uppercase label. Hover: Rausch Deep (#E5484D), translateY(-1px), 0.15s ease-out.
- **Secondary:** White background, Charcoal text, 1px solid #222222 border, 13px 23px padding (border compensated). Hover: #F7F7F7 background.
- **Ghost:** Transparent background, Charcoal text, no border. 8px 12px padding. Used for tertiary actions (export, breadcrumb actions).
- **Danger:** #C13515 background, white text. Same shape and padding as primary. Used only in destructive confirmation dialogs.
- **Focus ring:** 2px offset, 2px solid #222222. Applies to all variants. Never coral (focus must be distinguishable from active state in color-blind modes).

### Chips / Filter Pills
The secondary navigation and filter language of the app.

- **Active:** Charcoal (#222222) background, white text, pill shape (9999px), 6px 14px padding, label typography.
- **Default/Inactive:** White background, Charcoal text, 1px solid #DDDDDD border, same shape and padding.
- **Hover (inactive):** 1px solid #B0B0B0 border, background stays white.
- No coral chips. Chips communicate category selection, not primary action.

### Cards (Trip Grid)
Photo-first. The image is the card.

- **Corner Style:** Gently rounded (12px). Image clips to the same radius.
- **Image ratio:** 3:2. Always covers the top portion of the card. Never shorter than 180px.
- **Background:** White (#FFFFFF) below the image zone.
- **Shadow Strategy:** 1px solid #DDDDDD border at rest. On hover: border fades (transparent), shadow `0 2px 16px rgba(0,0,0,0.12)` appears. Transition: 0.2s ease-out.
- **Internal Padding:** 16px horizontal, 12px vertical for the text zone below the image.
- **Text Zone:** Title (Title weight/size), date range (Body/Fog), destination badge overlaid on image bottom-left. Action buttons (edit/delete) appear on image hover via opacity transition.

### Inputs / Fields
Two distinct patterns: standard form fields and the search pill.

- **Standard Input:** White background, 1px solid #DDDDDD border at rest, 8px radius, 12px 16px padding, body-size text. Focus: border becomes 1px solid #222222 (no glow, no color shift). Error: border #C13515, helper text in Alarm color below.
- **Search Pill:** White background, pill shape (9999px), 16px 24px padding, `0 2px 8px rgba(0,0,0,0.10)` shadow at rest. Focus: shadow expands to `0 4px 16px rgba(0,0,0,0.16)`. Border: 1px solid transparent at rest, 1px solid #DDDDDD on focus. This is the signature input pattern — used for the trip search on the home page and any filter-by-name interaction.
- **Disabled:** #F7F7F7 background, #B0B0B0 text, 1px solid #DDDDDD border, no interaction cursor.

### Navigation (Navbar)
- **Style:** White (#FFFFFF) background, 1px solid #DDDDDD bottom border. Sticky, full-width.
- **Logo/Brand:** "Wanderplan" in Title weight, Charcoal. No badge or icon next to it.
- **Height:** 64px desktop, 56px mobile.
- **Actions:** Ghost buttons only. Primary actions (New Trip) appear in the page body, not the navbar.

### Tab Bar (TripDetailPage)
Airbnb-style underline tabs, not pill/card tabs.

- **Container:** White background, 1px solid #DDDDDD bottom border. Sticky below navbar.
- **Tab item:** Body text, Fog (#717171) color at rest. 16px horizontal padding, 16px vertical padding. No background.
- **Active tab:** Charcoal (#222222) text, 2px solid #222222 underline flush to the container bottom. No background fill.
- **Hover (inactive):** Charcoal text, no underline. Transition: 0.15s.
- **Mobile:** Horizontally scrollable, no wrapping, tabs maintain padding.
- **Icons:** Emoji icons in current TABS array should be removed. Icon-free tabs with clean labels are the Airbnb pattern.

### Signature Component: Trip Detail Header
The hero zone at the top of TripDetailPage.

- Cover image fills the header (400px desktop, 240px mobile), dimmed with `linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.55) 100%)` overlay.
- Trip title in Display type, white, bottom-aligned over the image.
- Destination and date in Body type, white/80% opacity.
- Action buttons (Edit, Export DOCX, Export PDF, Delete) in ghost style with white text, positioned bottom-right, appearing on hover on desktop, always visible on mobile.
- Breadcrumb above title: "My Trips / [trip name]" in Label type, white/70%.

## 6. Do's and Don'ts

### Do:
- **Do** use Rausch Coral (#FF5A5F) for primary CTAs, active tab underlines, and progress fills — and nothing else. One role per color.
- **Do** keep page backgrounds either white (#FFFFFF) or warm mist (#F7F7F7). Never a third neutral value.
- **Do** use the border-then-shadow hover transition on all clickable cards. This is the primary interactivity signal.
- **Do** size all touch targets to minimum 44×44px on mobile. Form rows, list items, tab buttons.
- **Do** keep body text on white. Fog (#717171) on white only; never Fog on warm mist.
- **Do** use pill-shaped inputs for search and filter interactions. Rectangular inputs for form fields.
- **Do** use uppercase Label typography for all button copy, status badges, and category chips.
- **Do** clip card images to 12px radius matching the card corner. No square-cornered images inside rounded cards.
- **Do** remove emoji from tab labels. Text labels only; icons only if inline SVG at 16–18px.
- **Do** ensure min 4.5:1 contrast for body copy, min 3:1 for large text and interactive elements.

### Don't:
- **Don't** use dark backgrounds, dark mode surfaces, or cool-toned grays. No #0A0A0A, no #1A1A1A, no blue-tinted neutrals. Wanderplan is bright.
- **Don't** use boxed card grids with equal padding and muted backgrounds — this is the Bootstrap admin anti-reference. Cards are white with a subtle border, not gray boxes.
- **Don't** use Playfair Display or any serif typeface anywhere. It belongs to the travel blog this design explicitly rejects.
- **Don't** carry over any forest green, sage, mint, or cream values from the previous palette. The nature theme is gone.
- **Don't** apply coral as a background fill for sections, panels, or full-width banners. It is an accent — ≤15% of any screen.
- **Don't** use gradient text (`background-clip: text`). Single solid color only.
- **Don't** use glassmorphism (backdrop-filter blur on decorative cards or panels).
- **Don't** stack both a border and a shadow on cards simultaneously. Border at rest, shadow on hover — never both.
- **Don't** add colored left-border stripes to list items, callouts, or alert cards. Use background tint or an icon instead.
- **Don't** use light gray text (#AAAAAA or lighter) on white backgrounds. Fog (#717171) is the lightest permitted text color on white.
- **Don't** use secondary accent colors to differentiate data categories. Weight and spacing do that job.

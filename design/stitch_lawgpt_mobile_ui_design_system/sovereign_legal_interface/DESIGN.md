---
name: Sovereign Legal Interface
colors:
  surface: '#0e1323'
  surface-dim: '#0e1323'
  surface-bright: '#34394a'
  surface-container-lowest: '#080d1d'
  surface-container-low: '#161b2b'
  surface-container: '#1a1f30'
  surface-container-high: '#25293a'
  surface-container-highest: '#2f3446'
  on-surface: '#dee1f9'
  on-surface-variant: '#d3c4b0'
  inverse-surface: '#dee1f9'
  inverse-on-surface: '#2b3041'
  outline: '#9c8f7c'
  outline-variant: '#4f4535'
  surface-tint: '#f7bd4d'
  primary: '#ffc454'
  on-primary: '#422d00'
  primary-container: '#e0a93b'
  on-primary-container: '#5b4000'
  inverse-primary: '#7c5800'
  secondary: '#68dbad'
  on-secondary: '#003827'
  secondary-container: '#25a37a'
  on-secondary-container: '#003121'
  tertiary: '#ffbdba'
  on-tertiary: '#68000f'
  tertiary-container: '#ff9491'
  on-tertiary-container: '#8e0019'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdea8'
  primary-fixed-dim: '#f7bd4d'
  on-primary-fixed: '#271900'
  on-primary-fixed-variant: '#5e4200'
  secondary-fixed: '#85f8c8'
  secondary-fixed-dim: '#68dbad'
  on-secondary-fixed: '#002115'
  on-secondary-fixed-variant: '#00513a'
  tertiary-fixed: '#ffdad8'
  tertiary-fixed-dim: '#ffb3b0'
  on-tertiary-fixed: '#410006'
  on-tertiary-fixed-variant: '#92011a'
  background: '#0e1323'
  on-background: '#dee1f9'
  surface-variant: '#2f3446'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system establishes an authoritative, dependable mobile legal-tech environment tailored for precision, speed, and discretion. The visual tone balances the gravitas of constitutional jurisprudence with the clean efficiency of modern algorithmic intelligence. It directly serves legal professionals, paralegals, and citizens navigating high-stakes statutory compliance on Android hardware.

The design movement is **Corporate / Modern** executed through structured dark-mode surfaces, functional geometric typography, and strict signal hygiene:
- **Tone:** Authoritative, measured, discreet, and reliable.
- **Visual Stance:** Zero gratuitous ornamentation. Structure is articulated through tinted layered planes, precise low-contrast borders, and high-contrast typographic hierarchies.
- **Signal Control:** Amber-gold acts strictly as an operational beacon (primary action, active state, core statutory pin). Critical red and verified emerald green are reserved exclusively for legal urgency states and statutory validation.

## Colors

The palette is engineered for prolonged nocturnal and high-stress usage on mobile displays, maintaining uncompromising legibility and clear status delineation.

### Palette Architecture
- **Canvas / Root Background (`#0B1020`):** An abyssal navy-black that anchors the base layer of the application, avoiding the harsh glare of true black while retaining maximum OLED power efficiency.
- **Surface Elevation 1 (`#141A2E`):** Default container tier for cards, bottom navigation, and top system app bars.
- **Surface Elevation 2 (`#1C233D`):** Elevated cards, active touch targets, modals, and statutory citation blocks.
- **Subtle Borders & Separators (`#253052`):** Structural borders that define component boundaries without visually fragmenting the viewport.
- **Primary Accent (`#E0A93B`):** Warm juridical amber-gold. Reserved for affirmative primary CTAs, active tab strokes, selected state fills, and focal point badges.
- **Verified State (`#3FB68B`):** Subdued statutory emerald. Used strictly for authentic court precedent indicators, verified bar council credentials, and validation badges.
- **Emergency & Hazard (`#E5484D`):** High-urgency crimson. Dedicated exclusively to statutory limitation expirations, emergency bail dispatches, and destructive actions.

### Typographic Contrast
- **Text Primary (`#FFFFFF`):** Unadulterated white for primary headlines, statutory articles, and active form input values.
- **Text Secondary (`#A8B0C4`):** Muted grey-blue for legal metadata, subheadings, placeholder text, and structural timestamps.
- **Text Inverse (`#0B1020`):** Dark navy used on top of the amber-gold primary buttons for crisp, glare-free optical contrast.

## Typography

The type scale is standardized on Inter across all touchpoints, emphasizing clean legibility and rapid scanning under complex legal reading conditions.

### Rules of Usage
- **Base Baseline:** 16px (`body-lg`) serves as the standard body size for full statutory clauses, case digests, and conversational AI prompt responses, maintaining comfortable reading comfort on 360px-wide devices.
- **Section Headers & Case Titles:** Use `headline-sm` (18px) or `headline-md` (22px) with tight tracking (`-0.015em`) to conserve horizontal space while maintaining hierarchy.
- **Statutory Labels & Metadata:** Use `label-sm` (10px) with `0.04em` tracking in uppercase for Indian Penal Code (IPC/BNS) references, court tiers (Supreme Court, High Court), and timestamp annotations.
- **Numerical Alignment:** Activate tabular figures (`tnum`) in all data tables, docket counts, citation references, and timeline views.

## Layout & Spacing

The structural layout is tuned specifically for standard 360px x 800px Android viewport bounds, prioritizing reachability, precise finger-tap targets, and maximum functional vertical flow.

### Grid & Canvas Specs
- **Canvas Constraints:** Fluid-width single-column layout constrained to a maximum content width of 360px on mobile viewports.
- **Outer Canvas Margins (`margin`):** Fixed `16px` (`1rem`) on horizontal screen edges to maximize horizontal real estate for multi-line legal texts.
- **Internal Column Gutters (`gutter`):** `16px` (`1rem`) between split metrics and side-by-side action items.
- **Rhythm Multiplier:** A strict 4px/8px incremental scale:
  - `space-xs` (4px): Micro-spacing between icon and inline text, or badge interior padding.
  - `space-sm` (8px): Gaps between list title and subtitle, or chip clusters.
  - `space-md` (16px): Standard component internal padding and stacked card separation.
  - `space-lg` (24px): Inter-section thematic breaks and conversational block separation.
  - `space-xl` (32px): Terminal scroll clearance and major procedural milestones.

### Touch Target Standard
Every interactive element adheres strictly to a minimum 48px x 48px hit target, even if the optical container (e.g., an icon-only back button) renders at 24px or 32px.

## Elevation & Depth

Visual hierarchy does not rely on diffused drop shadows, which dilute the professional rigor of legal software and introduce muddy visual artifacts on dark navy substrates. Depth is achieved via **Tonal Layering** paired with **Low-Contrast Outlines**.

### Elevation Stack
- **Floor 0 (Root `#0B1020`):** Main app background, canvas underlays, and inactive side drawers.
- **Floor 1 (Resting Surface `#141A2E`):** Default card backgrounds, chat history containers, and persistent bottom navigation bars. Border: 1px solid `#253052`.
- **Floor 2 (Floating & Active `#1C233D`):** Modal bottom sheets, input search fields, active dropdown items, and high-priority case briefs. Border: 1px solid `#253052`.
- **Floor 3 (Focused Modals & Popovers):** Elevated contextual menus. Border: 1px solid `#E0A93B` at 30% opacity, paired with an ambient shadow of `0px 8px 24px rgba(0, 0, 0, 0.45)`.

### Border Discipline
All cards, containers, and inputs maintain a crisp 1px border. Never omit borders on elevated surfaces, as they preserve edge definition between adjacent dark navy tones.

## Shapes

The design uses standard rounded geometry (`roundedness: 2`, corresponding to a base corner radius of `0.5rem` / 8px and structural container corners of `1rem` / 16px). This delivers a balanced, modern visual architecture that feels dependable without appearing harsh or hyper-technical.

### Geometry Hierarchy
- **Cards & Primary Modules:** 16px (`1rem` / `rounded-lg`) border radius across all primary structural cards, query output blocks, and conversational message groups.
- **Buttons & Text Fields:** 8px (`0.5rem` / base radius) for standard buttons, chip wrappers, and form inputs, presenting an intentional, disciplined edge.
- **Badges & Micro-Tags:** 4px (`rounded-sm`) for statutory section identifiers, IPC code tags, and document metadata flags.
- **Floating Operational CTAs:** Full pill (`9999px`) reserved only for floating quick-action query bars and voice-recording controls.

## Components

### Buttons
- **Primary Action (CTA):** Background `#E0A93B`, text `#0B1020` (`label-lg`, bold), height 48px, radius 8px. Hover/Active state darkens to `#C9942D`.
- **Secondary / Ghost:** Background `transparent`, border 1px solid `#253052`, text `#FFFFFF`. Active state transitions background to `#1C233D`.
- **Emergency Button:** Background `#E5484D`, text `#FFFFFF`. Used only for high-priority legal escalations and bail/habeas corpus triggers.

### Cards & Case Modules
- Structural container with `#141A2E` background, 1px solid `#253052` border, and 16px corner radius. Padding is uniformly 16px (`space-md`).
- Active or pinned case cards introduce a subtle 1px border highlight of `#E0A93B` at 40% opacity.

### Input Fields
- Background `#141A2E`, border 1px solid `#253052`, radius 8px, height 48px. 
- Input text is `#FFFFFF` (`body-md`), placeholder text is `#A8B0C4`.
- Focus state switches the border to `#E0A93B` with zero outer glow blur.

### Chips & Filter Tags
- Height 32px, radius 8px, background `#141A2E`, border 1px solid `#253052`, text `#A8B0C4` (`label-md`).
- Selected state: background `#1C233D`, border 1px solid `#E0A93B`, text `#E0A93B`.

### Lists & Precedent Items
- Dividers between repetitive legal list items render with 1px solid `#253052`.
- Chevron indicators use sharp, thin line strokes tinted `#A8B0C4`.

### Checkboxes & Radio Controls
- Base dimension 20px x 20px with 4px corner radius for checkboxes, full circle for radios.
- Unchecked: 1.5px border `#253052`, background `transparent`.
- Checked: `#E0A93B` solid background fill with `#0B1020` checkmark glyph.

### Legal Specific Components
- **Citation Badges:** Micro-containers displaying case law reporter details (e.g., "AIR 2023 SC 412"). Background `#1C233D`, text `#E0A93B`, border 1px solid `#253052`, font size 11px, weight 600.
- **Verification Seal:** Inline badge with `#3FB68B` fill at 15% opacity, border 1px solid `#3FB68B`, text `#3FB68B`, paired with a Lucide-style check-circle line icon.
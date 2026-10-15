---
name: Academic Clarity
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#434655'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#00687a'
  on-secondary: '#ffffff'
  secondary-container: '#57dffe'
  on-secondary-container: '#006172'
  tertiary: '#48566a'
  on-tertiary: '#ffffff'
  tertiary-container: '#606e83'
  on-tertiary-container: '#e9f0ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#acedff'
  secondary-fixed-dim: '#4cd7f6'
  on-secondary-fixed: '#001f26'
  on-secondary-fixed-variant: '#004e5c'
  tertiary-fixed: '#d5e3fc'
  tertiary-fixed-dim: '#b9c7df'
  on-tertiary-fixed: '#0d1c2e'
  on-tertiary-fixed-variant: '#3a485b'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.025em
  headline-xl-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0.005em
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.04em
  metric-display:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.03em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-sm: 1rem
  gutter-lg: 2rem
  margin: 2rem
  margin-sm: 1rem
  margin-lg: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system delivers an institutional-grade, highly reliable workspace designed for educators, instructional designers, and academic evaluators. Its personality is scholarly, lucid, authoritative, and unobtrusive. The interface recedes cleanly to spotlight student responses, diagnostic grading rubrics, and longitudinal performance metrics. 

The aesthetic adheres to modern structural minimalism:
- **Architectural Clarity:** Flat, precise planes defined by hairline borders rather than gratuitous visual effects.
- **Academic Rigor:** Data-dense without feeling crowded; high signal-to-noise ratio prioritizes scanability, objective data visualization, and systematic review workflows.
- **Calibrated Restraint:** Interactive colors are purposeful and functional, serving to indicate status, focus states, and primary actions rather than visual ornament.

## Colors

The color palette is engineered for prolonged daily evaluation sessions under bright ambient light, demanding high legibility, strict WCAG AAA compliance for body text, and distinct semantic cues.

### Palette Architecture
- **Primary (`#2563EB`):** Modern cobalt blue. Reserved strictly for primary callouts, critical state transitions, active navigation markers, and verified submission statuses.
- **Secondary (`#06B6D4`):** Focused cyan accent. Used surgically for analytical highlights, diagnostic telemetry, trend lines, and contextual suggestions.
- **Tertiary (`#475569`):** Balanced slate. Deployed for secondary text, metadata labels, tabular sub-headers, and inactive structural indicators.
- **Neutral (`#0F172A`):** Deep navy. The primary ink color across all body copy and primary typography, providing superior contrast without the harsh optical glare of true `#000000`.

### Backgrounds & Structural Dividers
- **Canvas (`#F8FAFC`):** Soft, cool slate foundation that reduces eye strain across expansive desktop displays.
- **Surface (`#FFFFFF`):** Pure crisp white reserved for elevated cards, active input modules, and review panes.
- **Subtle Surface (`#F1F5F9`):** Neutral slate tone for table header bands, inactive states, metric tiles, and utility strips.
- **Borders (`#E2E8F0`):** Single-pixel boundary defining all card regions, table cells, and input fields.

## Typography

The type hierarchy uses `Inter` globally to guarantee neutral structural delivery, open apertures, and optimal rendering on both low-DPI external monitors and high-resolution displays.

### Typographic Guidelines
- **Tabular Figures:** Always apply `font-feature-settings: "tnum", "cv02", "cv03", "cv04"` across quantitative dashboards, rubric point scales, grade entries, and data tables to preserve numerical alignment.
- **Editorial Legibility:** Long-form student responses and qualitative feedback summaries enforce a strict maximum line length of 68 characters with `body-lg` to prevent visual fatigue.
- **Metric Formatting:** Large performance numbers utilize `metric-display` with negative tracking, paired immediately with an uppercase `label-sm` subtitle for instant contextual comprehension.

## Layout & Spacing

The workspace implements a structured 12-column fluid grid system bounded by fixed max-widths for dense administrative tasks.

### Responsive Breakpoints & Adapters
- **Desktop (1280px+):** 12-column layout with 24px (`1.5rem`) gutters and 32px to 48px canvas margins. Optimized for side-by-side assessment views: a fixed 280px contextual navigation/telemetry rail, an adaptable 60% student response inspection pane, and a 40% feedback compilation dock.
- **Tablet (768px – 1279px):** 8-column layout with 16px (`1rem`) gutters and 24px margins. Navigation collapses to an icon dock; review panes convert into stacked or tabbed panels.
- **Mobile (Below 768px):** 4-column layout with 16px gutters and 16px margins. Feedback actions lock to an anchor bar at the bottom viewport boundary.

### Layout Rhythms
Spacing operates strictly on an 8px base rhythm (with a 4px sub-rhythm for atomic components like badges and input insets). Component interiors maintain 16px (`space-md`) to 24px (`space-lg`) of uniform padding, ensuring dense data sets remain readable and visually segregated.

## Elevation & Depth

Visual hierarchy relies on structural planes and diffused ambient illumination rather than harsh physical drop shadows.

### Elevation Levels
- **Level 0 (Flat / Canvas):** Applied to the main application background (`#F8FAFC`). No shadow, no border.
- **Level 1 (Card / Resting Surface):** Applied to standard metric cards, table containers, and side panels. Uses background `#FFFFFF`, bordered by 1px solid `#E2E8F0`, and finished with an ultra-soft ambient shadow: `0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.02)`.
- **Level 2 (Active / Hover / Dropdown):** Applied to interactive card states, rubric dropdowns, and flyout popovers. Uses background `#FFFFFF`, border `#E2E8F0`, with `0 10px 15px -3px rgba(15, 23, 42, 0.06), 0 4px 6px -4px rgba(15, 23, 42, 0.03)`.
- **Level 3 (Modal / Focus Layer):** Applied to dialogs and bulk feedback generation modals. Uses background `#FFFFFF`, accompanied by a semi-transparent slate backdrop overlay (`#0F172A` at 40% opacity), with `0 20px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.03)`.

## Shapes

The design system uses deliberate, refined rounding that balances contemporary design software with academic software rigor.

### Geometry Strategy
- **Base Geometry (`roundedness: 2`):** Primary interactive controls (buttons, text fields, filters, table tags) utilize 8px (`0.5rem`) corner radiuses, yielding clear geometric touch targets.
- **Structural Modules (`rounded-lg` & `rounded-xl`):** Standard analytical metric cards and inner panes employ 16px (`1rem`). Major workspace panels and primary evaluation summary cards utilize 24px (`1.5rem`), softening the extensive grid lines across high-resolution screens.
- **Telemetry Indicators (`rounded-full`):** Status pills, rubric score chips, and avatar containers use complete circular rounding (9999px) to establish distinct visual separation from rectangular input interfaces.

## Components

### Buttons
- **Primary:** Background `#2563EB`, text `#FFFFFF`, 8px border radius, font `label-md`. Subtle hover state shifts to `#1D4ED8`. Active state shifts to `#1E40AF`.
- **Secondary / Ghost:** Background `#FFFFFF`, border 1px solid `#E2E8F0`, text `#1E293B`. Hover state applies `#F8FAFC` background with border `#CBD5E1`.
- **Destructive:** Subtle `#FEF2F2` background with `#DC2626` text and border `#FEE2E2`. Hover elevates to solid `#DC2626` with `#FFFFFF` text.

### Telemetry Badges & Status Chips
- Height: 24px, padding: 0 10px, radius: 9999px, font `label-sm` (uppercase tracking).
- **Needs Review:** Background `#FEF3C7`, text `#92400E`, border 1px solid `#FDE68A`.
- **Automated Feedback Generated:** Background `#ECFEFF`, text `#0E7490`, border 1px solid `#A5F3FC`.
- **Approved / Published:** Background `#ECFDF5`, text `#065F46`, border 1px solid `#A7F3D0`.

### Form Inputs & Text Areas
- Background `#FFFFFF`, border 1px solid `#E2E8F0`, 8px border radius, padding 10px 14px, typography `body-md` in `#0F172A`. Placeholder in `#94A3B8`.
- Focus ring: 2px offset-free outline in `#2563EB` with `#EFF6FF` background glow.

### Tables & Rubric Matrices
- Header rows utilize `#F8FAFC` background with 1px bottom border `#E2E8F0`. Header labels use `label-sm` in `#64748B`.
- Row height: 52px for standard lists, 64px for response queues. Zebra striping is avoided; rows delineate via 1px border `#F1F5F9` and hover highlights of `#F8FAFC`.
- Numerical points, percentages, and timestamps must display using tabular lining numbers.

### Metric Cards
- Background `#FFFFFF`, border 1px solid `#E2E8F0`, 16px or 24px border radius, padding 20px.
- Layout: Top row contains `label-md` in `#64748B` accompanied by a micro status badge; middle row presents the prominent `metric-display` in `#0F172A`; bottom row hosts directional delta metrics (e.g., `+12.4% vs last cohort`) in `#059669` or `#DC2626`.

### Analytics Charts
- Chart areas use transparent backdrops over `#FFFFFF` cards. Gridlines are strictly horizontal, dashed, colored `#F1F5F9`.
- Color hierarchy: `#2563EB` for cohort averages, `#06B6D4` for machine feedback distribution, and `#94A3B8` for historical baselines.
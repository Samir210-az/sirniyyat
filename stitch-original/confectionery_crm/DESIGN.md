---
name: Confectionery CRM
colors:
  surface: '#fff8f6'
  surface-dim: '#fbd1c4'
  surface-bright: '#fff8f6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fff1ed'
  surface-container: '#ffe9e3'
  surface-container-high: '#ffe2da'
  surface-container-highest: '#ffdbd0'
  on-surface: '#2c160e'
  on-surface-variant: '#4d4447'
  inverse-surface: '#442a22'
  inverse-on-surface: '#ffede8'
  outline: '#7f7478'
  outline-variant: '#d0c3c7'
  surface-tint: '#6b5a60'
  primary: '#6b5a60'
  on-primary: '#ffffff'
  primary-container: '#fce4ec'
  on-primary-container: '#76646b'
  inverse-primary: '#d7c1c8'
  secondary: '#75584d'
  on-secondary: '#ffffff'
  secondary-container: '#fed7ca'
  on-secondary-container: '#795c51'
  tertiary: '#636037'
  on-tertiary: '#ffffff'
  tertiary-container: '#f2ecb8'
  on-tertiary-container: '#6e6b41'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#f4dce4'
  primary-fixed-dim: '#d7c1c8'
  on-primary-fixed: '#25181e'
  on-primary-fixed-variant: '#524249'
  secondary-fixed: '#ffdbce'
  secondary-fixed-dim: '#e4beb2'
  on-secondary-fixed: '#2b160f'
  on-secondary-fixed-variant: '#5b4137'
  tertiary-fixed: '#eae4b1'
  tertiary-fixed-dim: '#cdc897'
  on-tertiary-fixed: '#1e1c00'
  on-tertiary-fixed-variant: '#4b4822'
  background: '#fff8f6'
  on-background: '#2c160e'
  surface-variant: '#ffdbd0'
typography:
  headline-lg:
    fontFamily: Literata
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Literata
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-md:
    fontFamily: Literata
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  headline-sm:
    fontFamily: Literata
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 40px
  xl: 64px
  gutter: 16px
  margin-mobile: 20px
  margin-desktop: 48px
---

## Brand & Style
The brand personality is warm, artisanal, and reliable. This design system bridges the gap between a cozy storefront aesthetic and a professional management tool. It targets small business owners who value craft and personal touch, evoking a sense of calm efficiency during a busy baking day.

The visual style is **Soft Minimalist** with tactile influences. It utilizes generous white space, soft layering, and organic shapes to prevent the interface from feeling "corporate." The emotional response should be one of comfort and organized sweetness, making the administrative side of a bakery feel as delightful as the products themselves.

## Colors
The palette is inspired by classic confectionery ingredients: flour, sugar, and cocoa.

*   **Primary (Petal Pink):** Used for soft background washes, active states, and brand-identifiable accents.
*   **Secondary (Caramel Brown):** Used for primary actions, navigation headers, and emphasis. It provides the grounding "professional" weight to the system.
*   **Tertiary (Cream):** The default surface color for containers and cards, providing a warmer, softer alternative to pure white.
*   **Success (Mint Leaf):** Specifically reserved for "Order Completed," "Paid," or "In Stock" indicators.
*   **Neutral (Dark Cacao):** Used strictly for high-contrast text and iconography to ensure WCAG accessibility against the lighter pastel backgrounds.

## Typography
The typography strategy uses a "High-Touch/High-Tech" pairing. **Literata** provides an editorial, sophisticated feel for headings, suggesting the heritage of a recipe book. **Plus Jakarta Sans** is used for all functional data, inputs, and body copy to ensure maximum legibility on mobile devices and high-speed interaction.

For mobile, headlines scale down to preserve vertical space while maintaining their thick, characteristic weight. Labels use a slightly increased letter spacing to remain readable at small sizes against tinted backgrounds.

## Layout & Spacing
The spacing rhythm is based on a 4px baseline grid, favoring "airy" compositions that mirror the light texture of a sponge cake.

The layout uses a **Fluid Grid** for mobile-first accessibility. On handheld devices, the CRM moves to a single-column stacked view with wide 20px margins to allow for easy thumb-tapping. On desktop, a 12-column grid is used, but content is typically contained within a "sweet spot" max-width of 1280px to prevent data rows from becoming too elongated. Gutters are kept tight at 16px to maintain the cohesive card-based grouping.

## Elevation & Depth
Depth is conveyed through **Tonal Layers** and **Ambient Shadows**. Instead of harsh black shadows, this design system uses shadows tinted with the Secondary Caramel color (e.g., `#8D6E63` at 10-15% opacity).

*   **Level 0 (Base):** The main background using a very subtle tint of Cream.
*   **Level 1 (Cards):** Pure white or Tertiary Cream surfaces with a soft, 8px blur shadow. This is the primary work surface.
*   **Level 2 (Modals/Popovers):** Elevated with a 16px blur shadow and a subtle 1px border in a slightly darker cream to define the edges against the background.

Glassmorphism is used sparingly, specifically for mobile navigation bars (frosted Cream) to maintain context of the scroll position underneath.

## Shapes
The shape language is defined by "Doughy" soft edges. Avoid sharp corners at all costs to maintain the friendly, approachable brand voice.

Standard components use a **0.5rem (8px)** radius. Larger structural elements like order cards and dashboard containers use **1.5rem (24px)** to emphasize the "cozy" container feel. Circular shapes are reserved for profile pictures, status badges, and floating action buttons (FABs).

## Components

### Buttons
Primary buttons are solid Caramel Brown with white text, using a rounded-xl (pill) shape. Secondary buttons use a thick 2px Caramel border with no fill. All button taps should feel "cushioned," with a subtle scale-down effect (0.98) on press.

### Order Cards
Cards are the heart of the CRM. They feature a generous 24px internal padding, a Literata sub-heading for the customer name, and a "Mint Leaf" green badge for successful status updates. Cards should have a subtle 1px border in `#FCE4EC` to add definition.

### Input Fields
Inputs should use a soft Cream fill instead of a white background. The focus state is a 2px solid Petal Pink border. Labels are always positioned above the input field in Plus Jakarta Sans (Bold) for clarity.

### Chips & Tags
Used for dietary requirements (e.g., "Gluten Free," "Vegan"). These are pill-shaped with low-contrast pastel fills and Dark Cacao text.

### List Items
Customer and inventory lists use "Soft-Row" styling: each row has a transparent background that changes to a very light Petal Pink on hover/tap, with a subtle separator line in Cream.

### Progress Indicators
For order tracking (e.g., Mixing > Baking > Decorating > Ready), use a custom "Dotted Path" horizontal stepper with soft-rounded icons.
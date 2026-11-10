# FinTrack — design system

## Direction

Quiet confidence. A light financial notebook with warm off-white canvas, white surfaces, forest-green ink, soft pistachio accents and carefully spaced information. A sculptural 3D coin-and-arch composition adds depth to one hero area; operational screens remain clear and quick.

UI/UX Pro Max was queried for a finance dashboard design system, React guidance and dimensional layering. The user's light-theme brief governs the palette; visible labels, focus, reduced motion and restrained animation govern interactions. Magic/21st MCP successfully supplied the ThemeOcean 3D Animated Tilt & Dynamic Glow Card, adapted into the shared summary cards and floating budget card. See [Design sources](../../docs/DESIGN_SOURCES.md).

## Tokens

- Canvas `#f7f8f5`; surface `#ffffff`; ink `#20352c`; muted `#68766e`; border `#e7ebe5`.
- Primary `#153f31`; mint `#eaf4e3`; accent `#b9dda3`; success `#25744b`; warning `#9d610c`; danger `#bc4141`.
- Manrope variable for headings and figures; DM Sans variable for body, bundled locally.
- Space: 4, 8, 12, 16, 20, 24, 32, 40, 48 px. Cards: 20 px radius. Controls: 10–12 px. Pill badges: 999 px.
- Subtle border and restrained shadow. Number columns use tabular figures. Currency always follows account preference and all underlying amounts are minor units.

## Components and behavior

Sidebar with active mint capsule, persistent add-expense action, responsive mobile drawer. Page headings have a small context label and restrained 30 px title. Tables collapse into readable scroll regions. Forms have visible labels, field errors, pending states and server errors. Dialogs trap focus, support Escape, and restore focus. Destructive mutations require confirmation.

Charts have accessible names and adjacent numeric summaries. Budget colors are paired with text status. Zero budgets never divide by zero. All data comes from the API; optional demonstration records are isolated and labeled. Report download exports real selected-month records, safely escaped for spreadsheet use.

Motion: short entrance transitions, subtle pointer tilt and glow, and a single decorative 3D canvas. Tilt uses stable wrapper geometry, updates outside React, and stops its animation frame when settled. Touch keeps a static surface. Respect reduced motion, suspend the canvas offscreen, and provide a static fallback. No motion is required to understand or operate the application. Visible keyboard focus; responsive at 375, 768, 1024 and 1440 px.

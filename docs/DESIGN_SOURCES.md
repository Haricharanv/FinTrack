# Design sources

## 21st.dev Magic MCP

On November 10, 2026, Magic MCP was successfully authenticated and used through its `get_usage`, `get_inspiration` and `get_component` tools. The retrieved public component was **3D Animated Tilt & Dynamic Glow Card**, by **ThemeOcean**, demo ID `44838`:

[Original component on 21st.dev](https://21st.dev/@themeocean/components/3d-animated-tilt-dynamic-glow-card)

`frontend/src/components/MagicTiltCard.tsx` adapts the retrieved component's stable pointer-measurement wrapper, eased rotation and cursor glow into FinTrack's design system. It is used by the dashboard summary cards and floating monthly-plan card. Adaptations include bounded tilt, no hover scaling, keyboard focus feedback, a static touch presentation, reduced-motion support, frame cleanup, and stopping animation work after the surface settles. Content is rendered from the live API; the source's sample content is not used.

This was component discovery and retrieval, not a claim of paid AI component generation. Magic is a design-time tool; application users need no API key, and no key is bundled with the application.

## UI/UX Pro Max

The installed skill supplied finance dashboard, React, accessibility and reduced-motion guidance. A subsequent style search for spatial finance dashboard depth identified **Dimensional Layering** as the relevant approach: overlapping surfaces and gentle depth within an otherwise readable light dashboard. The full product system is in [MASTER.md](../design-system/fintrack/MASTER.md).

## Original work and dependencies

The WebGL coin-and-arch sculpture, layout, finance workflows, charts and API integration are project implementations. Icons use Lucide, charts use Recharts, dialogs use Radix, and the locally bundled fonts are Manrope and DM Sans through Fontsource. Package dependencies and their versions are recorded in the workspace manifests and lockfile.

Graphify provided a local structural graph for inspecting service, route and component relationships before extension. Generated graph output and tool credentials are excluded from the repository.

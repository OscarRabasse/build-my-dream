

## Plan: Apply Briefing Pro's complete visual style

Port the dark theme, fonts, LaserFlow WebGL background, AsciiBg animated background, ElectricBorder component, and all supporting CSS from the [Briefing Pro](/projects/58cece16-68c2-4a90-bed3-7813b9bbb8a7) project to this one.

### What changes visually

- **Background**: Pure black (#000) with the ASCII text animation layer and a radial gradient overlay for readability
- **Laser**: The blue WebGL laser beam effect positioned behind the main content area
- **Typography**: Inter + Space Grotesk fonts, tight tracking on headings
- **Color scheme**: Dark theme with `#0099ff` (blue) as primary/accent, frosted glass surfaces for cards
- **ElectricBorder**: Animated electric border around the URL input card and result cards
- **Utility classes**: `frosted-surface`, `blue-glow-ring`, `elevated-card`, `text-display`

### Files to create

| File | Source |
|------|--------|
| `src/components/LaserFlow.tsx` | Copied from Briefing Pro (Three.js WebGL shader) |
| `src/components/LaserFlow.css` | Container styles |
| `src/components/AsciiBg.tsx` | Copied from Briefing Pro (ASCII animation) |
| `src/components/AsciiBg.css` | ASCII overlay styles |
| `src/components/ElectricBorder.tsx` | Copied from Briefing Pro (canvas-based border) |
| `src/components/ElectricBorder.css` | Glow layers CSS |

### Files to modify

| File | Changes |
|------|---------|
| `src/styles.css` | Replace color tokens with Briefing Pro's dark theme (black bg, white fg, `#0099ff` primary). Add Google Fonts import (Inter + Space Grotesk). Add utility classes (`frosted-surface`, `elevated-card`, `blue-glow-ring`, `text-display`). |
| `src/routes/index.tsx` | Add `AsciiBg` + radial gradient overlay + `LaserFlow` behind content. Wrap URL form card in `ElectricBorder`. Replace inline styles with Tailwind classes using the dark theme. |
| `src/components/UrlForm.tsx` | Restyle with Tailwind: dark frosted card surface, white text, blue-accented input and button. |
| `src/components/ResultPage.tsx` | Restyle with Tailwind: dark cards, blue accent score, frosted surfaces. |
| `src/components/ResultCard.tsx` | Restyle with Tailwind: dark card with border, proper spacing. |
| `src/components/CtaPixweb.tsx` | Restyle with Tailwind: dark surface, blue accent CTA button. |
| `src/components/LoadingState.tsx` | Restyle with Tailwind: match dark theme. |
| `src/routes/__root.tsx` | Add `dark` class to `<html>` tag so the dark theme activates. |

### Dependencies to add

- `three` (required by LaserFlow's WebGL renderer)

### Technical notes

- The dark theme is always-on (class `dark` on `<html>`), no toggle needed
- LaserFlow uses Three.js with a custom GLSL fragment shader — runs in a canvas behind the content
- AsciiBg is pure JS/canvas (Perlin noise + ASCII rendering), no extra deps
- ElectricBorder uses Canvas 2D API with noise-based displacement, no extra deps
- All color values will be converted from HSL (Briefing Pro's Tailwind v3 format) to oklch (this project's Tailwind v4 format)


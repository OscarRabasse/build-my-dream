

## Plan: Fix visual design to match Briefing Pro quality

### Problems identified (from screenshot comparison)

1. **Typography**: The heading is centered and uses default weight — Briefing Pro uses left-aligned, `text-display` class with Space Grotesk, much larger sizing (up to `text-7xl`), and tight letter-spacing
2. **Layout**: Content is centered — Briefing Pro is left-aligned with `max-w-4xl`
3. **Laser position**: The laser is placed at `top: -10%` centered on the viewport — in Briefing Pro, the laser sits directly behind the form card with `top: -465px` relative to the form container, making it "land" right where the card is
4. **Button styling**: The "Analyser" button uses `bg-primary` (blue) — Briefing Pro uses `bg-foreground text-background` (white button, black text) for the primary action
5. **ASCII background opacity**: Barely visible — the radial gradient overlay is too aggressive (solid 95% at edges). Briefing Pro uses `ellipse 80% 50% at 30% 30%` with softer falloff
6. **Form card**: The frosted surface and ElectricBorder are there but the card feels small and cramped. Briefing Pro uses larger padding (`p-8 md:p-10`) and `elevated-card`
7. **Subtitle**: Generic text styling — should match the muted, larger subtitle style from Briefing Pro

### Files to modify

| File | Changes |
|------|---------|
| `src/routes/index.tsx` | Left-align hero section. Fix heading to use `text-7xl font-display text-display`. Reposition laser behind the form card (use the Briefing Pro pattern: wrapper div with `top: -465px`). Soften radial gradient overlay. |
| `src/components/UrlForm.tsx` | Wider card (`max-w-4xl`). Larger padding. Add `elevated-card` class. Change button to white (`bg-foreground text-background`). Larger input. |

### Technical details

- Laser repositioning: wrap the form area in a `relative` container, place LaserFlow as an absolute child with `top: -465px` so the beam focal point lands right at the card
- Radial gradient: switch from `transparent 0%, 0.6 at 50%, 0.95 at 100%` to `ellipse 80% 50% at 30% 30%` matching Briefing Pro
- Hero typography: `text-4xl md:text-6xl lg:text-7xl font-medium text-display font-display`, left-aligned with `text-left`
- Button: `bg-foreground text-background hover:bg-foreground/90` (white on black)




## Plan: Fix layout and laser to match Briefing Pro exactly

### What's wrong (from screenshot + code comparison)

1. **Laser container is wrong**: Briefing Pro uses `left: 0, right: 0, bottom: 0` (full width, stretches to bottom of the relative container). Current project uses `left: -30%, width: 160%, height: 700px` — this constrains it incorrectly and the focal point lands on the title instead of behind the form.

2. **Content not centered**: Briefing Pro uses `max-w-4xl mx-auto` for both the hero text and the form. Current project removed `mx-auto`, making everything stick to the left edge with just `px-6`.

3. **Page structure is wrong**: Briefing Pro has `py-12 md:py-20 px-4` on the main container with the hero and form as separate siblings. Current project wraps everything in a single `max-w-4xl` div with `px-6 md:px-12 py-20 md:py-32`.

4. **Frosted surface is wrong**: Briefing Pro uses `background: hsl(var(--background))` (solid black with border). Current uses `oklch(0.1 0 0 / 80%)` with backdrop-filter blur, making it look like a transparent overlay instead of a solid card.

5. **Gradient overlay wrong approach**: Briefing Pro uses an inline `style` with `hsl`, not a fixed div. The current implementation uses `fixed inset-0` which covers the entire viewport equally — Briefing Pro positions it relative to the page content.

### Files to modify

| File | Changes |
|------|---------|
| `src/routes/index.tsx` | Restructure to match Briefing Pro: hero section as `max-w-4xl mx-auto mb-12`, form in a separate `relative` container with `max-w-4xl mx-auto`. LaserFlow wrapper uses `top: -465px, left: 0, right: 0, bottom: 0`. Gradient overlay uses inline style matching Briefing Pro's exact values. Main container uses `py-12 md:py-20 px-4`. |
| `src/styles.css` | Fix `.frosted-surface` to use solid black background (`oklch(0 0 0)`) with border, no blur/transparency. |
| `src/components/UrlForm.tsx` | Remove the outer `max-w-4xl` div (parent already handles width). |

### Technical details

**Laser container** (matching Briefing Pro exactly):
```html
<div class="absolute pointer-events-none" style="z-index: 0; top: -465px; left: 0; right: 0; bottom: 0;">
  <LaserFlow ... />
</div>
```

**Page structure** (matching Briefing Pro):
```text
div.min-h-screen.py-12.md:py-20.px-4.relative.overflow-hidden
  ├── AsciiBg
  ├── div (gradient overlay, fixed, inline style with hsl values)
  ├── div.max-w-4xl.mx-auto.mb-12.md:mb-16 (hero text, z-10)
  └── div.relative (form container, min-height: 600px)
      ├── div.absolute (LaserFlow, top: -465px, left/right/bottom: 0)
      └── div.max-w-4xl.mx-auto.relative (form card, z-5)
```

**Gradient** (Briefing Pro's exact values converted to oklch):
```css
radial-gradient(ellipse 80% 50% at 30% 30%, oklch(0 0 0 / 0.85) 0%, oklch(0 0 0 / 0.5) 40%, oklch(0 0 0 / 0) 70%)
```

**Frosted surface** fix:
```css
.frosted-surface {
  background: oklch(0 0 0);
  border: 1px solid var(--color-border);
}
```




## Plan: Fix typography, laser position, and remove badge

### 1. Typography — use the exact same fonts as Briefing Pro

The Google Fonts import in `src/styles.css` already loads Inter + Space Grotesk. The `--font-display` and `--font-sans` CSS variables are correctly set. The issue is that the `h1` heading uses `font-display text-display` classes but the font may not be rendering correctly due to the Google Fonts URL or weight loading.

Looking at Briefing Pro's `tailwind.config.ts`, the font stacks are:
- `sans: ['Inter', '-apple-system', 'system-ui', 'sans-serif']`
- `display: ['Space Grotesk', 'Inter', 'sans-serif']`

The current project has these correctly in `@theme inline` block. The real problem: the Google Fonts import URL needs `wght@` ranges for variable fonts and `&display=swap`. The current import looks correct. Let me verify the heading class actually applies — the `text-display` utility sets `letter-spacing: -0.04em; line-height: 0.9; font-weight: 500` which matches Briefing Pro exactly.

**Fix**: The `h1` text "Votre site est-il lisible par les IA ?" wraps awkwardly with the `?` on a new line (visible in screenshot). Add a `<br />` after "les IA" to control the break, or use `whitespace-nowrap` on select words. Also ensure the Google Fonts `@import` URL is at the very top of styles.css (before `@import "tailwindcss"`).

### 2. Laser — reduce the top offset to bring the focal point higher

In Briefing Pro, the laser container uses `top: -465px` but their form card sits much lower on the page (after a hero section + progress bar + margin). In this project, the form card is closer to the top. The laser "explodes" too low — behind the card instead of above it.

**Fix**: Change `top: '-465px'` to `top: '-550px'` (raise the laser container by ~85px so the beam focal point lands above the card, near the gap between the heading and the form).

### 3. Remove "Edit with Lovable" badge

Use the `publish_settings--set_badge_visibility` tool to hide the badge.

### Files to modify

| File | Changes |
|------|---------|
| `src/routes/index.tsx` | Change laser wrapper `top` from `-465px` to `-550px`. Fix h1 line break. |
| `src/styles.css` | Move `@import url(...)` for Google Fonts BEFORE `@import "tailwindcss"` if it isn't already (font loading order matters). |

### Badge

Call `publish_settings--set_badge_visibility({ hide_badge: true })`.


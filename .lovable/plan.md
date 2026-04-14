

## Plan: Fix contrast on result page + hydration error

### Problems

1. **Result page has no background**: When `state === "result"`, the ASCII background animation bleeds through behind the score, verdict, and synthesis card. The wrapping `div.relative.z-10` is transparent — there's nothing blocking the busy ASCII pattern underneath.

2. **Hydration mismatch**: The `@import url(...)` for Google Fonts at the top of `styles.css` causes a `<link>` to be injected in `<head>` at a position that conflicts with SSR-rendered meta tags. Moving the font import into the `<head>` via the root route's `head()` config fixes this.

### Fix

| File | Change |
|------|--------|
| `src/routes/index.tsx` | Add a solid black backdrop behind the result page: wrap the ResultPage in a div with `bg-background` and hide the gradient overlay + LaserFlow when showing results. Same for loading state. |
| `src/styles.css` | Remove the Google Fonts `@import url(...)` line (move it to `__root.tsx` head instead). |
| `src/routes/__root.tsx` | Add the Google Fonts stylesheet as a `links` entry in `head()` to avoid hydration mismatch. |

### Technical details

**Result page backdrop** — in `index.tsx`, the result/loading states get `bg-background` on their wrapper so the ASCII bg is fully occluded:
```tsx
{state === "result" && result && (
  <div className="relative z-10 bg-background min-h-screen -mx-4 -my-12 md:-my-20 px-4 py-12 md:py-20">
    <ResultPage result={result} onReset={handleReset} />
  </div>
)}
```

Alternative (simpler): hide `AsciiBg` and the gradient overlay when not in idle/error state, since they serve no purpose on the result page.

**Hydration fix** — move font loading from CSS `@import` to HTML `<link>`:
```tsx
// __root.tsx head() links array
links: [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" },
  { rel: "stylesheet", href: appCss },
]
```

And remove line 1 from `src/styles.css`.


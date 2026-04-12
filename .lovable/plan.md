

## Plan: "Votre site parle-t-il IA ?" — AI Readability Checker

### Summary

Build a single-page tool where users enter a URL and get an AI readability score (0-100) with 5 detailed checks. Backend uses TanStack Start server functions (no Supabase needed). Raw wireframe styling, all text in French.

### Prerequisites — API Keys Needed

You currently have no `FIRECRAWL_API_KEY` or `ANTHROPIC_API_KEY` in your secrets. You'll need to add both before the tool works:
- **Firecrawl** — get a key at [firecrawl.dev](https://firecrawl.dev)
- **Anthropic** — get a key at [console.anthropic.com](https://console.anthropic.com)

I'll prompt you to add them after the code is built.

### Architecture

```text
Frontend (index.tsx)
  URL input → calls server function → shows results
       │
       ▼
Server function: analyzeUrl (src/utils/analyze.functions.ts)
  1. Firecrawl POST /v1/scrape → rawHtml + html + metadata
  2. fetch <domain>/llms.txt
  3. Programmatic checks 1-5
  4. Anthropic API → 2-3 sentence synthesis
  5. Returns { score, verdict, synthesis, checks[] }
```

### Files to Create

| File | Purpose |
|------|---------|
| `src/utils/analyze.functions.ts` | Server function with Firecrawl + checks + Anthropic |
| `src/lib/types.ts` | TypeScript types (CheckResult, AnalysisResult) |
| `src/components/UrlForm.tsx` | URL input + submit button |
| `src/components/LoadingState.tsx` | 4-step progress animation |
| `src/components/ResultPage.tsx` | Score + verdict + synthesis + 5 check cards + CTA |
| `src/components/ResultCard.tsx` | Single check card (status icon, name, explanation, fix) |
| `src/components/CtaPixweb.tsx` | Bottom CTA linking to pixweb.fr |
| `src/routes/index.tsx` | Main page with idle/loading/result states |

### Files to Modify

| File | Change |
|------|--------|
| `src/routes/index.tsx` | Replace placeholder with the actual app |
| `src/routes/__root.tsx` | Update title/description to French |

### Implementation Details

- **Server function** uses `createServerFn` with POST method, reads `FIRECRAWL_API_KEY` and `ANTHROPIC_API_KEY` from `process.env` (secrets)
- **5 checks** are all programmatic parsing of HTML returned by Firecrawl, except check 4 (separate fetch to `/llms.txt`)
- **Claude Haiku** call happens last with the French prompt from the spec; if it fails, synthesis shows "Synthèse indisponible"
- **Scoring**: green=20, orange=10, red=0, total /100
- **No database, no auth, no persistence** — each analysis is fresh
- **Raw wireframe styling** — semantic HTML, minimal CSS, no colors/gradients


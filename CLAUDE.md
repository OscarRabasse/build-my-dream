# CLAUDE.md — AI Readability tool (build-my-dream)

## Project overview

An AI readability auditor: the user enters a URL, the app scores the site out of 100 across 4 categories (Access, Structure, Content, Signals), and Claude writes a plain-French verdict. Deployed on Cloudflare Workers via TanStack Start.

Stack: React 19 · TanStack Start (SSR) · TanStack Router · Tailwind v4 · shadcn/ui · Cloudflare Workers · Bun · Vite (config managed by `@lovable.dev/vite-tanstack-config`).

> **Lovable retiré** — Claude Code est maintenant 100% en charge du projet.

---

## Non-negotiable rules

- **Package manager: Bun** — always use `/opt/homebrew/bin/bun`, never npm or yarn.
- **Never push to GitHub** without Oscar explicitly asking.
- **One commit per deliverable** — no catch-all commits.
- **Do not refactor untouched code** — only touch what the task requires.
- **Oscar is non-technical** — explain everything in plain French, no jargon.

---

## Running the dev server

```bash
cd "/Users/Oscar/Downloads/🤖 Claude Code files/Projets_IA/AI Readability/build-my-dream"
set -a && source .dev.vars && set +a
PATH="/opt/homebrew/bin:$PATH" bun run dev
```

`.dev.vars` **must be sourced first** — it contains `FIRECRAWL_API_KEY` and `ANTHROPIC_API_KEY`. Without it the server starts but crashes on the first analysis request with "FIRECRAWL_API_KEY non configurée."

Dev server runs on `http://localhost:8080/`.

---

## Architecture

### Ownership

Claude Code owns the entire project. Files à ne pas modifier manuellement :
- `vite.config.ts` — one-liner géré par `@lovable.dev/vite-tanstack-config`, ne pas ajouter de plugins
- `src/components/ui/` — primitives shadcn, ne pas modifier
- `routeTree.gen.ts` — auto-généré par TanStack Router, ne jamais éditer manuellement

### Backend (server function)

`src/utils/analyze.functions.ts` — single `analyzeUrl` server function (`createServerFn`). Every audit makes **2 Firecrawl calls** in parallel (main page + robots.txt). Monitor Firecrawl dashboard as traffic grows.

### Scoring

10 checks, weighted points, max 100. Cap at 30 triggered by: `noindex` meta OR all 4 major AI bots blocked in robots.txt OR `User-agent: * Disallow: /`. Verdict thresholds: 85 / 65 / 40.

| Check | Catégorie | Pts |
|---|---|---|
| Accès robots IA (robots.txt) | access | 15 |
| Sitemap XML | access | 6 |
| Données structurées (JSON-LD) | content | 14 |
| Contenu sans JavaScript | content | 12 |
| Metadata essentielles | signals | 10 |
| Balises Open Graph | signals | 7 |
| Fichier llms.txt | signals | 10 |
| Structure sémantique HTML | structure | 10 |
| Hiérarchie des titres | structure | 10 |
| Attribut lang | structure | 6 |

### Claude synthesis

`synthesize()` calls `claude-haiku-4-5-20251001` with a 600-token budget. Retourne un JSON `{ diagnostic, actions[] }`. `actionPlan` (top 3 actions prioritaires) + `siteTitle` + `siteDescription` sont câblés dans `AnalysisResult`.

---

## Git

- Identity configured globally: Oscar Rabasse / oscar@pixweb.fr
- Remote: `https://github.com/OscarRabasse/build-my-dream`
- Main branch: `main`

---

## What's been done

### Sprint 1 — complete
8 checks, weighted scoring /100, category bars, severity badges, capped-score UI, Claude Haiku synthesis.

### Sprint 2 — complete
- **Phase A** — Types étendus : `CheckFinding`, `ActionItem`, `potentialScoreGain`, `whyItMatters`, `findings` sur chaque check
- **Phase B** — `SiteContext` : snippets JSON-LD / metadata / llms.txt personnalisés avec le vrai nom/URL/description du site
- **Phase C** — `synthesize()` retourne JSON `{ diagnostic, actions }` — plan d'action top 3, max_tokens 600
- **Phase D** — 2 nouveaux checks (Open Graph 7pts, Sitemap XML 6pts), poids rebalancés sur 10 checks = 100pts
- **Phase E** — UI : findings expandable, "Pourquoi c'est important pour l'IA", badge impact, action plan, grouping "À corriger" / "Déjà en place", tri par impact

## What's next (not yet prioritised)

Cache KV 24h · Multi-page · Cloaking detection · Shareable report URL · Re-audit + trend line · PDF export · Lead-gen CTA pour scores < 70 · HTTPS/canonical check · Freshness signals.

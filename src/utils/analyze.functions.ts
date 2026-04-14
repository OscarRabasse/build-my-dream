import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type {
  AnalysisResult,
  Category,
  CategoryScore,
  CheckResult,
  CheckStatus,
  Severity,
} from "@/lib/types";

const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const CATEGORY_LABELS: Record<Category, string> = {
  access: "Accès",
  structure: "Structure",
  content: "Contenu",
  signals: "Signaux",
};

const AI_BOTS = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "ClaudeBot",
  "Claude-SearchBot",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "CCBot",
  "Bytespider",
  "Applebot-Extended",
];

const MAJOR_AI_BOT_FAMILIES = [
  "GPTBot",
  "ClaudeBot",
  "PerplexityBot",
  "Google-Extended",
];

function pointsForStatus(status: CheckStatus, maxPoints: number): number {
  if (status === "green") return maxPoints;
  if (status === "orange") return Math.round(maxPoints * 0.5);
  return 0;
}

function verdict(score: number): string {
  if (score >= 85) return "Excellent — votre site parle couramment IA";
  if (score >= 65) return "Correct — quelques ajustements à faire";
  if (score >= 40) return "À améliorer — les IA ont du mal à vous lire";
  return "Invisible — les crawlers IA passent à côté de votre site";
}

function extractText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function checkSemanticStructure(html: string): CheckResult {
  const tags = ["header", "main", "nav", "article|section", "footer"];
  let count = 0;
  for (const tag of tags) {
    const re = new RegExp(`<(${tag})[\\s>]`, "i");
    if (re.test(html)) count++;
  }
  let status: CheckStatus = "red";
  if (count >= 4) status = "green";
  else if (count >= 2) status = "orange";

  const maxPoints = 12;
  return {
    name: "Structure sémantique HTML",
    status,
    explanation:
      status === "green"
        ? `${count}/5 balises sémantiques détectées — bonne structure.`
        : status === "orange"
          ? `${count}/5 balises sémantiques détectées — structure partielle.`
          : `${count}/5 balises sémantiques détectées — structure quasi absente.`,
    fix:
      status === "green"
        ? "Rien à corriger."
        : "Remplacez les <div> génériques par <header>, <main>, <nav>, <section>, <footer>.",
    category: "structure",
    severity: "medium",
    points: pointsForStatus(status, maxPoints),
    maxPoints,
    codeSnippet:
      status === "green"
        ? undefined
        : `<body>
  <header>…</header>
  <nav>…</nav>
  <main>
    <article>…</article>
  </main>
  <footer>…</footer>
</body>`,
  };
}

function checkHeadings(html: string): CheckResult {
  const headingRegex = /<h([1-6])[^>]*>/gi;
  const headings: number[] = [];
  let match: RegExpExecArray | null;
  while ((match = headingRegex.exec(html)) !== null) {
    headings.push(parseInt(match[1]));
  }

  const h1Count = headings.filter((h) => h === 1).length;
  const hasSkip = headings.some((h, i) => i > 0 && h > headings[i - 1] + 1);
  const totalHeadings = headings.length;

  let problems = 0;
  if (h1Count !== 1) problems++;
  if (hasSkip) problems++;
  if (totalHeadings < 3) problems++;

  let status: CheckStatus = "green";
  if (problems === 1) status = "orange";
  if (problems >= 2) status = "red";

  const details: string[] = [];
  if (h1Count === 0) details.push("Aucun H1 trouvé");
  else if (h1Count > 1) details.push(`${h1Count} H1 trouvés (1 seul attendu)`);
  if (hasSkip) details.push("Saut de niveau détecté");
  if (totalHeadings < 3) details.push(`Seulement ${totalHeadings} titre(s)`);

  const maxPoints = 12;
  return {
    name: "Hiérarchie des titres",
    status,
    explanation:
      details.length > 0
        ? details.join(". ") + "."
        : "Hiérarchie propre avec un H1 unique.",
    fix:
      status === "green"
        ? "Rien à corriger."
        : "Assurez un seul H1, une hiérarchie sans saut (H2→H3→H4) et au moins 3 titres.",
    category: "structure",
    severity: "medium",
    points: pointsForStatus(status, maxPoints),
    maxPoints,
    codeSnippet:
      status === "green"
        ? undefined
        : `<h1>Titre principal de la page</h1>
<h2>Section</h2>
<h3>Sous-section</h3>
<h2>Autre section</h2>`,
  };
}

function checkJsContent(rawHtml: string, renderedHtml: string): CheckResult {
  const rawText = extractText(rawHtml);
  const renderedText = extractText(renderedHtml);

  const maxPoints = 12;

  if (renderedText.length === 0) {
    return {
      name: "Contenu accessible sans JavaScript",
      status: "red",
      explanation: "Aucun contenu textuel détecté après rendu.",
      fix: "Vérifiez que votre page contient du contenu visible.",
      category: "content",
      severity: "high",
      points: 0,
      maxPoints,
    };
  }

  const ratio = rawText.length / renderedText.length;

  let status: CheckStatus = "green";
  if (ratio < 0.3) status = "red";
  else if (ratio < 0.8) status = "orange";

  const pct = Math.round(ratio * 100);

  return {
    name: "Contenu accessible sans JavaScript",
    status,
    explanation:
      status === "green"
        ? `${pct}% du contenu est dans le HTML initial — très bien.`
        : status === "orange"
          ? `${pct}% du contenu seulement est dans le HTML initial.`
          : `${pct}% du contenu est dans le HTML initial — le site dépend fortement de JavaScript.`,
    fix:
      status === "green"
        ? "Rien à corriger."
        : "Adoptez le rendu côté serveur (SSR/SSG) pour que le contenu soit dans le HTML initial.",
    category: "content",
    severity: "high",
    points: pointsForStatus(status, maxPoints),
    maxPoints,
  };
}

async function checkLlmsTxt(url: string): Promise<CheckResult> {
  const maxPoints = 12;
  const skeleton = `# Nom de votre site

> Description courte de ce que fait votre site.

## Pages principales

- [Accueil](https://exemple.fr/)
- [À propos](https://exemple.fr/a-propos)
- [Contact](https://exemple.fr/contact)
`;

  try {
    const parsed = new URL(url);
    const llmsUrl = `${parsed.protocol}//${parsed.host}/llms.txt`;
    const res = await fetch(llmsUrl, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const text = await res.text();
      const trimmed = text.trim();
      if (trimmed.length > 0) {
        const hasH1 = /^#\s+/m.test(trimmed);
        const hasH2 = /^##\s+/m.test(trimmed);
        const hasLink = /\[[^\]]+\]\([^)]+\)/.test(trimmed);

        if (hasH1 && hasH2 && hasLink) {
          return {
            name: "Fichier llms.txt",
            status: "green",
            explanation:
              "Fichier llms.txt présent et conforme au format llmstxt.org.",
            fix: "Rien à corriger.",
            category: "signals",
            severity: "medium",
            points: maxPoints,
            maxPoints,
          };
        }

        const missing: string[] = [];
        if (!hasH1) missing.push("titre H1");
        if (!hasH2) missing.push("section ##");
        if (!hasLink) missing.push("lien markdown");

        return {
          name: "Fichier llms.txt",
          status: "orange",
          explanation: `Fichier llms.txt présent mais incomplet — manque : ${missing.join(", ")}.`,
          fix: "Suivez le format llmstxt.org : un titre H1, au moins une section ## et des liens markdown vers vos pages clés.",
          category: "signals",
          severity: "medium",
          points: pointsForStatus("orange", maxPoints),
          maxPoints,
          codeSnippet: skeleton,
        };
      }
    }
  } catch {
    // ignore
  }
  return {
    name: "Fichier llms.txt",
    status: "red",
    explanation: "Aucun fichier llms.txt trouvé à la racine du site.",
    fix: "Créez un fichier /llms.txt décrivant votre site pour les crawlers IA. Voir llmstxt.org.",
    category: "signals",
    severity: "medium",
    points: 0,
    maxPoints,
    codeSnippet: skeleton,
  };
}

function checkMetadata(metadata: Record<string, unknown>): {
  result: CheckResult;
  isNoindex: boolean;
} {
  let problems = 0;
  const details: string[] = [];

  const title = (metadata.title as string) || "";
  if (!title || title.length < 30 || title.length > 70) {
    problems++;
    details.push(
      !title
        ? "Title manquant"
        : `Title de ${title.length} caractères (idéal : 30-70)`
    );
  }

  const desc =
    (metadata.description as string) ||
    (metadata.ogDescription as string) ||
    "";
  if (!desc || desc.length < 70 || desc.length > 160) {
    problems++;
    details.push(
      !desc
        ? "Meta description manquante"
        : `Meta description de ${desc.length} caractères (idéal : 70-160)`
    );
  }

  const canonical = metadata.canonical as string | undefined;
  if (!canonical) {
    problems++;
    details.push("Balise canonical manquante");
  }

  const robots = ((metadata.robots as string) || "").toLowerCase();
  const isNoindex = robots.includes("noindex");
  if (isNoindex) {
    problems += 2;
    details.push(
      "Directive noindex détectée — les crawlers ignorent cette page"
    );
  }

  let status: CheckStatus = "green";
  if (problems >= 3) status = "red";
  else if (problems >= 1) status = "orange";

  const maxPoints = 12;
  return {
    isNoindex,
    result: {
      name: "Metadata essentielles",
      status,
      explanation:
        details.length > 0
          ? details.join(". ") + "."
          : "Title, description, canonical et robots sont OK.",
      fix:
        status === "green"
          ? "Rien à corriger."
          : "Corrigez les éléments signalés : title (30-70 car.), description (70-160 car.), canonical, pas de noindex.",
      category: "signals",
      severity: "high",
      points: pointsForStatus(status, maxPoints),
      maxPoints,
      codeSnippet:
        status === "green"
          ? undefined
          : `<title>Votre titre — 30 à 70 caractères incluant votre marque</title>
<meta name="description" content="Description de 70 à 160 caractères qui résume la page et donne envie de cliquer." />
<link rel="canonical" href="https://exemple.fr/page" />
<meta name="robots" content="index, follow" />`,
    },
  };
}

function checkHtmlLang(rawHtml: string): CheckResult {
  const match = rawHtml.match(/<html[^>]*\blang\s*=\s*["']([^"']+)["']/i);
  const lang = match ? match[1].trim() : "";
  const status: CheckStatus = lang.length > 0 ? "green" : "red";

  const maxPoints = 10;
  return {
    name: "Attribut lang sur <html>",
    status,
    explanation:
      status === "green"
        ? `Attribut lang="${lang}" déclaré — la langue de la page est explicite.`
        : "Aucun attribut lang sur la balise <html> — les IA doivent deviner la langue.",
    fix:
      status === "green"
        ? "Rien à corriger."
        : 'Ajoutez l\'attribut lang à la balise <html> (par exemple lang="fr").',
    category: "structure",
    severity: "low",
    points: pointsForStatus(status, maxPoints),
    maxPoints,
    codeSnippet: status === "green" ? undefined : '<html lang="fr">',
  };
}

function parseRobotsTxt(
  text: string
): Record<string, { disallow: string[]; allow: string[] }> {
  const groups: Record<string, { disallow: string[]; allow: string[] }> = {};
  const lines = text.split(/\r?\n/);
  let currentAgents: string[] = [];
  let collecting = false;

  for (const rawLine of lines) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) {
      collecting = false;
      continue;
    }
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const field = line.slice(0, colonIdx).trim().toLowerCase();
    const value = line.slice(colonIdx + 1).trim();

    if (field === "user-agent") {
      if (collecting) {
        currentAgents = [];
        collecting = false;
      }
      const agentKey = value.toLowerCase();
      currentAgents.push(agentKey);
      if (!groups[agentKey]) groups[agentKey] = { disallow: [], allow: [] };
    } else if (field === "disallow" || field === "allow") {
      collecting = true;
      for (const agent of currentAgents) {
        if (!groups[agent]) groups[agent] = { disallow: [], allow: [] };
        if (field === "disallow") groups[agent].disallow.push(value);
        else groups[agent].allow.push(value);
      }
    } else {
      collecting = true;
    }
  }

  return groups;
}

function isBotBlocked(
  groups: Record<string, { disallow: string[]; allow: string[] }>,
  bot: string
): boolean {
  const key = bot.toLowerCase();
  const specific = groups[key];
  if (specific) {
    const blocksRoot = specific.disallow.some((d) => d === "/");
    const allowsRoot = specific.allow.some((a) => a === "/" || a === "");
    if (blocksRoot && !allowsRoot) return true;
    if (blocksRoot) return true;
  }
  const wildcard = groups["*"];
  if (!specific && wildcard) {
    const blocksRoot = wildcard.disallow.some((d) => d === "/");
    const allowsRoot = wildcard.allow.some((a) => a === "/" || a === "");
    if (blocksRoot && !allowsRoot) return true;
  }
  return false;
}

function checkRobotsAiBots(
  robotsText: string | null
): { result: CheckResult; allMajorAiBotsBlocked: boolean } {
  const maxPoints = 15;

  if (robotsText === null) {
    return {
      allMajorAiBotsBlocked: false,
      result: {
        name: "Accès des robots IA (robots.txt)",
        status: "green",
        explanation:
          "Aucun fichier robots.txt trouvé — par défaut, tous les robots IA peuvent accéder au site.",
        fix: "Rien à corriger.",
        category: "access",
        severity: "critical",
        points: maxPoints,
        maxPoints,
      },
    };
  }

  const groups = parseRobotsTxt(robotsText);
  const blockedBots: string[] = [];
  for (const bot of AI_BOTS) {
    if (isBotBlocked(groups, bot)) blockedBots.push(bot);
  }

  const majorBlocked = MAJOR_AI_BOT_FAMILIES.filter((bot) =>
    isBotBlocked(groups, bot)
  );
  const allMajorAiBotsBlocked =
    majorBlocked.length === MAJOR_AI_BOT_FAMILIES.length;

  const wildcard = groups["*"];
  const wildcardBlocksAll =
    wildcard && wildcard.disallow.some((d) => d === "/") &&
    !wildcard.allow.some((a) => a === "/" || a === "");

  let status: CheckStatus;
  if (blockedBots.length === 0) status = "green";
  else if (allMajorAiBotsBlocked || wildcardBlocksAll) status = "red";
  else if (blockedBots.length >= 4) status = "red";
  else status = "orange";

  const explanation =
    blockedBots.length === 0
      ? "Votre robots.txt n'interdit aucun robot IA — parfait."
      : wildcardBlocksAll
        ? "Votre robots.txt bloque tous les robots avec User-agent: * + Disallow: /."
        : `Votre robots.txt bloque ${blockedBots.join(", ")}.`;

  const allowSnippet =
    blockedBots.length > 0
      ? blockedBots.map((b) => `User-agent: ${b}\nAllow: /`).join("\n\n")
      : AI_BOTS.slice(0, 4)
          .map((b) => `User-agent: ${b}\nAllow: /`)
          .join("\n\n");

  return {
    allMajorAiBotsBlocked: allMajorAiBotsBlocked || !!wildcardBlocksAll,
    result: {
      name: "Accès des robots IA (robots.txt)",
      status,
      explanation,
      fix:
        status === "green"
          ? "Rien à corriger."
          : "Autorisez explicitement les robots IA dans votre robots.txt.",
      category: "access",
      severity: "critical",
      points: pointsForStatus(status, maxPoints),
      maxPoints,
      codeSnippet: status === "green" ? undefined : allowSnippet,
    },
  };
}

function checkJsonLd(rawHtml: string): CheckResult {
  const maxPoints = 15;
  const blockRegex =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const blocks: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = blockRegex.exec(rawHtml)) !== null) {
    blocks.push(m[1]);
  }

  const ENTITY_TYPES = ["Organization", "WebSite"];
  const CONTENT_TYPES = [
    "Article",
    "BlogPosting",
    "NewsArticle",
    "Product",
    "LocalBusiness",
    "FAQPage",
    "BreadcrumbList",
    "Service",
    "Event",
    "Recipe",
  ];

  const foundEntity = new Set<string>();
  const foundContent = new Set<string>();
  let parseErrors = 0;

  const collect = (node: unknown) => {
    if (!node) return;
    if (Array.isArray(node)) {
      for (const item of node) collect(item);
      return;
    }
    if (typeof node === "object") {
      const obj = node as Record<string, unknown>;
      const t = obj["@type"];
      if (typeof t === "string") {
        if (ENTITY_TYPES.includes(t)) foundEntity.add(t);
        if (CONTENT_TYPES.includes(t)) foundContent.add(t);
      } else if (Array.isArray(t)) {
        for (const ti of t) {
          if (typeof ti === "string") {
            if (ENTITY_TYPES.includes(ti)) foundEntity.add(ti);
            if (CONTENT_TYPES.includes(ti)) foundContent.add(ti);
          }
        }
      }
      if (obj["@graph"]) collect(obj["@graph"]);
    }
  };

  for (const block of blocks) {
    try {
      collect(JSON.parse(block));
    } catch {
      parseErrors++;
    }
  }

  let status: CheckStatus;
  if (foundEntity.size > 0 && foundContent.size > 0) status = "green";
  else if (foundEntity.size > 0 || foundContent.size > 0) status = "orange";
  else status = "red";

  const parts: string[] = [];
  if (blocks.length === 0) {
    parts.push("Aucun bloc JSON-LD détecté");
  } else {
    parts.push(`${blocks.length} bloc(s) JSON-LD détecté(s)`);
    if (foundEntity.size > 0)
      parts.push(`schéma d'entité : ${Array.from(foundEntity).join(", ")}`);
    if (foundContent.size > 0)
      parts.push(
        `schéma de contenu : ${Array.from(foundContent).join(", ")}`
      );
    if (parseErrors > 0) parts.push(`${parseErrors} bloc(s) invalide(s)`);
  }

  const skeleton = `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Nom de votre entreprise",
  "url": "https://exemple.fr",
  "logo": "https://exemple.fr/logo.png",
  "description": "Description courte de votre entreprise.",
  "sameAs": [
    "https://www.linkedin.com/company/votre-entreprise"
  ]
}
</script>`;

  return {
    name: "Données structurées (JSON-LD)",
    status,
    explanation: parts.join(" — ") + ".",
    fix:
      status === "green"
        ? "Rien à corriger."
        : "Ajoutez un bloc JSON-LD Organization (ou WebSite) et un schéma adapté à votre contenu (Article, Product, FAQPage…).",
    category: "content",
    severity: "high",
    points: pointsForStatus(status, maxPoints),
    maxPoints,
    codeSnippet: status === "green" ? undefined : skeleton,
  };
}

function buildCategoryScores(checks: CheckResult[]): CategoryScore[] {
  const buckets: Record<Category, { earned: number; max: number }> = {
    access: { earned: 0, max: 0 },
    structure: { earned: 0, max: 0 },
    content: { earned: 0, max: 0 },
    signals: { earned: 0, max: 0 },
  };
  for (const c of checks) {
    buckets[c.category].earned += c.points;
    buckets[c.category].max += c.maxPoints;
  }
  return (Object.keys(buckets) as Category[]).map((cat) => {
    const { earned, max } = buckets[cat];
    return {
      category: cat,
      label: CATEGORY_LABELS[cat],
      earned,
      max,
      percentage: max === 0 ? 0 : Math.round((earned / max) * 100),
    };
  });
}

function scoreFromChecks(
  checks: CheckResult[],
  flags: { isNoindex: boolean; allMajorAiBotsBlocked: boolean }
): {
  rawScore: number;
  score: number;
  capped: boolean;
  capReason?: string;
  categoryScores: CategoryScore[];
} {
  const earned = checks.reduce((sum, c) => sum + c.points, 0);
  const max = checks.reduce((sum, c) => sum + c.maxPoints, 0);
  const rawScore = max === 0 ? 0 : Math.round((earned / max) * 100);

  const categoryScores = buildCategoryScores(checks);

  let capped = false;
  let capReason: string | undefined;

  if (flags.isNoindex) {
    capped = true;
    capReason =
      "Score plafonné : votre page est en noindex, les moteurs et IA l'ignorent.";
  } else if (flags.allMajorAiBotsBlocked) {
    capped = true;
    capReason =
      "Score plafonné : votre robots.txt bloque les principaux robots IA (GPTBot, ClaudeBot, PerplexityBot, Google-Extended).";
  }

  const score = capped ? Math.min(rawScore, 30) : rawScore;

  return { rawScore, score, capped, capReason, categoryScores };
}

async function fetchRobotsTxt(
  url: string,
  firecrawlKey: string
): Promise<string | null> {
  try {
    const parsed = new URL(url);
    const robotsUrl = `${parsed.protocol}//${parsed.host}/robots.txt`;
    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: robotsUrl,
        formats: ["rawHtml"],
        onlyMainContent: false,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const raw: string = data.data?.rawHtml || data.rawHtml || "";
    if (!raw) return null;
    // Firecrawl wraps plain text in a minimal HTML document; strip tags.
    const text = raw
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, "")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&");
    return text.trim().length > 0 ? text : null;
  } catch (e) {
    console.error("robots.txt fetch failed:", e);
    return null;
  }
}

async function synthesize(
  url: string,
  title: string,
  score: number,
  checks: CheckResult[]
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return "Synthèse indisponible (clé API manquante).";

  const statusMap = { green: "🟢 Vert", orange: "🟠 Orange", red: "🔴 Rouge" };
  const checksText = checks
    .map((c) => `- ${c.name} : ${statusMap[c.status]} — ${c.explanation}`)
    .join("\n");

  const prompt = `Tu es un expert en optimisation web pour les crawlers IA (ChatGPT Search, Perplexity, Claude, Gemini). Voici les résultats d'audit d'un site :

URL : ${url}
Titre : ${title}
Score : ${score}/100

Checks :
${checksText}

Écris un verdict de 2-3 phrases en français, direct et sans bullshit, qui résume l'état du site pour un non-technique. Pas de jargon. Pas de moralisation. Commence directement par l'état du site, pas par une politesse.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
        "user-agent":
          "AI-Readability-Checker/1.0 (+https://build-my-dream-224.lovable.app)",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      let parsed: { error?: { type?: string; message?: string } } = {};
      try {
        parsed = JSON.parse(errorBody);
      } catch {}
      const kFp = `${apiKey.slice(0, 4)}…${apiKey.slice(-4)}`;
      console.log(
        `[SYNTHESIS_ERROR] status=${res.status} type=${parsed.error?.type ?? "?"} msg=${parsed.error?.message ?? "?"} key=${kFp} keyLen=${apiKey.length} cfRay=${res.headers.get("cf-ray") ?? "?"} body=${errorBody}`
      );
      return "Synthèse indisponible.";
    }

    const data = await res.json();
    return (data.content?.[0]?.text as string) || "Synthèse indisponible.";
  } catch (e) {
    console.log("[SYNTHESIS ERROR] Anthropic call failed:", e instanceof Error ? e.message : e);
    return "Synthèse indisponible.";
  }
}

export const analyzeUrl = createServerFn({ method: "POST" })
  .inputValidator(z.object({ url: z.string().url() }))
  .handler(async ({ data }): Promise<AnalysisResult> => {
    const { url } = data;

    const firecrawlKey = process.env.FIRECRAWL_API_KEY;
    if (!firecrawlKey) {
      throw new Error("FIRECRAWL_API_KEY non configurée.");
    }

    const scrapePromise = fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["rawHtml", "html", "markdown"],
        onlyMainContent: false,
      }),
    });

    const robotsPromise = fetchRobotsTxt(url, firecrawlKey);

    const [scrapeRes, robotsText] = await Promise.all([
      scrapePromise,
      robotsPromise,
    ]);

    if (!scrapeRes.ok) {
      const err = await scrapeRes.text();
      console.error("Firecrawl error:", scrapeRes.status, err);
      throw new Error(
        "Impossible d'analyser ce site. Vérifiez que l'URL est accessible publiquement."
      );
    }

    const scrapeData = await scrapeRes.json();
    const rawHtml: string = scrapeData.data?.rawHtml || scrapeData.rawHtml || "";
    const html: string = scrapeData.data?.html || scrapeData.html || "";
    const metadata: Record<string, unknown> =
      scrapeData.data?.metadata || scrapeData.metadata || {};

    const semanticCheck = checkSemanticStructure(html || rawHtml);
    const headingsCheck = checkHeadings(html || rawHtml);
    const jsCheck = checkJsContent(rawHtml, html);
    const llmsCheck = await checkLlmsTxt(url);
    const { result: metadataCheck, isNoindex } = checkMetadata(metadata);
    const htmlLangCheck = checkHtmlLang(rawHtml);
    const jsonLdCheck = checkJsonLd(rawHtml);
    const { result: robotsCheck, allMajorAiBotsBlocked } =
      checkRobotsAiBots(robotsText);

    const checks: CheckResult[] = [
      robotsCheck,
      jsonLdCheck,
      jsCheck,
      metadataCheck,
      llmsCheck,
      semanticCheck,
      headingsCheck,
      htmlLangCheck,
    ];

    const { rawScore, score, capped, capReason, categoryScores } =
      scoreFromChecks(checks, { isNoindex, allMajorAiBotsBlocked });

    checks.sort(
      (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
    );

    const v = verdict(score);

    const title = (metadata.title as string) || url;
    const synthesis = await synthesize(url, title, score, checks);

    return {
      url,
      score,
      rawScore,
      capped,
      capReason,
      verdict: v,
      synthesis,
      checks,
      categoryScores,
    };
  });

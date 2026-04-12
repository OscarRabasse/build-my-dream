import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { AnalysisResult, CheckResult, CheckStatus } from "@/lib/types";

function scoreFromChecks(checks: CheckResult[]): number {
  return checks.reduce((sum, c) => {
    if (c.status === "green") return sum + 20;
    if (c.status === "orange") return sum + 10;
    return sum;
  }, 0);
}

function verdict(score: number): string {
  if (score >= 90) return "Excellent — votre site parle couramment IA";
  if (score >= 70) return "Correct — quelques ajustements à faire";
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
  const hasSkip = headings.some(
    (h, i) => i > 0 && h > headings[i - 1] + 1
  );
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

  return {
    name: "Hiérarchie des titres",
    status,
    explanation:
      details.length > 0 ? details.join(". ") + "." : "Hiérarchie propre avec un H1 unique.",
    fix:
      status === "green"
        ? "Rien à corriger."
        : "Assurez un seul H1, une hiérarchie sans saut (H2→H3→H4) et au moins 3 titres.",
  };
}

function checkJsContent(rawHtml: string, renderedHtml: string): CheckResult {
  const rawText = extractText(rawHtml);
  const renderedText = extractText(renderedHtml);

  if (renderedText.length === 0) {
    return {
      name: "Contenu accessible sans JavaScript",
      status: "red",
      explanation: "Aucun contenu textuel détecté après rendu.",
      fix: "Vérifiez que votre page contient du contenu visible.",
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
  };
}

async function checkLlmsTxt(url: string): Promise<CheckResult> {
  try {
    const parsed = new URL(url);
    const llmsUrl = `${parsed.protocol}//${parsed.host}/llms.txt`;
    const res = await fetch(llmsUrl, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const text = await res.text();
      if (text.trim().length > 0) {
        return {
          name: "Fichier llms.txt",
          status: "green",
          explanation: "Fichier llms.txt présent et non vide.",
          fix: "Rien à corriger.",
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
  };
}

function checkMetadata(metadata: Record<string, unknown>): CheckResult {
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
    (metadata.description as string) || (metadata.ogDescription as string) || "";
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
  if (robots.includes("noindex")) {
    problems += 2; // counts extra to push to red
    details.push("Directive noindex détectée — les crawlers ignorent cette page");
  }

  let status: CheckStatus = "green";
  if (problems >= 3) status = "red";
  else if (problems >= 1) status = "orange";

  return {
    name: "Metadata essentielles",
    status,
    explanation:
      details.length > 0 ? details.join(". ") + "." : "Title, description, canonical et robots sont OK.",
    fix:
      status === "green"
        ? "Rien à corriger."
        : "Corrigez les éléments signalés : title (30-70 car.), description (70-160 car.), canonical, pas de noindex.",
  };
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
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      console.error("Anthropic error:", res.status, await res.text());
      return "Synthèse indisponible.";
    }

    const data = await res.json();
    return (data.content?.[0]?.text as string) || "Synthèse indisponible.";
  } catch (e) {
    console.error("Anthropic call failed:", e);
    return "Synthèse indisponible.";
  }
}

export const analyzeUrl = createServerFn({ method: "POST" })
  .inputValidator(z.object({ url: z.string().url() }))
  .handler(async ({ data }): Promise<AnalysisResult> => {
    const { url } = data;

    // 1. Firecrawl scrape
    const firecrawlKey = process.env.FIRECRAWL_API_KEY;
    if (!firecrawlKey) {
      throw new Error("FIRECRAWL_API_KEY non configurée.");
    }

    const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
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

    // 2-3. Run checks
    const [check1, check2, check3, check4, check5] = await Promise.all([
      Promise.resolve(checkSemanticStructure(html || rawHtml)),
      Promise.resolve(checkHeadings(html || rawHtml)),
      Promise.resolve(checkJsContent(rawHtml, html)),
      checkLlmsTxt(url),
      Promise.resolve(checkMetadata(metadata)),
    ]);

    const checks = [check1, check2, check3, check4, check5];
    const score = scoreFromChecks(checks);
    const v = verdict(score);

    // 4. Claude synthesis
    const title = (metadata.title as string) || url;
    const synthesis = await synthesize(url, title, score, checks);

    return { url, score, verdict: v, synthesis, checks };
  });

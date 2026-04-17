import type { AnalysisResult } from "@/lib/types";
import { ResultCard } from "./ResultCard";
import { CategoryScoresBar } from "./CategoryScoresBar";
import { CtaPixweb } from "./CtaPixweb";
import { HumanVsAi } from "./HumanVsAi";

function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^[-*]\s+/gm, "• ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

interface ResultPageProps {
  result: AnalysisResult;
  onReset: () => void;
}

export function ResultPage({ result, onReset }: ResultPageProps) {
  const scoreColorClass = result.capped ? "text-destructive" : "text-primary";
  const toFix = result.checks.filter((c) => c.status !== "green");
  const passing = result.checks.filter((c) => c.status === "green");
  return (
    <div className="max-w-2xl mx-auto">
      <p className="text-sm text-muted-foreground break-all mb-6">
        URL analysée : {result.url}
      </p>

      <HumanVsAi
        screenshotUrl={result.screenshotUrl}
        rawHtmlPreview={result.rawHtmlPreview}
        url={result.url}
      />

      <div className="text-center my-8">
        <p
          className={`text-7xl font-bold font-display text-display ${scoreColorClass}`}
        >
          {result.score}
          <span className="text-2xl text-muted-foreground">/100</span>
        </p>
        <p className="text-lg text-foreground mt-2">{result.verdict}</p>
        {result.capped && result.capReason && (
          <div className="mt-3 inline-block rounded-full bg-destructive/10 px-4 py-1.5 text-sm text-destructive">
            {result.capReason}
          </div>
        )}
      </div>

<div className="frosted-surface rounded-xl p-6 mb-8 elevated-card">
        <p className="text-foreground/80 leading-relaxed whitespace-pre-line">{stripMarkdown(result.synthesis)}</p>
      </div>

      {result.actionPlan && result.actionPlan.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-display font-semibold text-foreground mb-4">
            Vos {result.actionPlan.length} actions prioritaires
          </h2>
          <div className="space-y-3">
            {result.actionPlan.map((action, i) => (
              <div key={i} className="frosted-surface rounded-xl p-4 flex items-start gap-3">
                <span className="text-lg font-bold text-primary">{action.priority}</span>
                <div>
                  <p className="font-semibold text-foreground">{action.title}</p>
                  <p className="text-sm text-muted-foreground">{action.reason}</p>
                  <span className="text-xs text-primary font-medium">{action.impact}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <CategoryScoresBar categoryScores={result.categoryScores} />

      {toFix.length > 0 && (
        <>
          <h2 className="text-xl font-display font-semibold text-foreground mb-4">
            À corriger ({toFix.length})
          </h2>
          <div className="space-y-3">
            {toFix.map((check, i) => (
              <ResultCard key={i} check={check} />
            ))}
          </div>
        </>
      )}

      {passing.length > 0 && (
        <details className="mt-6">
          <summary className="text-lg font-display font-semibold text-foreground cursor-pointer mb-4">
            Déjà en place ({passing.length})
          </summary>
          <div className="space-y-3">
            {passing.map((check, i) => (
              <ResultCard key={i} check={check} />
            ))}
          </div>
        </details>
      )}

      <CtaPixweb />

      <div className="text-center mt-8 mb-12">
        <button
          onClick={onReset}
          className="px-6 py-3 rounded-lg border border-border text-foreground font-medium hover:bg-secondary transition-colors"
        >
          Analyser un autre site
        </button>
      </div>
    </div>
  );
}

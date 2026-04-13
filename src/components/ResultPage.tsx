import type { AnalysisResult } from "@/lib/types";
import { ResultCard } from "./ResultCard";
import { CategoryScoresBar } from "./CategoryScoresBar";
import { CtaPixweb } from "./CtaPixweb";

interface ResultPageProps {
  result: AnalysisResult;
  onReset: () => void;
}

export function ResultPage({ result, onReset }: ResultPageProps) {
  const scoreColorClass = result.capped ? "text-destructive" : "text-primary";
  return (
    <div className="max-w-2xl mx-auto">
      <p className="text-sm text-muted-foreground break-all mb-6">
        URL analysée : {result.url}
      </p>

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
        <p className="italic text-muted-foreground leading-relaxed">{result.synthesis}</p>
      </div>

      <CategoryScoresBar categoryScores={result.categoryScores} />

      <h2 className="text-xl font-display font-semibold text-foreground mb-4">
        Détail des checks
      </h2>
      <div className="space-y-3">
        {result.checks.map((check, i) => (
          <ResultCard key={i} check={check} />
        ))}
      </div>

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

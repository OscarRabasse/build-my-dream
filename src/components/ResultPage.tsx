import type { AnalysisResult } from "@/lib/types";
import { ResultCard } from "./ResultCard";
import { CtaPixweb } from "./CtaPixweb";

interface ResultPageProps {
  result: AnalysisResult;
  onReset: () => void;
}

export function ResultPage({ result, onReset }: ResultPageProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <p className="text-sm text-muted-foreground break-all mb-6">
        URL analysée : {result.url}
      </p>

      <div className="text-center my-8">
        <p className="text-7xl font-bold font-display text-display text-primary">
          {result.score}
          <span className="text-2xl text-muted-foreground">/100</span>
        </p>
        <p className="text-lg text-foreground mt-2">{result.verdict}</p>
      </div>

      <div className="frosted-surface rounded-xl p-6 mb-8 elevated-card">
        <p className="italic text-muted-foreground leading-relaxed">{result.synthesis}</p>
      </div>

      <h2 className="text-xl font-display font-semibold text-foreground mb-4">
        Détail des 5 checks
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

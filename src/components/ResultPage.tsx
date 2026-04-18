import type { AnalysisResult } from "@/lib/types";
import { ResultCard } from "./ResultCard";
import { CategoryScoresBar } from "./CategoryScoresBar";
import { CtaPixweb } from "./CtaPixweb";
import { HumanVsAi } from "./HumanVsAi";
import { DiagnosticPanel } from "./DiagnosticPanel";
import { RichActionCard } from "./RichActionCard";
import { LeadGenCta } from "./LeadGenCta";

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

const NAV_ITEMS = [
  { href: "#score", label: "Score" },
  { href: "#diagnostic", label: "Diagnostic" },
  { href: "#actions", label: "Actions" },
  { href: "#ai-reading", label: "Ce que l'IA lit" },
  { href: "#detail", label: "Détail" },
];

interface ResultPageProps {
  result: AnalysisResult;
  onReset: () => void;
}

export function ResultPage({ result, onReset }: ResultPageProps) {
  const scoreColorClass = result.capped ? "text-destructive" : "text-primary";
  const toFix = result.checks.filter((c) => c.status !== "green");
  const passing = result.checks.filter((c) => c.status === "green");
  const hasActions =
    (result.richActionPlan && result.richActionPlan.length > 0) ||
    (result.actionPlan && result.actionPlan.length > 0);

  return (
    <div className="max-w-2xl mx-auto">
      <p className="text-sm text-muted-foreground break-all mb-4">
        URL analysée : {result.url}
      </p>

      {/* Sommaire ancré — sticky */}
      <nav className="sticky top-0 z-10 -mx-4 px-4 bg-background/80 backdrop-blur-sm border-b border-border/40 mb-8 overflow-x-auto scrollbar-none">
        <div className="flex gap-1 py-2 min-w-max">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="px-3 py-1 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors whitespace-nowrap"
            >
              {item.label}
            </a>
          ))}
        </div>
      </nav>

      {/* 1. Score */}
      <section id="score" className="text-center mb-10 scroll-mt-14">
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
      </section>

      {/* 2. Diagnostic */}
      <section id="diagnostic" className="scroll-mt-14">
        {result.richDiagnostic ? (
          <DiagnosticPanel diagnostic={result.richDiagnostic} />
        ) : (
          <div className="frosted-surface rounded-xl p-6 mb-8 elevated-card">
            <p className="text-foreground/80 leading-relaxed whitespace-pre-line">
              {stripMarkdown(result.synthesis)}
            </p>
          </div>
        )}
      </section>

      {/* 3. Plan d'action */}
      {hasActions && (
        <section id="actions" className="mb-8 scroll-mt-14">
          {result.richActionPlan && result.richActionPlan.length > 0 ? (
            <>
              <h2 className="text-xl font-display font-semibold text-foreground mb-4">
                Ton plan d'action ({result.richActionPlan.length}{" "}
                {result.richActionPlan.length > 1 ? "étapes" : "étape"})
              </h2>
              <div className="space-y-3">
                {result.richActionPlan.map((action, i) => (
                  <RichActionCard key={i} action={action} defaultOpen={i === 0} />
                ))}
              </div>
            </>
          ) : (
            result.actionPlan && result.actionPlan.length > 0 && (
              <>
                <h2 className="text-xl font-display font-semibold text-foreground mb-4">
                  Vos {result.actionPlan.length} actions prioritaires
                </h2>
                <div className="space-y-3">
                  {result.actionPlan.map((action, i) => (
                    <div
                      key={i}
                      className="frosted-surface rounded-xl p-4 flex items-start gap-3"
                    >
                      <span className="text-lg font-bold text-primary">
                        {action.priority}
                      </span>
                      <div>
                        <p className="font-semibold text-foreground">
                          {action.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {action.reason}
                        </p>
                        <span className="text-xs text-primary font-medium">
                          {action.impact}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )
          )}
        </section>
      )}

      {/* CTA lead-gen contextuel (score < 70) */}
      <LeadGenCta score={result.score} />

      {/* 4. Ce que l'IA lit */}
      <section id="ai-reading" className="scroll-mt-14">
        <HumanVsAi
          screenshotUrl={result.screenshotUrl}
          aiReadableText={result.aiReadableText}
          url={result.url}
        />
      </section>

      {/* 5. Détail des checks */}
      <section id="detail" className="scroll-mt-14">
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
      </section>

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

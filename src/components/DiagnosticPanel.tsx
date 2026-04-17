import { TrendingDown } from "lucide-react";
import type { RichDiagnostic } from "@/lib/types";

interface DiagnosticPanelProps {
  diagnostic: RichDiagnostic;
}

export function DiagnosticPanel({ diagnostic }: DiagnosticPanelProps) {
  const { headline, paragraph, businessImpact } = diagnostic;

  return (
    <section
      aria-labelledby="diagnostic-headline"
      className="frosted-surface elevated-card rounded-xl p-6 md:p-8 mb-8"
    >
      {headline && (
        <h2
          id="diagnostic-headline"
          className="text-2xl md:text-3xl font-display font-semibold text-foreground leading-tight mb-4"
        >
          {headline}
        </h2>
      )}

      {paragraph && (
        <p className="text-foreground/85 leading-relaxed whitespace-pre-line">
          {paragraph}
        </p>
      )}

      {businessImpact && (
        <div className="mt-6 rounded-lg border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
          <TrendingDown
            className="h-5 w-5 text-primary shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div>
            <p className="text-xs uppercase tracking-wider font-semibold text-primary mb-1">
              Impact business
            </p>
            <p className="text-sm text-foreground/90 leading-relaxed">
              {businessImpact}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

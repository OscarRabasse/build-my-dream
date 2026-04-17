import type { CheckResult, Severity } from "@/lib/types";

const STATUS_ICON: Record<string, string> = {
  green: "🟢",
  orange: "🟠",
  red: "🔴",
};

const SEVERITY_LABEL: Record<Severity, string> = {
  critical: "Critique",
  high: "Élevée",
  medium: "Moyenne",
  low: "Faible",
};

const SEVERITY_CLASS: Record<Severity, string> = {
  critical: "bg-destructive/15 text-destructive",
  high: "bg-orange-500/15 text-orange-600",
  medium: "bg-yellow-500/15 text-yellow-700",
  low: "bg-muted text-muted-foreground",
};

export function ResultCard({ check }: { check: CheckResult }) {
  const showSnippet = check.codeSnippet && check.status !== "green";
  return (
    <div className="frosted-surface rounded-xl p-5 blue-glow-ring">
      <div className="flex items-center gap-2 flex-wrap">
        <p className="font-semibold text-foreground">
          {STATUS_ICON[check.status]} {check.name}
        </p>
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full ${SEVERITY_CLASS[check.severity]}`}
        >
          {SEVERITY_LABEL[check.severity]}
        </span>
        <span className="text-xs text-muted-foreground ml-auto">
          {check.points}/{check.maxPoints} pts
          {check.potentialScoreGain != null && check.potentialScoreGain > 0 && (
            <span className="text-xs text-primary/70 ml-1">
              (+{check.potentialScoreGain} pts si corrigé)
            </span>
          )}
        </span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{check.explanation}</p>
      {check.status !== "green" && check.whyItMatters && (
        <p className="mt-1.5 text-xs text-muted-foreground italic">
          Pourquoi c'est important pour l'IA : {check.whyItMatters}
        </p>
      )}
      {check.status !== "green" && (
        <p className="mt-1 text-sm italic text-primary/80">💡 {check.fix}</p>
      )}
      {check.findings && check.findings.length > 0 && (
        <details className="mt-2">
          <summary className="text-xs text-muted-foreground cursor-pointer">
            Voir le détail
          </summary>
          <ul className="mt-1 space-y-0.5 text-xs">
            {check.findings.map((f, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span>{f.found ? "✓" : "✗"}</span>
                <span className={f.found ? "text-foreground/70" : "text-destructive/80"}>
                  {f.label}
                  {f.detail && <span className="text-muted-foreground ml-1">— {f.detail}</span>}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
      {showSnippet && (
        <pre className="mt-2 overflow-x-auto rounded bg-muted p-3 text-xs font-mono text-foreground">
          {check.codeSnippet}
        </pre>
      )}
    </div>
  );
}

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
        </span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{check.explanation}</p>
      {check.status !== "green" && (
        <p className="mt-1 text-sm italic text-primary/80">💡 {check.fix}</p>
      )}
      {showSnippet && (
        <pre className="mt-2 overflow-x-auto rounded bg-muted p-3 text-xs font-mono text-foreground">
          {check.codeSnippet}
        </pre>
      )}
    </div>
  );
}

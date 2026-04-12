import type { CheckResult } from "@/lib/types";

const STATUS_ICON: Record<string, string> = {
  green: "🟢",
  orange: "🟠",
  red: "🔴",
};

export function ResultCard({ check }: { check: CheckResult }) {
  return (
    <div className="frosted-surface rounded-xl p-5 blue-glow-ring">
      <p className="font-semibold text-foreground">
        {STATUS_ICON[check.status]} {check.name}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">{check.explanation}</p>
      {check.status !== "green" && (
        <p className="mt-1 text-sm italic text-primary/80">
          💡 {check.fix}
        </p>
      )}
    </div>
  );
}

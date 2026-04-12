import type { CheckResult } from "@/lib/types";

const STATUS_ICON: Record<string, string> = {
  green: "🟢",
  orange: "🟠",
  red: "🔴",
};

export function ResultCard({ check }: { check: CheckResult }) {
  return (
    <div
      style={{
        border: "1px solid #ccc",
        padding: 16,
        marginBottom: 12,
      }}
    >
      <p style={{ margin: 0, fontWeight: "bold" }}>
        {STATUS_ICON[check.status]} {check.name}
      </p>
      <p style={{ margin: "8px 0 4px", fontSize: 14 }}>{check.explanation}</p>
      {check.status !== "green" && (
        <p style={{ margin: 0, fontSize: 13, fontStyle: "italic" }}>
          💡 {check.fix}
        </p>
      )}
    </div>
  );
}

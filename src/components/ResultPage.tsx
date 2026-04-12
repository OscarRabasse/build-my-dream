import type { AnalysisResult } from "@/lib/types";
import { ResultCard } from "./ResultCard";
import { CtaPixweb } from "./CtaPixweb";

interface ResultPageProps {
  result: AnalysisResult;
  onReset: () => void;
}

export function ResultPage({ result, onReset }: ResultPageProps) {
  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <p style={{ fontSize: 13, wordBreak: "break-all" }}>
        URL analysée : {result.url}
      </p>

      <div style={{ textAlign: "center", margin: "24px 0" }}>
        <p style={{ fontSize: 64, fontWeight: "bold", margin: 0 }}>
          {result.score}
          <span style={{ fontSize: 24 }}>/100</span>
        </p>
        <p style={{ fontSize: 18, marginTop: 4 }}>{result.verdict}</p>
      </div>

      <div
        style={{
          border: "1px solid #ccc",
          padding: 16,
          marginBottom: 24,
          fontStyle: "italic",
        }}
      >
        {result.synthesis}
      </div>

      <h2 style={{ fontSize: 20, marginBottom: 12 }}>Détail des 5 checks</h2>
      {result.checks.map((check, i) => (
        <ResultCard key={i} check={check} />
      ))}

      <CtaPixweb />

      <div style={{ textAlign: "center", marginTop: 24 }}>
        <button
          onClick={onReset}
          style={{
            padding: "10px 24px",
            fontSize: 16,
            cursor: "pointer",
            border: "1px solid #333",
            background: "#eee",
          }}
        >
          Analyser un autre site
        </button>
      </div>
    </div>
  );
}

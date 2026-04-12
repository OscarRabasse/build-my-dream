import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { analyzeUrl } from "@/utils/analyze.functions";
import type { AnalysisResult } from "@/lib/types";
import { UrlForm } from "@/components/UrlForm";
import { LoadingState } from "@/components/LoadingState";
import { ResultPage } from "@/components/ResultPage";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Votre site parle-t-il IA ? — Test de lisibilité IA" },
      {
        name: "description",
        content:
          "Testez si votre site est lisible par les crawlers IA (ChatGPT, Perplexity, Claude, Gemini). Score sur 100 + diagnostic en 30 secondes.",
      },
    ],
  }),
});

type AppState = "idle" | "loading" | "result" | "error";

function Index() {
  const [state, setState] = useState<AppState>("idle");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const analyze = useServerFn(analyzeUrl);

  async function handleSubmit(url: string) {
    setState("loading");
    setErrorMsg("");
    try {
      const res = await analyze({ data: { url } });
      setResult(res);
      setState("result");
    } catch (e) {
      console.error(e);
      setErrorMsg(
        e instanceof Error
          ? e.message
          : "L'analyse a pris trop de temps. Réessayez dans un instant."
      );
      setState("error");
    }
  }

  function handleReset() {
    setState("idle");
    setResult(null);
    setErrorMsg("");
  }

  return (
    <div style={{ padding: "40px 16px", fontFamily: "sans-serif" }}>
      {(state === "idle" || state === "error") && (
        <>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <h1 style={{ fontSize: 28, marginBottom: 8 }}>
              Votre site est-il lisible par les IA ?
            </h1>
            <p style={{ fontSize: 16, maxWidth: 520, margin: "0 auto" }}>
              ChatGPT, Perplexity, Claude parcourent le web différemment de
              Google. La plupart des sites sont invisibles pour eux.
            </p>
          </div>
          <UrlForm onSubmit={handleSubmit} />
          {state === "error" && (
            <p
              style={{
                color: "red",
                textAlign: "center",
                marginTop: 16,
                maxWidth: 500,
                margin: "16px auto 0",
              }}
            >
              {errorMsg}
            </p>
          )}
        </>
      )}

      {state === "loading" && <LoadingState />}

      {state === "result" && result && (
        <ResultPage result={result} onReset={handleReset} />
      )}
    </div>
  );
}

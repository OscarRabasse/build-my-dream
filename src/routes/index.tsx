import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { analyzeUrl } from "@/utils/analyze.functions";
import type { AnalysisResult } from "@/lib/types";
import { UrlForm } from "@/components/UrlForm";
import { LoadingState } from "@/components/LoadingState";
import { ResultPage } from "@/components/ResultPage";
import AsciiBg from "@/components/AsciiBg";
import { LaserFlow } from "@/components/LaserFlow";

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
    <div className="relative min-h-screen overflow-hidden">
      {/* Background layers */}
      <AsciiBg />
      <div className="fixed inset-0 z-[1] pointer-events-none bg-[radial-gradient(ellipse_at_center,_transparent_0%,_oklch(0_0_0/0.6)_50%,_oklch(0_0_0/0.95)_100%)]" />
      <div className="fixed inset-0 z-[2] pointer-events-none flex items-center justify-center" style={{ top: '-10%' }}>
        <LaserFlow
          color="#0099ff"
          style={{ width: '100%', height: '80vh' }}
          verticalSizing={2.0}
          horizontalSizing={0.5}
          fogIntensity={0.45}
          wispDensity={1}
          wispIntensity={5}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 px-4 py-16 md:py-24">
        {(state === "idle" || state === "error") && (
          <>
            <div className="text-center mb-12 max-w-2xl mx-auto">
              <h1 className="font-display text-display text-4xl md:text-6xl mb-4 text-foreground">
                Votre site est-il lisible par les IA ?
              </h1>
              <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
                ChatGPT, Perplexity, Claude parcourent le web différemment de
                Google. La plupart des sites sont invisibles pour eux.
              </p>
            </div>
            <UrlForm onSubmit={handleSubmit} />
            {state === "error" && (
              <p className="text-destructive text-center mt-4 max-w-md mx-auto text-sm">
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
    </div>
  );
}

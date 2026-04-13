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
    <div className="relative min-h-screen overflow-hidden py-12 md:py-20 px-4">
      {/* Background layers */}
      <AsciiBg />
      <div
        className="fixed inset-0 z-[1] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 30% 30%, oklch(0 0 0 / 0.85) 0%, oklch(0 0 0 / 0.5) 40%, oklch(0 0 0 / 0) 70%)",
        }}
      />

      {/* Content */}
      {(state === "idle" || state === "error") && (
        <>
          <div className="relative z-10 max-w-4xl mx-auto mb-12 md:mb-16">
            <h1 className="font-display text-display text-4xl md:text-6xl lg:text-7xl mb-5 text-foreground">
              Votre site est-il lisible par les IA ?
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
              ChatGPT, Perplexity, Claude parcourent le web différemment de
              Google. La plupart des sites sont invisibles pour eux.
            </p>
          </div>

          <div className="relative" style={{ minHeight: '600px' }}>
            <div
              className="absolute pointer-events-none"
              style={{ zIndex: 0, top: '-465px', left: 0, right: 0, bottom: 0 }}
            >
              <LaserFlow
                color="#0099ff"
                style={{ width: '100%', height: '100%' }}
                verticalSizing={2.0}
                horizontalSizing={0.5}
                fogIntensity={0.45}
                wispDensity={1}
                wispIntensity={5}
              />
            </div>
            <div className="relative z-[5] max-w-4xl mx-auto">
              <UrlForm onSubmit={handleSubmit} />
            </div>
          </div>

          {state === "error" && (
            <p className="text-destructive mt-4 text-sm max-w-4xl mx-auto">
              {errorMsg}
            </p>
          )}
        </>
      )}

      {state === "loading" && (
        <div className="relative z-10">
          <LoadingState />
        </div>
      )}

      {state === "result" && result && (
        <div className="relative z-10">
          <ResultPage result={result} onReset={handleReset} />
        </div>
      )}
    </div>
  );
}

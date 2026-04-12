import { useEffect, useState } from "react";

const STEPS = [
  "Récupération de votre page…",
  "Analyse de la structure HTML…",
  "Vérification du fichier llms.txt…",
  "Analyse IA en cours…",
];

export function LoadingState() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => (s < STEPS.length - 1 ? s + 1 : s));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-md mx-auto mt-16 text-center">
      <p className="text-xl font-display text-foreground mb-8">Analyse en cours…</p>
      <ul className="space-y-3 text-left">
        {STEPS.map((label, i) => (
          <li
            key={i}
            className={`py-1 transition-opacity duration-300 ${
              i <= step ? "opacity-100" : "opacity-30"
            } ${i === step ? "font-semibold text-primary" : "text-muted-foreground"}`}
          >
            {i < step ? "✓" : i === step ? "⏳" : "○"} {label}
          </li>
        ))}
      </ul>
    </div>
  );
}

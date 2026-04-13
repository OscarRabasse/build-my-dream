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
    <div className="max-w-md mx-auto mt-16">
      <div className="frosted-surface rounded-xl p-8">
        <p className="text-xl font-display text-foreground mb-8 text-center">Analyse en cours…</p>
        <ul className="space-y-4 text-left">
          {STEPS.map((label, i) => (
            <li
              key={i}
              className={`py-1 transition-opacity duration-500 ${
                i <= step ? "opacity-100" : "opacity-40"
              } ${i === step ? "font-semibold text-primary" : i < step ? "text-foreground" : "text-muted-foreground"}`}
            >
              {i < step ? "✓" : i === step ? "⏳" : "○"} {label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

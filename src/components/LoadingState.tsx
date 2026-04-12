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
    <div style={{ maxWidth: 400, margin: "40px auto", textAlign: "center" }}>
      <p style={{ fontSize: 18, marginBottom: 24 }}>Analyse en cours…</p>
      <ul style={{ listStyle: "none", padding: 0, textAlign: "left" }}>
        {STEPS.map((label, i) => (
          <li
            key={i}
            style={{
              padding: "6px 0",
              opacity: i <= step ? 1 : 0.3,
              fontWeight: i === step ? "bold" : "normal",
            }}
          >
            {i < step ? "✓" : i === step ? "⏳" : "○"} {label}
          </li>
        ))}
      </ul>
    </div>
  );
}

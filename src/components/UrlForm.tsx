import { useState } from "react";
import ElectricBorder from "./ElectricBorder";

interface UrlFormProps {
  onSubmit: (url: string) => void;
  disabled?: boolean;
}

export function UrlForm({ onSubmit, disabled }: UrlFormProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    let normalized = url.trim();
    if (!normalized) {
      setError("Veuillez entrer une URL.");
      return;
    }
    if (!/^https?:\/\//i.test(normalized)) {
      normalized = "https://" + normalized;
    }
    try {
      new URL(normalized);
    } catch {
      setError("URL invalide. Exemple : https://monsite.fr");
      return;
    }
    onSubmit(normalized);
  }

  return (
    <div className="max-w-4xl">
      <ElectricBorder color="#0099ff" borderRadius={16} chaos={0.08}>
        <form onSubmit={handleSubmit} className="frosted-surface elevated-card rounded-2xl p-8 md:p-10">
          <div className="flex gap-3">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://monsite.fr"
              disabled={disabled}
              className="flex-1 px-5 py-4 rounded-lg bg-secondary text-foreground placeholder:text-muted-foreground border border-border focus:outline-none focus:ring-2 focus:ring-ring text-lg"
            />
            <button
              type="submit"
              disabled={disabled}
              className="px-8 py-4 rounded-lg bg-foreground text-background font-medium text-lg hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              Analyser
            </button>
          </div>
          {error && (
            <p className="text-destructive mt-3 text-sm">{error}</p>
          )}
        </form>
      </ElectricBorder>
    </div>
  );
}

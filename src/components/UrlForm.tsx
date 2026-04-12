import { useState } from "react";

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
    <form onSubmit={handleSubmit} style={{ maxWidth: 500, margin: "0 auto" }}>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://monsite.fr"
          disabled={disabled}
          style={{
            flex: 1,
            padding: "8px 12px",
            fontSize: 16,
            border: "1px solid #999",
          }}
        />
        <button
          type="submit"
          disabled={disabled}
          style={{
            padding: "8px 20px",
            fontSize: 16,
            cursor: disabled ? "not-allowed" : "pointer",
            border: "1px solid #333",
            background: "#eee",
          }}
        >
          Analyser mon site
        </button>
      </div>
      {error && (
        <p style={{ color: "red", marginTop: 8, fontSize: 14 }}>{error}</p>
      )}
    </form>
  );
}

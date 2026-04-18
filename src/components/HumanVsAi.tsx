import { useState } from "react";
import { Eye } from "lucide-react";
import { AiReadingPanel } from "./AiReadingPanel";

interface HumanVsAiProps {
  screenshotUrl?: string;
  aiReadableText?: string;
  url: string;
}

export function HumanVsAi({ screenshotUrl, aiReadableText, url }: HumanVsAiProps) {
  const [screenshotError, setScreenshotError] = useState(false);

  if (!screenshotUrl && !aiReadableText) return null;

  return (
    <div className="mb-8">
      <h2 className="text-xl font-display font-semibold text-foreground mb-4">
        Ce que voient les humains vs les IA
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Panneau gauche : humain */}
        <div className="frosted-surface rounded-xl p-4 elevated-card">
          <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground mb-3">
            <Eye size={14} />
            Ce qu'un humain voit
          </p>
          {screenshotUrl && !screenshotError ? (
            <div className="overflow-hidden rounded-lg border border-border/50 h-64">
              <img
                src={screenshotUrl}
                alt={`Capture d'écran de ${url}`}
                loading="eager"
                className="w-full h-full object-cover object-top"
                onError={() => setScreenshotError(true)}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 rounded-lg bg-muted/50 text-sm text-muted-foreground text-center px-4">
              Capture d'écran indisponible pour ce site
            </div>
          )}
        </div>

        {/* Panneau droit : IA */}
        <div className="frosted-surface rounded-xl p-4 elevated-card">
          {aiReadableText ? (
            <AiReadingPanel text={aiReadableText} />
          ) : (
            <div className="flex items-center justify-center h-64 rounded-lg bg-muted/50 text-sm text-muted-foreground text-center px-4">
              Aperçu indisponible
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

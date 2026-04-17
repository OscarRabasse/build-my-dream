import { useState } from "react";
import { Eye, Bot } from "lucide-react";

interface HumanVsAiProps {
  screenshotUrl?: string;
  rawHtmlPreview?: string;
  url: string;
}

export function HumanVsAi({ screenshotUrl, rawHtmlPreview, url }: HumanVsAiProps) {
  const [screenshotError, setScreenshotError] = useState(false);

  if (!screenshotUrl && !rawHtmlPreview) return null;

  const isTruncated = rawHtmlPreview && rawHtmlPreview.length >= 3500;

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
          <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground mb-3">
            <Bot size={14} />
            Ce qu'une IA voit
          </p>
          {rawHtmlPreview ? (
            <div className="relative h-64">
              <pre className="h-full overflow-y-auto rounded-lg bg-muted p-3 text-xs font-mono text-foreground/80 leading-relaxed whitespace-pre-wrap break-all">
                {rawHtmlPreview}
              </pre>
              {isTruncated && (
                <div className="absolute bottom-0 left-0 right-0 h-12 rounded-b-lg bg-gradient-to-t from-muted to-transparent pointer-events-none" />
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 rounded-lg bg-muted/50 text-sm text-muted-foreground text-center px-4">
              Aperçu du code source indisponible
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

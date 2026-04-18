import { Bot } from "lucide-react";

interface AiReadingPanelProps {
  text: string;
}

export function AiReadingPanel({ text }: AiReadingPanelProps) {
  const lines = text.split("\n");

  return (
    <>
      <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground mb-1">
        <Bot size={14} />
        Ce qu'une IA voit
      </p>
      <p className="text-xs text-muted-foreground/60 italic mb-3">
        Ce que ChatGPT, Claude ou Perplexity lit vraiment de ton site
      </p>
      <div className="relative h-64">
        <div className="h-full overflow-y-auto rounded-lg bg-muted/30 border border-border/30 p-3 space-y-1">
          {lines.map((line, i) => {
            if (line.startsWith("# ")) {
              return (
                <p key={i} className="font-bold text-foreground text-sm leading-snug">
                  {line.slice(2)}
                </p>
              );
            }
            if (line.startsWith("## ")) {
              return (
                <p key={i} className="font-semibold text-foreground text-sm leading-snug mt-2">
                  {line.slice(3)}
                </p>
              );
            }
            if (line.startsWith("### ")) {
              return (
                <p key={i} className="font-medium text-foreground/80 text-xs leading-snug mt-1.5">
                  {line.slice(4)}
                </p>
              );
            }
            if (line.startsWith("#### ")) {
              return (
                <p key={i} className="font-medium text-foreground/70 text-xs leading-snug">
                  {line.slice(5)}
                </p>
              );
            }
            if (line.trim() === "") {
              return <div key={i} className="h-1" />;
            }
            return (
              <p key={i} className="text-xs text-foreground/60 leading-relaxed">
                {line}
              </p>
            );
          })}
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-10 rounded-b-lg bg-gradient-to-t from-muted/30 to-transparent pointer-events-none" />
      </div>
    </>
  );
}

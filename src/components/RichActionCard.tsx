import { useState } from "react";
import { ChevronDown, Target } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import type { RichActionItem } from "@/lib/types";

interface RichActionCardProps {
  action: RichActionItem;
  defaultOpen?: boolean;
}

export function RichActionCard({ action, defaultOpen = false }: RichActionCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  const toggleItem = (i: number) =>
    setChecked((prev) => ({ ...prev, [i]: !prev[i] }));

  const checkedCount = Object.values(checked).filter(Boolean).length;
  const total = action.checklist.length;

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="frosted-surface elevated-card rounded-xl overflow-hidden"
    >
      <CollapsibleTrigger className="w-full text-left p-5 md:p-6 flex items-start gap-4 hover:bg-foreground/[0.02] transition-colors">
        <span
          aria-hidden="true"
          className="shrink-0 h-9 w-9 rounded-full bg-primary/10 text-primary font-bold grid place-content-center font-display"
        >
          {action.priority}
        </span>

        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-foreground text-lg leading-tight">
            {action.title}
          </h3>
          {action.estimatedGain && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 rounded-full px-2.5 py-1">
              <Target className="h-3 w-3" aria-hidden="true" />
              {action.estimatedGain}
            </p>
          )}
        </div>

        <ChevronDown
          className={`h-5 w-5 text-muted-foreground shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </CollapsibleTrigger>

      <CollapsibleContent className="px-5 md:px-6 pb-6 space-y-5 border-t border-border/40 pt-5">
        {action.problem && (
          <div>
            <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-1.5">
              Le problème
            </p>
            <p className="text-sm text-foreground/85 leading-relaxed">{action.problem}</p>
          </div>
        )}

        {action.fix && (
          <div>
            <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-1.5">
              Comment corriger
            </p>
            <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-line">
              {action.fix}
            </p>
          </div>
        )}

        {action.beforeAfterExample && (
          <div>
            <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-1.5">
              Exemple concret
            </p>
            <div className="rounded-lg bg-foreground/[0.04] border border-border/40 p-3 text-sm text-foreground/85 leading-relaxed whitespace-pre-line font-mono">
              {action.beforeAfterExample}
            </div>
          </div>
        )}

        {total > 0 && (
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                Checklist
              </p>
              <p className="text-xs text-muted-foreground">
                {checkedCount}/{total}
              </p>
            </div>
            <ul className="space-y-2">
              {action.checklist.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Checkbox
                    id={`action-${action.priority}-item-${i}`}
                    checked={!!checked[i]}
                    onCheckedChange={() => toggleItem(i)}
                    className="mt-0.5"
                  />
                  <label
                    htmlFor={`action-${action.priority}-item-${i}`}
                    className={`text-sm leading-relaxed cursor-pointer ${
                      checked[i]
                        ? "text-muted-foreground line-through"
                        : "text-foreground/85"
                    }`}
                  >
                    {item}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )}

        {(action.linkedCheckNames.length > 0 || action.impactPoints > 0) && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/40">
            {action.linkedCheckNames.map((name, i) => (
              <span
                key={i}
                className="text-xs text-muted-foreground bg-foreground/[0.05] rounded-full px-2.5 py-1"
              >
                {name}
              </span>
            ))}
            {action.impactPoints > 0 && (
              <span className="text-xs font-medium text-primary ml-auto">
                +{action.impactPoints} points récupérables
              </span>
            )}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

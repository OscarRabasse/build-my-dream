import type { CategoryScore } from "@/lib/types";

interface CategoryScoresBarProps {
  categoryScores: CategoryScore[];
}

export function CategoryScoresBar({ categoryScores }: CategoryScoresBarProps) {
  return (
    <div className="frosted-surface rounded-xl p-5 mb-8 elevated-card">
      <p className="text-sm font-medium text-foreground mb-3">
        Score par catégorie
      </p>
      <div className="space-y-3">
        {categoryScores.map((c) => (
          <div key={c.category} className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground w-24 shrink-0">
              {c.label}
            </span>
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${c.percentage}%` }}
              />
            </div>
            <span className="text-sm font-medium text-foreground w-12 text-right shrink-0">
              {c.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

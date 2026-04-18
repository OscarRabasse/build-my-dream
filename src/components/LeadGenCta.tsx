interface LeadGenCtaProps {
  score: number;
}

export function LeadGenCta({ score }: LeadGenCtaProps) {
  if (score >= 70) return null;

  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 mb-8">
      <p className="text-xs font-medium text-destructive/80 uppercase tracking-wide mb-2">
        Score {score}/100 — action recommandée
      </p>
      <p className="text-lg font-display font-semibold text-foreground mb-1">
        Ton site perd des leads IA en ce moment.
      </p>
      <p className="text-sm text-muted-foreground mb-5">
        30 min avec Pixweb pour faire le point et construire un plan de remise à
        niveau concret — sans engagement.
      </p>
      <a
        href="https://pixweb.fr"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        Prendre contact avec Pixweb
      </a>
    </div>
  );
}

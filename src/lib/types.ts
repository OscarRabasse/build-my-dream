export type CheckStatus = "green" | "orange" | "red";
export type Category = "access" | "structure" | "content" | "signals";
export type Severity = "critical" | "high" | "medium" | "low";

export interface CheckFinding {
  label: string;
  found: boolean;
  detail?: string;
}

export interface ActionItem {
  priority: number;
  title: string;
  reason: string;
  impact: string;
  checkName: string;
}

export interface RichDiagnostic {
  headline: string;
  paragraph: string;
  businessImpact: string;
}

export interface RichActionItem {
  priority: number;
  title: string;
  problem: string;
  fix: string;
  beforeAfterExample: string;
  estimatedGain: string;
  checklist: string[];
  linkedCheckNames: string[];
  impactPoints: number;
}

export interface CheckResult {
  name: string;
  status: CheckStatus;
  explanation: string;
  fix: string;
  category: Category;
  severity: Severity;
  points: number;
  maxPoints: number;
  codeSnippet?: string;
  findings?: CheckFinding[];
  whyItMatters?: string;
  potentialScoreGain?: number;
  isBonus?: boolean;
  businessImpact?: string;
  goodExample?: { label: string; url: string };
  templateLink?: string;
}

export interface CategoryScore {
  category: Category;
  label: string;
  earned: number;
  max: number;
  percentage: number;
}

export interface AnalysisResult {
  url: string;
  score: number;
  rawScore: number;
  capped: boolean;
  capReason?: string;
  verdict: string;
  synthesis: string;
  checks: CheckResult[];
  categoryScores: CategoryScore[];
  actionPlan?: ActionItem[];
  richDiagnostic?: RichDiagnostic;
  richActionPlan?: RichActionItem[];
  nextSteps?: string;
  siteTitle?: string;
  siteDescription?: string;
  screenshotUrl?: string;
  rawHtmlPreview?: string;
  aiReadableText?: string;
}

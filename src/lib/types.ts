export type CheckStatus = "green" | "orange" | "red";
export type Category = "access" | "structure" | "content" | "signals";
export type Severity = "critical" | "high" | "medium" | "low";

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
}

export type CheckStatus = "green" | "orange" | "red";

export interface CheckResult {
  name: string;
  status: CheckStatus;
  explanation: string;
  fix: string;
}

export interface AnalysisResult {
  url: string;
  score: number;
  verdict: string;
  synthesis: string;
  checks: CheckResult[];
}

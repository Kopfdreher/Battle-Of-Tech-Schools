export type CheckStatus = "PASS" | "WARNING" | "FAIL";
export type OverallStatus = "verified" | "warning" | "fail";

export type AuditDimension = {
  status: CheckStatus;
  label: string;
  detail: string;
};

export type MathAudit = AuditDimension & {
  gross: number;
  deductions: number;
  net: number;
  expectedNet: number | null;
};

export type IdentityAudit = AuditDimension & {
  applicantName: string;
  documentName: string | null;
};

export type RedactedPreview = {
  employer: string;
  period: string;
  gross: number;
  deductions: number;
  highlightedNet: number;
  contractHint: string;
};

export type AuthenticityReport = {
  applicantId?: string;
  applicantName: string;
  documentLabel: string;
  overallStatus: OverallStatus;
  trustIndex: number;
  producer: string;
  source: string;
  metadataCheck: AuditDimension;
  mathAudit: MathAudit;
  identityCheck: IdentityAudit;
  layoutCheck: AuditDimension;
  flags: string[];
  redacted: RedactedPreview;
};

export type AuthenticityInput = {
  id?: string;
  applicantName: string;
  income: number | string;
  hasPermanentContract?: boolean;
};

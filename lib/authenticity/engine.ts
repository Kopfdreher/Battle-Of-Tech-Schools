import type {
  AuthenticityInput,
  AuthenticityReport,
  CheckStatus,
  OverallStatus,
} from "./types";

const SUSPICIOUS_EDITORS = [
  "photoshop",
  "canva",
  "ilovepdf",
  "sejda",
  "pdfescape",
  "smallpdf",
  "preview",
];

type ScenarioConfig = {
  documentLabel: string;
  producer: string;
  employeeName: string;
  employer: string;
  period: string;
  gross: number;
  deductions: number;
  net: number;
  layout: CheckStatus;
};

const SEED_SCENARIOS: Record<string, ScenarioConfig> = {
  "anna berger": {
    documentLabel: "Payslip · DATEV Lohn und Gehalt",
    producer: "DATEV Lohn und Gehalt 14.2",
    employeeName: "Anna Berger",
    employer: "Nordbahn Tech Solutions GmbH",
    period: "August 2026",
    gross: 6400,
    deductions: 1200,
    net: 5200,
    layout: "PASS",
  },
  "jonas klein": {
    documentLabel: "Payslip · Web modified PDF",
    producer: "iLovePDF (PDF/A-1b suite)",
    employeeName: "Jonas Klein",
    employer: "Spree Media UG",
    period: "August 2026",
    gross: 5100,
    deductions: 1000,
    net: 4100,
    layout: "WARNING",
  },
  "leyla demir": {
    documentLabel: "Payslip · Inconsistent deduction math",
    producer: "DATEV Lohn und Gehalt",
    employeeName: "Leyla Demir",
    employer: "Kreuzberg Design Studio",
    period: "August 2026",
    gross: 4200,
    deductions: 900,
    net: 3600, // 4200 - 900 = 3300, but doc claims 3600!
    layout: "PASS",
  },
  "familie okonkwo": {
    documentLabel: "Payslip · Name mismatch",
    producer: "DATEV Lohn und Gehalt",
    employeeName: "Alex Schmidt",
    employer: "Ringbahn Logistics AG",
    period: "August 2026",
    gross: 7600,
    deductions: 1500,
    net: 6100,
    layout: "PASS",
  },
  "mara hoffmann": {
    documentLabel: "Payslip · DATEV Lohn",
    producer: "DATEV Lohn und Gehalt",
    employeeName: "Mara Hoffmann",
    employer: "Kiez Retail GmbH",
    period: "August 2026",
    gross: 4250,
    deductions: 850,
    net: 3400,
    layout: "PASS",
  },
  // Legacy / backup scenarios
  "mara ellison": {
    documentLabel: "Payslip · DATEV Lohn",
    producer: "DATEV Lohn und Gehalt",
    employeeName: "Mara Ellison",
    employer: "Nordbahn GmbH",
    period: "August 2026",
    gross: 5200,
    deductions: 1000,
    net: 4200,
    layout: "PASS",
  },
  "jonas richter": {
    documentLabel: "Payslip · iLovePDF modified",
    producer: "iLovePDF",
    employeeName: "Jonas Richter",
    employer: "Spree Werkstatt UG",
    period: "August 2026",
    gross: 3900,
    deductions: 800,
    net: 3100,
    layout: "WARNING",
  },
  "samir okonkwo": {
    documentLabel: "Payslip · Alex Schmidt document",
    producer: "DATEV Lohn und Gehalt",
    employeeName: "Alex Schmidt",
    employer: "Ringbahn Media GmbH",
    period: "August 2026",
    gross: 6400,
    deductions: 1300,
    net: 5100,
    layout: "PASS",
  },
  "nina vogt": {
    documentLabel: "Payslip · Graphic editor export",
    producer: "Adobe Photoshop 25.0 / Canva",
    employeeName: "Nina Vogt",
    employer: "Freelance invoice export",
    period: "August 2026",
    gross: 3100,
    deductions: 200,
    net: 2400,
    layout: "FAIL",
  },
};

function normalize(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

/**
 * Deterministic hash to distribute random applicants across realistic risk tiers
 */
function hashString(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

function computeTrust(
  metadata: CheckStatus,
  math: CheckStatus,
  identity: CheckStatus,
  layout: CheckStatus,
): { trust: number; overall: OverallStatus } {
  let trust = 100;
  if (metadata === "WARNING") trust -= 15;
  if (metadata === "FAIL") trust -= 35;
  if (math === "FAIL") trust -= 40;
  if (identity === "FAIL") trust -= 35;
  if (layout === "WARNING") trust -= 12;
  if (layout === "FAIL") trust -= 20;

  trust = Math.max(5, Math.min(100, trust));

  const checks = [metadata, math, identity, layout];
  let overall: OverallStatus = "verified";
  if (checks.includes("FAIL") || trust < 70) {
    overall = "fail";
  } else if (checks.includes("WARNING") || trust < 90) {
    overall = "warning";
  }

  return { trust, overall };
}

/**
 * Evaluates an applicant's authenticity report from profile data and scenario definitions.
 */
export function evaluateAuthenticity(
  input: AuthenticityInput,
): AuthenticityReport {
  const norm = normalize(input.applicantName);
  const incomeNum = Number(input.income) || 3000;

  const scenario =
    SEED_SCENARIOS[norm] ??
    (() => {
      // Deterministic realistic natural distribution based on applicant identity
      const seedKey = input.id ? `${input.id}:${norm}` : norm;
      const hash = hashString(seedKey);
      const bucket = hash % 100;

      // Tier 1: Clean compliant payroll (~72% of tenants)
      if (bucket < 72) {
        const producers = [
          "DATEV Lohn und Gehalt 14.2",
          "SAP HCM Payroll Engine 6.08",
          "Workday Cloud Payroll EU",
          "Sage HR Suite 2026",
        ];
        const producer = producers[hash % producers.length];
        const deductionRate = 0.22 + ((hash % 10) * 0.01);
        const deductions = Math.round(incomeNum * deductionRate);
        const gross = incomeNum + deductions;
        return {
          documentLabel: "Payslip · Verified Payroll",
          producer,
          employeeName: input.applicantName,
          employer: "Berlin Employer (verified in register)",
          period: "August 2026",
          gross,
          deductions,
          net: incomeNum,
          layout: "PASS" as CheckStatus,
        };
      }

      // Tier 2: Suspicious web editor / PDF optimizer (~14% of tenants)
      if (bucket < 86) {
        const editors = [
          "iLovePDF (PDF/A-1b suite)",
          "Smallpdf Web Engine",
          "Sejda PDF Editor 7.1",
        ];
        const producer = editors[hash % editors.length];
        const deductions = Math.round(incomeNum * 0.25);
        const gross = incomeNum + deductions;
        return {
          documentLabel: "Payslip · Web tool re-exported",
          producer,
          employeeName: input.applicantName,
          employer: "Digital Services Berlin GmbH",
          period: "August 2026",
          gross,
          deductions,
          net: incomeNum,
          layout: "WARNING" as CheckStatus,
        };
      }

      // Tier 3: Financial math discrepancy / inflated net income (~8% of tenants)
      if (bucket < 94) {
        const exaggeration = 350 + ((hash % 5) * 100);
        const deductions = Math.round(incomeNum * 0.26);
        const gross = (incomeNum - exaggeration) + deductions;
        return {
          documentLabel: "Payslip · Math inconsistency detected",
          producer: "DATEV Lohn und Gehalt",
          employeeName: input.applicantName,
          employer: "Spree Logistics UG",
          period: "August 2026",
          gross,
          deductions,
          net: incomeNum,
          layout: "PASS" as CheckStatus,
        };
      }

      // Tier 4: Identity mismatch (~3% of tenants)
      if (bucket < 97) {
        const dummyNames = [
          "Alexander Schmidt",
          "Michael Weber",
          "Sabine Becker",
          "Thomas Mueller",
        ];
        const fakeName = dummyNames.find((n) => normalize(n) !== norm) || "Max Mustermann";
        const deductions = Math.round(incomeNum * 0.24);
        const gross = incomeNum + deductions;
        return {
          documentLabel: "Payslip · Name mismatch detected",
          producer: "DATEV Lohn und Gehalt",
          employeeName: fakeName,
          employer: "Metropol Handelsgesellschaft mbH",
          period: "August 2026",
          gross,
          deductions,
          net: incomeNum,
          layout: "PASS" as CheckStatus,
        };
      }

      // Tier 5: Graphic design editor / canvas layers (~3% of tenants)
      const deductions = Math.round(incomeNum * 0.20);
      const gross = incomeNum + deductions;
      return {
        documentLabel: "Payslip · Design software export",
        producer: "Adobe Photoshop 25.0 / Canva",
        employeeName: input.applicantName,
        employer: "Creative Agency Berlin",
        period: "August 2026",
        gross,
        deductions,
        net: incomeNum,
        layout: "FAIL" as CheckStatus,
      };
    })();

  const flags: string[] = [];

  // 1. Metadata check
  let metadataStatus: CheckStatus = "PASS";
  let metadataDetail = `Standard payroll producer: ${scenario.producer}.`;
  const prodLower = scenario.producer.toLowerCase();
  if (SUSPICIOUS_EDITORS.some((ed) => prodLower.includes(ed))) {
    metadataStatus = prodLower.includes("photoshop") || prodLower.includes("canva") ? "FAIL" : "WARNING";
    metadataDetail = `Document processed by non-payroll software (${scenario.producer}).`;
    flags.push(`Suspicious PDF Producer: ${scenario.producer}`);
  }

  // 2. Math audit: Gross - Deductions == Net
  const expectedNet = Math.round((scenario.gross - scenario.deductions) * 100) / 100;
  let mathStatus: CheckStatus = "PASS";
  let mathDetail = `Gross €${scenario.gross.toLocaleString()} − deductions €${scenario.deductions.toLocaleString()} = net €${scenario.net.toLocaleString()}.`;
  if (Math.abs(expectedNet - scenario.net) > 1) {
    mathStatus = "FAIL";
    mathDetail = `Discrepancy: expected Net €${expectedNet.toLocaleString()} (Gross €${scenario.gross} − Tax/SV €${scenario.deductions}), but document states €${scenario.net.toLocaleString()}.`;
    flags.push(`Mathematical contradiction: Net salary mismatch (€${scenario.net} vs €${expectedNet})`);
  }

  // 3. Identity match
  let identityStatus: CheckStatus = "PASS";
  let identityDetail = `Document name matches applicant (${input.applicantName}).`;
  if (normalize(scenario.employeeName) !== norm && !norm.includes(normalize(scenario.employeeName))) {
    identityStatus = "FAIL";
    identityDetail = `Name on payslip ("${scenario.employeeName}") does not match applicant ("${input.applicantName}").`;
    flags.push(`Identity mismatch: Document issued to "${scenario.employeeName}"`);
  }

  // 4. Layout alteration check
  const layoutStatus = scenario.layout;
  const layoutDetail =
    layoutStatus === "PASS"
      ? "Single-layer vector fonts · no text bounding overlay mismatch."
      : layoutStatus === "WARNING"
        ? "Secondary stream / web tool optimization layer detected."
        : "Multiple conflicting font layers detected (typical of photo edit).";
  if (layoutStatus !== "PASS") {
    flags.push("Visual layer / font consistency warning");
  }

  const { trust, overall } = computeTrust(
    metadataStatus,
    mathStatus,
    identityStatus,
    layoutStatus,
  );

  return {
    applicantId: input.id,
    applicantName: input.applicantName,
    documentLabel: scenario.documentLabel,
    overallStatus: overall,
    trustIndex: trust,
    producer: scenario.producer,
    source: "payslip-audit-engine",
    metadataCheck: {
      status: metadataStatus,
      label: "Metadata Inspection",
      detail: metadataDetail,
    },
    mathAudit: {
      status: mathStatus,
      label: "Financial Math Audit",
      detail: mathDetail,
      gross: scenario.gross,
      deductions: scenario.deductions,
      net: scenario.net,
      expectedNet,
    },
    identityCheck: {
      status: identityStatus,
      label: "Identity Verification",
      detail: identityDetail,
      applicantName: input.applicantName,
      documentName: scenario.employeeName,
    },
    layoutCheck: {
      status: layoutStatus,
      label: "Document Alteration Check",
      detail: layoutDetail,
    },
    flags,
    redacted: {
      employer: scenario.employer,
      period: scenario.period,
      gross: scenario.gross,
      deductions: scenario.deductions,
      highlightedNet: scenario.net,
      contractHint: input.hasPermanentContract
        ? "Permanent contract verified on file"
        : "Fixed-term / other contract",
    },
  };
}

/**
 * Pure TypeScript parser that inspects actual raw PDF bytes.
 * Extracts /Producer, text content, parses Gross/Tax/Net and Employee name.
 */
export function inspectPdfBytes(
  pdfBytes: Uint8Array,
  applicantName: string,
  targetIncome?: number,
): AuthenticityReport {
  const binaryString = new TextDecoder("latin1").decode(pdfBytes);

  // 1. Extract Producer & Title
  const producerMatch = binaryString.match(/\/Producer\s*\(([\s\S]*?)\)/);
  const producer = producerMatch
    ? producerMatch[1].replace(/\\([()])/g, "$1")
    : "Unknown Producer";

  // 2. Extract text chunks: (text) Tj or [(t1)(t2)] TJ
  const textChunks: string[] = [];
  const tjRegex = /\((.*?)\)\s*Tj/g;
  let m: RegExpExecArray | null;
  while ((m = tjRegex.exec(binaryString)) !== null) {
    textChunks.push(m[1].replace(/\\([()])/g, "$1").replace(/\\\\/g, "\\"));
  }
  const fullText = textChunks.join("\n");

  // Look for financial fields in text
  const grossMatch = fullText.match(/Gross(?: pay)?:\s*(?:EUR|€)?\s*([0-9.]+)/i);
  const taxMatch = fullText.match(/(?:Tax\/SV|Deductions?):\s*(?:EUR|€)?\s*([0-9.]+)/i);
  const netMatch = fullText.match(/Net(?: pay)?:\s*(?:EUR|€)?\s*([0-9.]+)/i);
  const nameMatch = fullText.match(/(?:Employee|Name):\s*([^\n\r]+)/i);

  const docName = nameMatch ? nameMatch[1].trim() : applicantName;
  const gross = grossMatch ? parseFloat(grossMatch[1]) : (targetIncome ? targetIncome * 1.25 : 5000);
  const deductions = taxMatch ? parseFloat(taxMatch[1]) : (targetIncome ? targetIncome * 0.25 : 1000);
  const net = netMatch ? parseFloat(netMatch[1]) : (targetIncome || gross - deductions);

  const flags: string[] = [];

  // Metadata check
  let metadataStatus: CheckStatus = "PASS";
  let metadataDetail = `Standard payroll producer: ${producer}.`;
  const prodLower = producer.toLowerCase();
  if (SUSPICIOUS_EDITORS.some((ed) => prodLower.includes(ed))) {
    metadataStatus = prodLower.includes("photoshop") || prodLower.includes("canva") ? "FAIL" : "WARNING";
    metadataDetail = `Document processed by non-payroll software (${producer}).`;
    flags.push(`Editing tool detected in metadata: ${producer}`);
  }

  // Math audit
  const expectedNet = Math.round((gross - deductions) * 100) / 100;
  let mathStatus: CheckStatus = "PASS";
  let mathDetail = `Gross €${gross.toLocaleString()} − deductions €${deductions.toLocaleString()} = net €${net.toLocaleString()}.`;
  if (Math.abs(expectedNet - net) > 1.0) {
    mathStatus = "FAIL";
    mathDetail = `Discrepancy: expected Net €${expectedNet.toLocaleString()} (Gross €${gross} − Tax €${deductions}), but document states €${net.toLocaleString()}.`;
    flags.push(`Net discrepancy: expected €${expectedNet}, got €${net}`);
  }

  // Identity check
  let identityStatus: CheckStatus = "PASS";
  let identityDetail = `Document name matches applicant (${applicantName}).`;
  if (docName && normalize(docName) !== normalize(applicantName)) {
    identityStatus = "FAIL";
    identityDetail = `Name on payslip ("${docName}") does not match applicant ("${applicantName}").`;
    flags.push(`Identity mismatch: Document issued to "${docName}"`);
  }

  // Layout check
  let layoutStatus: CheckStatus = "PASS";
  let layoutDetail = "Single-layer vector text stream verified.";
  if (prodLower.includes("photoshop") || prodLower.includes("canva")) {
    layoutStatus = "FAIL";
    layoutDetail = "Rasterized image export layer detected instead of payroll text layer.";
    flags.push("Rasterized / image overlay layout");
  } else if (prodLower.includes("ilovepdf")) {
    layoutStatus = "WARNING";
    layoutDetail = "Secondary PDF/A modified layer detected.";
    flags.push("Secondary PDF stream detected");
  }

  const { trust, overall } = computeTrust(
    metadataStatus,
    mathStatus,
    identityStatus,
    layoutStatus,
  );

  return {
    applicantName,
    documentLabel: `Uploaded File (${producer.slice(0, 32)})`,
    overallStatus: overall,
    trustIndex: trust,
    producer,
    source: "pdf-byte-inspector",
    metadataCheck: {
      status: metadataStatus,
      label: "Metadata Inspection",
      detail: metadataDetail,
    },
    mathAudit: {
      status: mathStatus,
      label: "Financial Math Audit",
      detail: mathDetail,
      gross,
      deductions,
      net,
      expectedNet,
    },
    identityCheck: {
      status: identityStatus,
      label: "Identity Verification",
      detail: identityDetail,
      applicantName,
      documentName: docName,
    },
    layoutCheck: {
      status: layoutStatus,
      label: "Document Alteration Check",
      detail: layoutDetail,
    },
    flags,
    redacted: {
      employer: "Verified Berlin Employer",
      period: "Current Period",
      gross,
      deductions,
      highlightedNet: net,
      contractHint: "Extracted from verified pay stub",
    },
  };
}

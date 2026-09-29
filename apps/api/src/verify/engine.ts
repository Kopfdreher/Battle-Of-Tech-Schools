export type CheckStatus = 'PASS' | 'WARNING' | 'FAIL'
export type OverallStatus = 'verified' | 'warning' | 'fail'

export type InspectInput = {
  id?: string
  applicantId?: string
  displayName: string
  netIncomeMonthly: number
  hasIncomeProof: boolean
}

export type AuthenticityReport = {
  applicantId: string
  documentLabel: string
  overallStatus: OverallStatus
  trustIndex: number
  producer: string
  source: string
  metadataCheck: { status: CheckStatus; label: string; detail: string }
  mathAudit: {
    status: CheckStatus
    label: string
    detail: string
    gross: number
    deductions: number
    net: number
    expectedNet: number | null
  }
  identityCheck: {
    status: CheckStatus
    label: string
    detail: string
    applicantName: string
    documentName: string | null
  }
  layoutCheck: { status: CheckStatus; label: string; detail: string }
  flags: string[]
  redacted: {
    employer: string
    period: string
    highlightedNet: number
    contractHint: string
  }
}

type Scenario = {
  key: string
  document_label: string
  producer: string
  employee_name: string
  employer: string
  period: string
  gross: number
  tax_sv: number
  net: number
  layout: CheckStatus
  missing?: boolean
}

const SCENARIOS: Record<string, Scenario> = {
  'mara ellison': {
    key: 'clean-datev',
    document_label: 'Payslip · DATEV Lohn',
    producer: 'DATEV Lohn und Gehalt',
    employee_name: 'Mara Ellison',
    employer: 'Nordbahn GmbH',
    period: 'August 2026',
    gross: 5200,
    tax_sv: 1000,
    net: 4200,
    layout: 'PASS',
  },
  'jonas richter': {
    key: 'edited-ilovepdf',
    document_label: 'Payslip · uploaded PDF',
    producer: 'iLovePDF',
    employee_name: 'Jonas Richter',
    employer: 'Spree Werkstatt UG',
    period: 'August 2026',
    gross: 3900,
    tax_sv: 800,
    net: 3100,
    layout: 'WARNING',
  },
  'leila hofmann': {
    key: 'math-fail',
    document_label: 'Payslip · edited net pay',
    producer: 'DATEV Lohn und Gehalt',
    employee_name: 'Leila Hofmann',
    employer: 'Kiez Logistics AG',
    period: 'August 2026',
    gross: 3600,
    tax_sv: 800,
    net: 3400,
    layout: 'PASS',
  },
  'samir okonkwo': {
    key: 'name-mismatch',
    document_label: 'Payslip · identity mismatch',
    producer: 'DATEV Lohn und Gehalt',
    employee_name: 'Alex Schmidt',
    employer: 'Ringbahn Media GmbH',
    period: 'August 2026',
    gross: 6400,
    tax_sv: 1300,
    net: 5100,
    layout: 'PASS',
  },
  'nina vogt': {
    key: 'photoshop-canva',
    document_label: 'Payslip · image export',
    producer: 'Adobe Photoshop 25.0 / Canva',
    employee_name: 'Nina Vogt',
    employer: 'Freelance invoice PDF',
    period: 'August 2026',
    gross: 3100,
    tax_sv: 200,
    net: 2400,
    layout: 'FAIL',
  },
}

const SUSPICIOUS = ['photoshop', 'canva', 'ilovepdf', 'preview']

function normalizeName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}

function scenarioFor(displayName: string, hasIncomeProof: boolean, netIncome: number): Scenario {
  if (!hasIncomeProof) {
    return {
      key: 'missing',
      document_label: 'No income proof uploaded',
      producer: '',
      employee_name: displayName,
      employer: '—',
      period: '—',
      gross: 0,
      tax_sv: 0,
      net: netIncome || 0,
      layout: 'FAIL',
      missing: true,
    }
  }
  const preset = SCENARIOS[normalizeName(displayName)]
  if (preset) return preset
  const tax_sv = Math.round(netIncome * 0.24)
  return {
    key: 'default-pass',
    document_label: 'Payslip · DATEV Lohn',
    producer: 'DATEV Lohn und Gehalt',
    employee_name: displayName,
    employer: 'Berlin employer (demo)',
    period: 'August 2026',
    gross: netIncome + tax_sv,
    tax_sv,
    net: netIncome,
    layout: 'PASS',
  }
}

function overall(trust: number, checks: CheckStatus[]): OverallStatus {
  if (checks.includes('FAIL') || trust < 70) return 'fail'
  if (checks.includes('WARNING') || trust < 90) return 'warning'
  return 'verified'
}

export function inspectApplicantLocal(input: InspectInput, source = 'nest-engine'): AuthenticityReport {
  const applicantId = input.id ?? input.applicantId ?? ''
  const scenario = scenarioFor(input.displayName, input.hasIncomeProof, input.netIncomeMonthly)

  if (scenario.missing) {
    return {
      applicantId,
      documentLabel: scenario.document_label,
      overallStatus: 'fail',
      trustIndex: 18,
      producer: '',
      source,
      metadataCheck: {
        status: 'FAIL',
        label: 'Metadata',
        detail: 'No payroll PDF was attached for this applicant.',
      },
      mathAudit: {
        status: 'FAIL',
        label: 'Math audit',
        detail: 'Cannot verify Gross − deductions = Net without a payslip.',
        gross: 0,
        deductions: 0,
        net: input.netIncomeMonthly,
        expectedNet: null,
      },
      identityCheck: {
        status: 'FAIL',
        label: 'Identity',
        detail: 'No document name to compare with the applicant.',
        applicantName: input.displayName,
        documentName: null,
      },
      layoutCheck: {
        status: 'FAIL',
        label: 'Alteration',
        detail: 'Missing file — treated as unverified.',
      },
      flags: ['Income proof missing.'],
      redacted: {
        employer: '—',
        period: '—',
        highlightedNet: input.netIncomeMonthly,
        contractHint: 'Unknown',
      },
    }
  }

  const flags: string[] = []
  const producer = scenario.producer
  let metadataStatus: CheckStatus = 'PASS'
  let metadataDetail = `Standard payroll producer: ${producer || 'unknown'}.`
  if (SUSPICIOUS.some((tool) => producer.toLowerCase().includes(tool))) {
    metadataStatus = 'WARNING'
    metadataDetail = `Document processed by non-payroll software (${producer}).`
    flags.push('Metadata: editing/export tool detected.')
  }

  const expectedNet = Math.round((scenario.gross - scenario.tax_sv) * 100) / 100
  let mathStatus: CheckStatus = 'PASS'
  let mathDetail = `Gross €${scenario.gross} − deductions €${scenario.tax_sv} = net €${scenario.net}.`
  if (Math.abs(expectedNet - scenario.net) > 1) {
    mathStatus = 'FAIL'
    mathDetail = `Net salary discrepancy: expected €${expectedNet} (gross − tax/SV), document shows €${scenario.net}.`
    flags.push(mathDetail)
  }

  let identityStatus: CheckStatus = 'PASS'
  let identityDetail = 'Payslip name matches the applicant (redacted in the landlord view).'
  if (normalizeName(scenario.employee_name) !== normalizeName(input.displayName)) {
    identityStatus = 'FAIL'
    identityDetail = `Name on document (${scenario.employee_name}) does not match applicant (${input.displayName}).`
    flags.push('Identity mismatch between applicant and payslip.')
  }

  const layoutStatus = scenario.layout
  const layoutDetail =
    layoutStatus === 'PASS'
      ? 'Single-layer Type1 text — no font/overlay mismatch detected.'
      : layoutStatus === 'WARNING'
        ? 'Extra content stream / export artifact — possible visual edit.'
        : 'Layer/font mismatch typical of image-in-PDF or design-tool export.'
  if (layoutStatus !== 'PASS') flags.push('Layout consistency warning.')

  let trust = 100
  if (metadataStatus === 'WARNING') trust -= 15
  if (mathStatus === 'FAIL') trust -= 40
  if (identityStatus === 'FAIL') trust -= 35
  if (layoutStatus === 'WARNING') trust -= 12
  if (layoutStatus === 'FAIL') trust -= 20
  trust = Math.max(0, Math.min(100, trust))

  const checks = [metadataStatus, mathStatus, identityStatus, layoutStatus]
  return {
    applicantId,
    documentLabel: scenario.document_label,
    overallStatus: overall(trust, checks),
    trustIndex: trust,
    producer,
    source,
    metadataCheck: { status: metadataStatus, label: 'Metadata', detail: metadataDetail },
    mathAudit: {
      status: mathStatus,
      label: 'Math audit',
      detail: mathDetail,
      gross: scenario.gross,
      deductions: scenario.tax_sv,
      net: scenario.net,
      expectedNet,
    },
    identityCheck: {
      status: identityStatus,
      label: 'Identity',
      detail: identityDetail,
      applicantName: input.displayName,
      documentName: scenario.employee_name,
    },
    layoutCheck: { status: layoutStatus, label: 'Alteration', detail: layoutDetail },
    flags,
    redacted: {
      employer: scenario.employer,
      period: scenario.period,
      highlightedNet: scenario.net,
      contractHint: 'Employment facts come from structured fields — not from the photo on the slip.',
    },
  }
}

export function inspectManyLocal(applicants: InspectInput[]) {
  return applicants.map((item) => inspectApplicantLocal(item))
}

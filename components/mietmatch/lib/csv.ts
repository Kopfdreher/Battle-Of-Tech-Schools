import type { Applicant, ContractType, EmploymentType } from '../types'
import { applicantFingerprint } from '../data/applicants'

export type ApplicantDraft = Omit<Applicant, 'id' | 'appliedAt'>

const CONTRACTS: ContractType[] = ['permanent', 'fixed', 'freelance', 'student', 'other']
const EMPLOYMENTS: EmploymentType[] = ['employed', 'self-employed', 'student', 'other']

function splitCsvLine(line: string): string[] {
  const cells: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }
    if (char === ',' && !inQuotes) {
      cells.push(current.trim())
      current = ''
      continue
    }
    current += char
  }
  cells.push(current.trim())
  return cells
}

function normalizeHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
    .replace(/[^\w]/g, '')
}

function truthy(value: string | undefined) {
  if (!value) return false
  return /^(1|true|yes|y|ja|x)$/i.test(value.trim())
}

function pickContract(value: string | undefined): ContractType {
  const raw = (value ?? '').toLowerCase()
  return CONTRACTS.find((item) => raw.includes(item)) ?? 'other'
}

function pickEmployment(value: string | undefined): EmploymentType {
  const raw = (value ?? '').toLowerCase()
  if (raw.includes('self')) return 'self-employed'
  return EMPLOYMENTS.find((item) => raw.includes(item)) ?? 'other'
}

function numberOr(value: string | undefined, fallback: number) {
  if (!value) return fallback
  const cleaned = value.replace(/[^\d.]/g, '')
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : fallback
}

const ALIASES: Record<string, string[]> = {
  displayName: ['name', 'display_name', 'full_name', 'applicant', 'applicant_name'],
  email: ['email', 'mail', 'e_mail', 'email_address'],
  netIncomeMonthly: ['net_income', 'income', 'net_income_monthly', 'monthly_income', 'gehalt'],
  householdSize: ['household_size', 'household', 'persons', 'people', 'personen'],
  contractType: ['contract', 'contract_type', 'employment_contract'],
  employmentType: ['employment', 'employment_type', 'job'],
  hasArrearsLetter: ['arrears_letter', 'mietschuldenfreiheit', 'no_arrears', 'arrears'],
  hasIncomeProof: ['income_proof', 'payslip', 'einkommensnachweis'],
  hasEmploymentProof: ['employment_proof', 'job_proof', 'arbeitgeber'],
  hasSchufa: ['schufa'],
  smokes: ['smokes', 'smoking', 'raucher'],
}

function mapHeaders(headers: string[]) {
  const normalized = headers.map(normalizeHeader)
  const index: Partial<Record<keyof typeof ALIASES, number>> = {}
  for (const [field, names] of Object.entries(ALIASES)) {
    const found = normalized.findIndex((header) => names.includes(header))
    if (found >= 0) index[field as keyof typeof ALIASES] = found
  }
  return index
}

function rowToDraft(cells: string[], index: ReturnType<typeof mapHeaders>): ApplicantDraft | null {
  const get = (key: keyof typeof ALIASES) => {
    const at = index[key]
    return at === undefined ? undefined : cells[at]
  }

  const email = (get('email') ?? '').trim()
  const displayName = (get('displayName') ?? '').trim() || email.split('@')[0] || ''
  if (!email && !displayName) return null
  if (email && !email.includes('@')) return null

  const safeEmail = email.includes('@') ? email.toLowerCase() : `${displayName.replace(/\s+/g, '.').toLowerCase()}@import.local`
  const name = displayName || safeEmail.split('@')[0]

  return {
    displayName: name,
    email: safeEmail,
    netIncomeMonthly: numberOr(get('netIncomeMonthly'), 0),
    householdSize: Math.max(1, Math.round(numberOr(get('householdSize'), 1))),
    contractType: pickContract(get('contractType')),
    employmentType: pickEmployment(get('employmentType')),
    hasArrearsLetter: truthy(get('hasArrearsLetter')),
    hasIncomeProof: truthy(get('hasIncomeProof')),
    hasEmploymentProof: truthy(get('hasEmploymentProof')),
    hasSchufa: truthy(get('hasSchufa')),
    smokes: truthy(get('smokes')),
    messagePreview: '[Imported from CSV — free text is not used for scoring.]',
    fingerprint: applicantFingerprint(safeEmail, name),
  }
}

/** Parse a CSV of applicant rows. First line must be headers. */
export function parseApplicantCsv(text: string): { drafts: ApplicantDraft[]; errors: string[] } {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  if (lines.length < 2) {
    return { drafts: [], errors: ['CSV needs a header row and at least one applicant.'] }
  }

  const headers = splitCsvLine(lines[0])
  const index = mapHeaders(headers)
  if (index.email === undefined && index.displayName === undefined) {
    return {
      drafts: [],
      errors: ['CSV must include a name or email column (e.g. name, email, net_income, household_size).'],
    }
  }

  const drafts: ApplicantDraft[] = []
  const errors: string[] = []
  for (let i = 1; i < lines.length; i += 1) {
    const cells = splitCsvLine(lines[i])
    const draft = rowToDraft(cells, index)
    if (!draft) {
      errors.push(`Row ${i + 1} skipped — need a name or valid email.`)
      continue
    }
    drafts.push(draft)
  }
  return { drafts, errors }
}

/** One email per line → stub applicants (incomplete until CSV fields are filled). */
export function parseEmailList(text: string): { drafts: ApplicantDraft[]; errors: string[] } {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  const drafts: ApplicantDraft[] = []
  const errors: string[] = []
  for (const line of lines) {
    const email = line.replace(/^mailto:/i, '').trim().toLowerCase()
    if (!email.includes('@')) {
      errors.push(`Skipped “${line}” — not an email.`)
      continue
    }
    const displayName = email.split('@')[0]?.replace(/[._]/g, ' ') || email
    drafts.push({
      displayName,
      email,
      netIncomeMonthly: 0,
      householdSize: 1,
      contractType: 'other',
      employmentType: 'other',
      hasArrearsLetter: false,
      hasIncomeProof: false,
      hasEmploymentProof: false,
      hasSchufa: false,
      smokes: false,
      messagePreview: '[From email list — add structured CSV fields for a fair score.]',
      fingerprint: applicantFingerprint(email, displayName),
    })
  }
  return { drafts, errors }
}

export const CSV_TEMPLATE = `name,email,net_income,household_size,contract,employment,arrears_letter,income_proof,employment_proof,schufa,smokes
Mara Ellison,mara.ellison@example.com,4200,2,permanent,employed,yes,yes,yes,yes,no
Jonas Richter,jonas.richter@example.com,3100,1,permanent,employed,yes,yes,yes,no,no
Leila Hofmann,leila.hofmann@example.com,2800,2,fixed,employed,yes,yes,yes,yes,no
`

/** Build ~100 demo applicants as CSV text for download / import demos. */
export function buildDemoCsv(count = 100): string {
  const first = ['Mara', 'Jonas', 'Leila', 'Samir', 'Nina', 'Erik', 'Ayla', 'Tomas', 'Priya', 'Felix', 'Hanna', 'Omar', 'Clara', 'Luis', 'Sofia']
  const last = ['Ellison', 'Richter', 'Hofmann', 'Okonkwo', 'Vogt', 'Lindqvist', 'Demir', 'Alvarez', 'Shah', 'Braun', 'Sjoberg', 'Khan', 'Weber', 'Silva', 'Novak']
  const rows = [CSV_TEMPLATE.trim().split('\n')[0]]
  for (let i = 0; i < count; i += 1) {
    const f = first[i % first.length]
    const l = last[(i * 3) % last.length]
    const name = `${f} ${l}`
    const email = `${f}.${l}.${i}@example.com`.toLowerCase()
    const income = 1600 + ((i * 137) % 4200)
    const household = 1 + (i % 4)
    const contract = CONTRACTS[i % CONTRACTS.length]
    const employment = EMPLOYMENTS[i % EMPLOYMENTS.length]
    const yesNo = (n: number) => (i % n === 0 ? 'no' : 'yes')
    rows.push(
      [
        name,
        email,
        String(income),
        String(household),
        contract,
        employment,
        yesNo(5),
        yesNo(4),
        yesNo(6),
        yesNo(3),
        i % 7 === 0 ? 'yes' : 'no',
      ].join(','),
    )
  }
  return `${rows.join('\n')}\n`
}

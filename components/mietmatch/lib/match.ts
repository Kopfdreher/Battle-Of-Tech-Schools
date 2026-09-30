import type { Applicant, LandlordFlat, Requirements } from '../types'
import { hasCriterion } from '../data/requirements'

export type Check = {
  id: string
  label: string
  ok: boolean
  percent: number
  detail: string
  reason: string
}

export type Verdict = {
  passes: boolean
  score: number
  matchRate: number
  checks: Check[]
  failures: Check[]
  flags: string[]
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value))
}

function roundPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function minMatch(value: number, limit: number) {
  if (limit <= 0) return 100
  if (value >= limit) return roundPercent(70 + 30 * Math.min(1, (value - limit) / Math.max(limit, 1)))
  return roundPercent(69 * clamp01(value / limit))
}

function boolMatch(ok: boolean) {
  return ok ? 100 : 0
}

/**
 * Score an applicant against landlord rules using structured fields only.
 * Free-text messages are never read here (fairness).
 */
export function evaluateApplicant(
  applicant: Applicant,
  flat: LandlordFlat,
  req: Requirements,
  peers: Applicant[] = [],
): Verdict {
  const checks: Check[] = []
  const flags: string[] = []

  const incomeMultiple = flat.rentWarm > 0 ? applicant.netIncomeMonthly / flat.rentWarm : 0

  if (hasCriterion(req, 'affordability')) {
    const ok = incomeMultiple >= req.minIncomeMultiple
    checks.push({
      id: 'affordability',
      label: 'Affordability',
      ok,
      percent: minMatch(incomeMultiple, req.minIncomeMultiple),
      detail: `${incomeMultiple.toFixed(1)}× rent · need ${req.minIncomeMultiple}×`,
      reason: ok
        ? `Income covers at least ${req.minIncomeMultiple}× warm rent`
        : `Income is under ${req.minIncomeMultiple}× warm rent`,
    })
  }

  if (hasCriterion(req, 'contract')) {
    const permanent = applicant.contractType === 'permanent'
    const ok = !req.requirePermanentContract || permanent
    checks.push({
      id: 'contract',
      label: 'Employment contract',
      ok,
      percent: req.requirePermanentContract
        ? boolMatch(permanent)
        : permanent
          ? 100
          : applicant.contractType === 'fixed'
            ? 70
            : 45,
      detail: `${applicant.contractType} · ${applicant.employmentType}`,
      reason: ok
        ? req.requirePermanentContract
          ? 'Permanent contract on file'
          : 'Contract type accepted'
        : 'Permanent contract preferred',
    })
  }

  if (hasCriterion(req, 'household')) {
    const limit = flat.rooms + req.maxHouseholdOverRooms
    const ok = applicant.householdSize <= limit
    const percent = ok
      ? roundPercent(70 + 30 * clamp01(1 - applicant.householdSize / Math.max(limit, 1)))
      : roundPercent(69 * clamp01(limit / applicant.householdSize))
    checks.push({
      id: 'household',
      label: 'Household fit',
      ok,
      percent,
      detail: `${applicant.householdSize} people · ${flat.rooms} rooms`,
      reason: ok ? 'Household fits the flat size' : 'Household is large for this flat',
    })
  }

  if (hasCriterion(req, 'arrearsLetter')) {
    const ok = !req.requireArrearsLetter || applicant.hasArrearsLetter
    checks.push({
      id: 'arrearsLetter',
      label: 'No rent arrears letter',
      ok,
      percent: boolMatch(applicant.hasArrearsLetter),
      detail: applicant.hasArrearsLetter
        ? 'Mietschuldenfreiheitsbescheinigung on file'
        : 'Letter missing',
      reason: ok
        ? applicant.hasArrearsLetter
          ? 'Previous-landlord letter confirms no arrears'
          : 'Letter not required'
        : 'Missing Mietschuldenfreiheitsbescheinigung',
    })
    if (!applicant.hasArrearsLetter) flags.push('Missing no-arrears letter')
  }

  if (hasCriterion(req, 'smoking')) {
    const ok = !req.smokingHardNo || !applicant.smokes
    checks.push({
      id: 'smoking',
      label: 'No smoking',
      ok,
      percent: boolMatch(!applicant.smokes),
      detail: applicant.smokes ? 'Smokes' : 'Non-smoker',
      reason: ok
        ? applicant.smokes
          ? 'Smoking allowed for this listing'
          : 'Non-smoker'
        : 'Hard no — applicant smokes',
    })
  }

  if (hasCriterion(req, 'documents')) {
    const needIncome = !req.requireIncomeProof || applicant.hasIncomeProof
    const needJob = !req.requireEmploymentProof || applicant.hasEmploymentProof
    const ok = needIncome && needJob
    const parts = [
      applicant.hasIncomeProof ? 1 : 0,
      applicant.hasEmploymentProof ? 1 : 0,
    ]
    const percent = roundPercent((parts.reduce((a, b) => a + b, 0) / parts.length) * 100)
    checks.push({
      id: 'documents',
      label: 'Document checklist',
      ok,
      percent,
      detail: `Income proof ${applicant.hasIncomeProof ? 'yes' : 'no'} · Employment proof ${
        applicant.hasEmploymentProof ? 'yes' : 'no'
      }`,
      reason: ok ? 'Required documents are on file' : 'Required documents are incomplete',
    })
    if (!applicant.hasIncomeProof || !applicant.hasEmploymentProof) {
      flags.push('Incomplete documents')
    }
  }

  if (hasCriterion(req, 'schufa')) {
    const ok = !req.preferSchufa || applicant.hasSchufa
    checks.push({
      id: 'schufa',
      label: 'SCHUFA',
      ok,
      percent: boolMatch(applicant.hasSchufa),
      detail: applicant.hasSchufa ? 'SCHUFA on file' : 'No SCHUFA uploaded',
      reason: ok
        ? applicant.hasSchufa
          ? 'SCHUFA present'
          : 'SCHUFA optional'
        : 'SCHUFA preferred but missing',
    })
  }

  if (hasCriterion(req, 'employed')) {
    const ok = applicant.employmentType === 'employed'
    checks.push({
      id: 'employed',
      label: 'Employed applicant',
      ok,
      percent: ok
        ? 100
        : applicant.employmentType === 'self-employed'
          ? 55
          : applicant.employmentType === 'student'
            ? 40
            : 30,
      detail: applicant.employmentType,
      reason: ok ? 'Applicant is employed' : 'Prefer employed applicants for this listing',
    })
  }

  if (hasCriterion(req, 'compactHousehold')) {
    const ok = applicant.householdSize <= 2
    checks.push({
      id: 'compactHousehold',
      label: 'Solo or couple',
      ok,
      percent: ok
        ? roundPercent(100 - Math.max(0, applicant.householdSize - 1) * 8)
        : roundPercent(69 * clamp01(2 / applicant.householdSize)),
      detail: `${applicant.householdSize} person${applicant.householdSize === 1 ? '' : 's'}`,
      reason: ok ? 'Household is solo or a couple' : 'Household is larger than 2 people',
    })
  }

  if (hasCriterion(req, 'fullEvidence')) {
    const parts = [
      applicant.hasArrearsLetter,
      applicant.hasIncomeProof,
      applicant.hasEmploymentProof,
      applicant.hasSchufa,
    ]
    const filled = parts.filter(Boolean).length
    const ok = filled === parts.length
    checks.push({
      id: 'fullEvidence',
      label: 'Full evidence pack',
      ok,
      percent: roundPercent((filled / parts.length) * 100),
      detail: `${filled}/${parts.length} evidence items on file`,
      reason: ok ? 'Complete evidence pack on file' : 'Evidence pack is incomplete',
    })
  }

  const dupes = peers.filter(
    (peer) => peer.id !== applicant.id && peer.fingerprint === applicant.fingerprint,
  )
  if (dupes.length > 0) flags.push(`Possible duplicate (${dupes.length + 1} applications)`)

  const incomplete =
    !applicant.hasArrearsLetter || !applicant.hasIncomeProof || !applicant.hasEmploymentProof
  if (incomplete && !flags.includes('Incomplete documents') && !flags.includes('Missing no-arrears letter')) {
    flags.push('Weak evidence pack')
  }

  // Keep checks in landlord priority order (selected[0] = highest weight).
  const order = new Map<string, number>(req.selected.map((id, index) => [id, index]))
  checks.sort((left, right) => (order.get(left.id) ?? 99) - (order.get(right.id) ?? 99))

  const failures = checks.filter((check) => !check.ok)
  const weights = checks.map((_, index) => checks.length - index)
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0)
  const matchRate =
    checks.length === 0
      ? 100
      : roundPercent(
          checks.reduce((sum, check, index) => sum + check.percent * weights[index]!, 0) / weightSum,
        )

  return {
    passes: failures.length === 0,
    score: matchRate,
    matchRate,
    checks,
    failures,
    flags,
  }
}

export const STRONG_MATCH_RATE = 70

export type MatchTone = 'good' | 'bad'

/** Strong = criteria match % at or above the threshold (authenticity is separate). */
export function matchTone(verdict: Pick<Verdict, 'matchRate'>): MatchTone {
  return verdict.matchRate >= STRONG_MATCH_RATE ? 'good' : 'bad'
}

/** Highest match % first; tie-break on the top-priority criterion. */
export function compareApplicants(
  left: { verdict: Verdict },
  right: { verdict: Verdict },
) {
  const byRate = right.verdict.matchRate - left.verdict.matchRate
  if (byRate !== 0) return byRate
  const leftTop = left.verdict.checks[0]?.percent ?? 0
  const rightTop = right.verdict.checks[0]?.percent ?? 0
  return rightTop - leftTop
}

import type { Applicant } from '../types.ts'
import {
  inspectApplicantLocal,
  inspectManyLocal,
  type AuthenticityReport,
} from './authenticityEngine.ts'

export type { AuthenticityReport }

function payload(applicant: Applicant) {
  return {
    id: applicant.id,
    displayName: applicant.displayName,
    netIncomeMonthly: applicant.netIncomeMonthly,
    hasIncomeProof: applicant.hasIncomeProof,
  }
}

export async function inspectApplicant(applicant: Applicant): Promise<AuthenticityReport> {
  try {
    const response = await fetch('/api/verify/inspect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload(applicant)),
    })
    if (!response.ok) throw new Error(String(response.status))
    return (await response.json()) as AuthenticityReport
  } catch {
    return inspectApplicantLocal(payload(applicant), 'browser-fallback')
  }
}

export async function inspectApplicants(
  applicants: Applicant[],
): Promise<Record<string, AuthenticityReport>> {
  const map: Record<string, AuthenticityReport> = {}
  try {
    const response = await fetch('/api/verify/inspect-many', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicants: applicants.map(payload) }),
    })
    if (!response.ok) throw new Error(String(response.status))
    const data = (await response.json()) as { reports: AuthenticityReport[] }
    data.reports.forEach((report, index) => {
      const id = applicants[index]?.id ?? report.applicantId
      map[id] = { ...report, applicantId: id }
    })
    return map
  } catch {
    inspectManyLocal(applicants.map(payload)).forEach((report, index) => {
      const id = applicants[index]?.id ?? report.applicantId
      map[id] = { ...report, applicantId: id, source: 'browser-fallback' }
    })
    return map
  }
}

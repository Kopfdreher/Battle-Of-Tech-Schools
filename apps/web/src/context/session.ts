import { createContext, useContext } from 'react'
import type { Applicant, Invitation, LandlordFlat, MailboxConnection, Requirements, User } from '../types.ts'
import type { ApplicantDraft } from '../lib/csv.ts'

export type ApplicantMark = 'like' | 'unsure'

export type SessionValue = {
  user: User | null
  requirements: Requirements
  flat: LandlordFlat | null
  applicants: Applicant[]
  mailbox: MailboxConnection | null
  invitedIds: string[]
  invitations: Invitation[]
  marks: Record<string, ApplicantMark>
  signup: (name: string, email: string, password: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  updateRequirements: (requirements: Requirements) => void
  setFlat: (draft: Omit<LandlordFlat, 'id' | 'addedAt'>) => LandlordFlat
  clearFlat: () => void
  clearApplicants: () => void
  addApplicant: (draft: Omit<Applicant, 'id' | 'appliedAt'>) => Applicant
  importApplicants: (drafts: ApplicantDraft[], mode?: 'replace' | 'append') => number
  removeApplicant: (id: string) => void
  loadSampleApplicants: () => void
  loadDemoBoard: () => void
  connectMailbox: (provider: MailboxConnection['provider']) => void
  disconnectMailbox: () => void
  markInvited: (ids: string[]) => void
  scheduleInvitations: (input: { applicantIds: string[]; date: string; time: string }) => void
  rescheduleSlot: (slot: { date: string; time: string }, next: { date: string; time: string }) => void
  cancelInvitation: (id: string) => void
  cancelSlot: (slot: { date: string; time: string }) => void
  clearInvited: () => void
  setApplicantMark: (id: string, mark: ApplicantMark | null) => void
}

export const SessionContext = createContext<SessionValue | null>(null)

export function useSession() {
  const value = useContext(SessionContext)
  if (!value) throw new Error('useSession must be used within SessionProvider')
  return value
}

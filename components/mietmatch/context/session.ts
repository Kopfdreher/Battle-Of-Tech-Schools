import { createContext, useContext } from 'react'
import type { Applicant, Invitation, LandlordFlat, MailboxConnection, Requirements, User } from '../types'
import type { ApplicantDraft } from '../lib/csv'

export type ApplicantMark = 'like' | 'unsure'

export type SessionValue = {
  ready: boolean
  user: User | null
  onboardingDone: boolean
  requirements: Requirements
  flat: LandlordFlat | null
  applicants: Applicant[]
  mailbox: MailboxConnection | null
  invitedIds: string[]
  invitations: Invitation[]
  marks: Record<string, ApplicantMark>
  namesVisible: boolean
  signup: (name: string, email: string, password: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  completeOnboarding: () => void
  updateRequirements: (requirements: Requirements) => void
  setFlat: (draft: Omit<LandlordFlat, 'id' | 'addedAt'>) => LandlordFlat
  clearFlat: () => void
  addApplicant: (draft: Omit<Applicant, 'id' | 'appliedAt'>) => Applicant
  importApplicants: (drafts: ApplicantDraft[], mode?: 'replace' | 'append') => number
  removeApplicant: (id: string) => void
  connectMailbox: (provider: MailboxConnection['provider']) => void
  disconnectMailbox: () => void
  markInvited: (ids: string[]) => void
  scheduleInvitations: (input: { applicantIds: string[]; date: string; time: string }) => void
  rescheduleSlot: (slot: { date: string; time: string }, next: { date: string; time: string }) => void
  cancelInvitation: (id: string) => void
  cancelSlot: (slot: { date: string; time: string }) => void
  clearInvited: () => void
  setApplicantMark: (id: string, mark: ApplicantMark | null) => void
  setNamesVisible: (visible: boolean) => void
}

export const SessionContext = createContext<SessionValue | null>(null)

export function useSession() {
  const value = useContext(SessionContext)
  if (!value) throw new Error('useSession must be used within SessionProvider')
  return value
}

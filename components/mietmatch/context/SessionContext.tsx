'use client'

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { SAMPLE_APPLICANTS } from '../data/applicants'
import { LISTINGS } from '../data/listings'
import { defaultRequirements, sanitizeRequirements } from '../data/requirements'
import { authenticate, register } from '../lib/auth'
import { buildDemoCsv, parseApplicantCsv } from '../lib/csv'
import { authClient } from '@/lib/auth-client'
import { createListingAction } from '@/app/actions/listings'
import {
  applicantsKey,
  flatKey,
  invitationsKey,
  invitedKey,
  mailboxKey,
  marksKey,
  onboardingKey,
  readJson,
  removeKey,
  requirementsKey,
  sessionKey,
  writeJson,
} from '../lib/storage'
import type {
  Applicant,
  Invitation,
  LandlordFlat,
  MailboxConnection,
  MailboxProvider,
  Requirements,
  User,
} from '../types'
import { SessionContext, type ApplicantMark, type SessionValue } from './session'
import { anonymizeApplicantRecord, isCodedAlias } from '../lib/anonymize'

type SessionState = {
  user: User | null
  onboardingDone: boolean
  requirements: Requirements
  flat: LandlordFlat | null
  applicants: Applicant[]
  mailbox: MailboxConnection | null
  invitedIds: string[]
  invitations: Invitation[]
  marks: Record<string, ApplicantMark>
}

function anonymizeApplicant<T extends Applicant | Omit<Applicant, 'id' | 'appliedAt'>>(item: T): T {
  return anonymizeApplicantRecord(item)
}

/** Restore real names when older sessions stored "Applicant ABCD" codes. */
function restoreDisplayName<T extends Applicant>(item: T): T {
  if (!isCodedAlias(item.displayName)) return item
  const seed = SAMPLE_APPLICANTS.find(
    (sample) =>
      sample.fingerprint === item.fingerprint ||
      (item.email && sample.email.toLowerCase() === item.email.toLowerCase()),
  )
  if (seed) return { ...item, displayName: seed.displayName }
  // Fall back to a name-shaped label so blur still looks like a name, not a code.
  return { ...item, displayName: 'Applicant name' }
}

function loadFlat(userId: string) {
  const raw = readJson<LandlordFlat | null>(flatKey(userId), null)
  return raw && typeof raw.id === 'string' ? raw : null
}

function loadApplicants(userId: string) {
  const raw = readJson<Applicant[]>(applicantsKey(userId), [])
  if (!Array.isArray(raw)) return []
  return raw
    .filter((item) => item && typeof item.id === 'string')
    .map((item) => anonymizeApplicant(restoreDisplayName(item)))
}

function loadMailbox(userId: string) {
  const raw = readJson<MailboxConnection | null>(mailboxKey(userId), null)
  return raw && typeof raw.email === 'string' ? raw : null
}

function loadInvited(userId: string) {
  const raw = readJson<string[]>(invitedKey(userId), [])
  return Array.isArray(raw) ? raw.filter((id) => typeof id === 'string') : []
}

function isInvitation(value: unknown): value is Invitation {
  if (!value || typeof value !== 'object') return false
  const item = value as Invitation
  return (
    typeof item.id === 'string' &&
    typeof item.applicantId === 'string' &&
    typeof item.date === 'string' &&
    typeof item.time === 'string' &&
    typeof item.sentAt === 'string'
  )
}

function loadInvitations(userId: string) {
  return readJson<unknown[]>(invitationsKey(userId), []).filter(isInvitation)
}

function loadMarks(userId: string): Record<string, ApplicantMark> {
  const raw = readJson<Record<string, unknown>>(marksKey(userId), {})
  if (!raw || typeof raw !== 'object') return {}
  const next: Record<string, ApplicantMark> = {}
  for (const [id, value] of Object.entries(raw)) {
    if (value === 'like' || value === 'unsure') next[id] = value
  }
  return next
}

function emptyState(): SessionState {
  return {
    user: null,
    onboardingDone: true,
    requirements: defaultRequirements,
    flat: null,
    applicants: [],
    mailbox: null,
    invitedIds: [],
    invitations: [],
    marks: {},
  }
}

function resolveOnboardingDone(
  userId: string,
  flat: LandlordFlat | null,
  applicants: Applicant[],
  mailbox: MailboxConnection | null,
) {
  const stored = readJson<boolean | null>(onboardingKey(userId), null)
  if (stored === true) return true
  if (stored === false) return false
  return Boolean(flat || applicants.length > 0 || mailbox)
}

type ServerBoard = { flat: LandlordFlat; applicants: Applicant[] }

function withBoard(state: SessionState, board: ServerBoard | null): SessionState {
  if (!board) return state
  return { ...state, flat: board.flat, applicants: board.applicants.map((item) => anonymizeApplicant(item)) }
}

export function SessionProvider({
  children,
  serverBoard = null,
}: {
  children: ReactNode
  serverBoard?: ServerBoard | null
}) {
  const [state, setState] = useState<SessionState>(() => withBoard(emptyState(), serverBoard))
  const [ready, setReady] = useState(false)
  const session = authClient.useSession()

  useEffect(() => {
    if (session.isPending) return;

    const betterUser = session.data?.user || null;
    const userId = betterUser ? betterUser.id : null;

    if (!betterUser) {
      setState(withBoard(emptyState(), serverBoard))
      setReady(true)
      return
    }

    const flat = loadFlat(userId!)
    const applicants = loadApplicants(userId!)
    const mailbox = loadMailbox(userId!)
    setState(withBoard({
      user: { id: betterUser.id, name: betterUser.name, email: betterUser.email },
      onboardingDone: resolveOnboardingDone(userId!, flat, applicants, mailbox),
      requirements: sanitizeRequirements(readJson<unknown>(requirementsKey(userId!), null)),
      flat,
      applicants,
      mailbox,
      invitedIds: loadInvited(userId!),
      invitations: loadInvitations(userId!),
      marks: loadMarks(userId!),
    }, serverBoard))
    setReady(true)
  }, [serverBoard, session.isPending, session.data?.user])

  useEffect(() => {
    if (!state.user) return
    writeJson(requirementsKey(state.user.id), state.requirements)
  }, [state.user, state.requirements])

  useEffect(() => {
    if (!state.user) return
    if (state.flat) writeJson(flatKey(state.user.id), state.flat)
    else removeKey(flatKey(state.user.id))
  }, [state.user, state.flat])

  useEffect(() => {
    if (!state.user) return
    writeJson(applicantsKey(state.user.id), state.applicants)
  }, [state.user, state.applicants])

  useEffect(() => {
    if (!state.user) return
    if (state.mailbox) writeJson(mailboxKey(state.user.id), state.mailbox)
    else removeKey(mailboxKey(state.user.id))
  }, [state.user, state.mailbox])

  useEffect(() => {
    if (!state.user) return
    writeJson(invitedKey(state.user.id), state.invitedIds)
  }, [state.user, state.invitedIds])

  useEffect(() => {
    if (!state.user) return
    writeJson(invitationsKey(state.user.id), state.invitations)
  }, [state.user, state.invitations])

  useEffect(() => {
    if (!state.user) return
    writeJson(marksKey(state.user.id), state.marks)
  }, [state.user, state.marks])

  const signup = useCallback(async (name: string, email: string, password: string) => {
    const user = await register(name, email, password)
    writeJson(onboardingKey(user.id), false)
    const sessionRes = await authClient.getSession()
    const sessionUser = sessionRes.data?.user
    if (sessionUser) {
      setState((current) => ({
        ...current,
        user: { id: sessionUser.id, name: sessionUser.name, email: sessionUser.email },
        onboardingDone: false,
      }))
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    await authenticate(email, password)
    const sessionRes = await authClient.getSession()
    const sessionUser = sessionRes.data?.user
    if (sessionUser) {
      setState((current) => ({
        ...current,
        user: { id: sessionUser.id, name: sessionUser.name, email: sessionUser.email },
      }))
    }
  }, [])

  const logout = useCallback(async () => {
    await authClient.signOut()
    removeKey(sessionKey)
    setState(emptyState())
  }, [])

  const completeOnboarding = useCallback(() => {
    setState((current) => {
      if (!current.user) return current
      writeJson(onboardingKey(current.user.id), true)
      return { ...current, onboardingDone: true }
    })
  }, [])

  const updateRequirements = useCallback((requirements: Requirements) => {
    setState((current) => ({ ...current, requirements }))
  }, [])

  const setFlat = useCallback(async (draft: Omit<LandlordFlat, 'id' | 'addedAt'>) => {
    let id = `flat-${Date.now().toString(36)}`;
    let addedAt = new Date().toISOString();
    try {
      const listing = await createListingAction({
        address: draft.address,
        rentAmount: draft.rentWarm,
        rooms: draft.rooms,
        title: draft.sourceNote || draft.address,
        district: draft.district,
        bezirk: draft.bezirk
      });
      id = listing.id;
      addedAt = listing.createdAt;
    } catch (e) {
      console.error("Failed to create listing in DB, falling back to local ID", e);
    }
    
    const flat: LandlordFlat = {
      ...draft,
      id,
      addedAt,
    }
    setState((current) => ({ ...current, flat, invitedIds: [], invitations: [], marks: {} }))
    return flat
  }, [])

  const clearFlat = useCallback(() => {
    setState((current) => ({
      ...current,
      flat: null,
      applicants: [],
      invitedIds: [],
      invitations: [],
      marks: {},
    }))
  }, [])

  const addApplicant = useCallback((draft: Omit<Applicant, 'id' | 'appliedAt'>) => {
    const id = `app-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
    const applicant = anonymizeApplicant({
      ...draft,
      id,
      appliedAt: new Date().toISOString(),
    })
    setState((current) => ({ ...current, applicants: [applicant, ...current.applicants] }))
    return applicant
  }, [])

  const removeApplicant = useCallback((id: string) => {
    setState((current) => {
      const { [id]: _removed, ...marks } = current.marks
      return {
        ...current,
        applicants: current.applicants.filter((item) => item.id !== id),
        invitedIds: current.invitedIds.filter((item) => item !== id),
        invitations: current.invitations.filter((item) => item.applicantId !== id),
        marks,
      }
    })
  }, [])

  const importApplicants = useCallback(
    (drafts: Omit<Applicant, 'id' | 'appliedAt'>[], mode: 'replace' | 'append' = 'replace') => {
      const stamped = drafts.map((item, index) => {
        const id = `imp-${Date.now().toString(36)}-${index}-${Math.random().toString(36).slice(2, 6)}`
        return anonymizeApplicant({
          ...item,
          id,
          appliedAt: new Date(Date.now() - index * 60_000).toISOString(),
        })
      })
      setState((current) => ({
        ...current,
        applicants: mode === 'append' ? [...stamped, ...current.applicants] : stamped,
        invitedIds: mode === 'replace' ? [] : current.invitedIds,
        invitations: mode === 'replace' ? [] : current.invitations,
        marks: mode === 'replace' ? {} : current.marks,
      }))
      return stamped.length
    },
    [],
  )

  const loadSampleApplicants = useCallback(() => {
    const stamped = SAMPLE_APPLICANTS.map((item, index) => {
      const id = `sample-${index}-${Date.now().toString(36)}`
      return anonymizeApplicant({
        ...item,
        id,
        appliedAt: new Date(Date.now() - index * 36e5).toISOString(),
      })
    })
    setState((current) => ({
      ...current,
      applicants: stamped,
      invitedIds: [],
      invitations: [],
      marks: {},
    }))
  }, [])

  const loadDemoBoard = useCallback(() => {
    const sample = LISTINGS[0]
    const flat: LandlordFlat = {
      id: `demo-flat-${Date.now().toString(36)}`,
      address: sample.address,
      district: sample.district,
      bezirk: sample.bezirk,
      lat: sample.lat,
      lng: sample.lng,
      rentWarm: sample.rentWarm,
      rooms: sample.rooms,
      sqm: sample.sqm,
      addedAt: new Date().toISOString(),
      berlin: sample.berlin,
      sourceNote: 'Demo listing for trying the landlord shortlist.',
    }
    const parsed = parseApplicantCsv(buildDemoCsv(100))
    const stamped = parsed.drafts.map((item, index) => {
      const id = `demo-${index}-${Date.now().toString(36)}`
      return anonymizeApplicant({
        ...item,
        id,
        appliedAt: new Date(Date.now() - index * 60_000).toISOString(),
        messagePreview: '[Demo applicant — free text is not used for scoring.]',
      })
    })
    setState((current) => ({
      ...current,
      flat,
      applicants: stamped,
      invitedIds: [],
      invitations: [],
      marks: {},
      mailbox: current.user
        ? {
            provider: 'gmail',
            email: current.user.email,
            connectedAt: new Date().toISOString(),
          }
        : current.mailbox,
    }))
  }, [])

  const connectMailbox = useCallback((provider: MailboxProvider) => {
    setState((current) => {
      if (!current.user) return current
      return {
        ...current,
        mailbox: {
          provider,
          email: current.user.email,
          connectedAt: new Date().toISOString(),
        },
      }
    })
  }, [])

  const disconnectMailbox = useCallback(() => {
    setState((current) => ({ ...current, mailbox: null }))
  }, [])

  const markInvited = useCallback((ids: string[]) => {
    setState((current) => {
      const next = new Set(current.invitedIds)
      for (const id of ids) next.add(id)
      return { ...current, invitedIds: [...next] }
    })
  }, [])

  const scheduleInvitations = useCallback(
    (input: { applicantIds: string[]; date: string; time: string }) => {
      const sentAt = new Date().toISOString()
      setState((current) => {
        const invited = new Set(current.invitedIds)
        const additions: Invitation[] = []
        for (const applicantId of input.applicantIds) {
          if (invited.has(applicantId)) continue
          invited.add(applicantId)
          additions.push({
            id: `inv-${sentAt}-${applicantId}`,
            applicantId,
            date: input.date,
            time: input.time,
            sentAt,
          })
        }
        if (additions.length === 0) return current
        return {
          ...current,
          invitedIds: [...invited],
          invitations: [...additions, ...current.invitations],
        }
      })
    },
    [],
  )

  const rescheduleSlot = useCallback(
    (slot: { date: string; time: string }, next: { date: string; time: string }) => {
      if (!next.date || !next.time) return
      if (slot.date === next.date && slot.time === next.time) return
      setState((current) => ({
        ...current,
        invitations: current.invitations.map((item) =>
          item.date === slot.date && item.time === slot.time
            ? { ...item, date: next.date, time: next.time }
            : item,
        ),
      }))
    },
    [],
  )

  const cancelInvitation = useCallback((id: string) => {
    setState((current) => {
      const invitation = current.invitations.find((item) => item.id === id)
      if (!invitation) return current
      return {
        ...current,
        invitations: current.invitations.filter((item) => item.id !== id),
        invitedIds: current.invitedIds.filter((item) => item !== invitation.applicantId),
      }
    })
  }, [])

  const cancelSlot = useCallback((slot: { date: string; time: string }) => {
    setState((current) => {
      const removed = new Set(
        current.invitations
          .filter((item) => item.date === slot.date && item.time === slot.time)
          .map((item) => item.applicantId),
      )
      if (removed.size === 0) return current
      return {
        ...current,
        invitations: current.invitations.filter(
          (item) => item.date !== slot.date || item.time !== slot.time,
        ),
        invitedIds: current.invitedIds.filter((item) => !removed.has(item)),
      }
    })
  }, [])

  const clearInvited = useCallback(() => {
    setState((current) => ({ ...current, invitedIds: [], invitations: [] }))
  }, [])

  const setApplicantMark = useCallback((id: string, mark: ApplicantMark | null) => {
    setState((current) => {
      if (!mark) {
        const { [id]: _removed, ...rest } = current.marks
        return { ...current, marks: rest }
      }
      return { ...current, marks: { ...current.marks, [id]: mark } }
    })
  }, [])

  const value = useMemo<SessionValue>(
    () => ({
      ready,
      ...state,
      signup,
      login,
      logout,
      completeOnboarding,
      updateRequirements,
      setFlat,
      clearFlat,
      addApplicant,
      importApplicants,
      removeApplicant,
      loadSampleApplicants,
      loadDemoBoard,
      connectMailbox,
      disconnectMailbox,
      markInvited,
      scheduleInvitations,
      rescheduleSlot,
      cancelInvitation,
      cancelSlot,
      clearInvited,
      setApplicantMark,
    }),
    [
      ready,
      state,
      signup,
      login,
      logout,
      completeOnboarding,
      updateRequirements,
      setFlat,
      clearFlat,
      addApplicant,
      importApplicants,
      removeApplicant,
      loadSampleApplicants,
      loadDemoBoard,
      connectMailbox,
      disconnectMailbox,
      markInvited,
      scheduleInvitations,
      rescheduleSlot,
      cancelInvitation,
      cancelSlot,
      clearInvited,
      setApplicantMark,
    ],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

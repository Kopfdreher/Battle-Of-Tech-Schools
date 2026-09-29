import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { SAMPLE_APPLICANTS } from '../data/applicants.ts'
import { LISTINGS } from '../data/listings.ts'
import { defaultRequirements, sanitizeRequirements } from '../data/requirements.ts'
import { authenticate, findUser, register } from '../lib/auth.ts'
import { buildDemoCsv, parseApplicantCsv } from '../lib/csv.ts'
import {
  applicantsKey,
  flatKey,
  invitedKey,
  mailboxKey,
  marksKey,
  readJson,
  removeKey,
  requirementsKey,
  sessionKey,
  writeJson,
} from '../lib/storage.ts'
import type { Applicant, LandlordFlat, MailboxConnection, MailboxProvider, Requirements, User } from '../types.ts'
import { SessionContext, type ApplicantMark, type SessionValue } from './session.ts'

type SessionState = {
  user: User | null
  requirements: Requirements
  flat: LandlordFlat | null
  applicants: Applicant[]
  mailbox: MailboxConnection | null
  invitedIds: string[]
  marks: Record<string, ApplicantMark>
}

function loadFlat(userId: string) {
  const raw = readJson<LandlordFlat | null>(flatKey(userId), null)
  return raw && typeof raw.id === 'string' ? raw : null
}

function loadApplicants(userId: string) {
  const raw = readJson<Applicant[]>(applicantsKey(userId), [])
  return Array.isArray(raw) ? raw.filter((item) => item && typeof item.id === 'string') : []
}

function loadMailbox(userId: string) {
  const raw = readJson<MailboxConnection | null>(mailboxKey(userId), null)
  return raw && typeof raw.email === 'string' ? raw : null
}

function loadInvited(userId: string) {
  const raw = readJson<string[]>(invitedKey(userId), [])
  return Array.isArray(raw) ? raw.filter((id) => typeof id === 'string') : []
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
    requirements: defaultRequirements,
    flat: null,
    applicants: [],
    mailbox: null,
    invitedIds: [],
    marks: {},
  }
}

function loadState(): SessionState {
  const userId = readJson<string | null>(sessionKey, null)
  const user = userId ? findUser(userId) : null
  if (!user) return emptyState()
  return {
    user,
    requirements: sanitizeRequirements(readJson<unknown>(requirementsKey(user.id), null)),
    flat: loadFlat(user.id),
    applicants: loadApplicants(user.id),
    mailbox: loadMailbox(user.id),
    invitedIds: loadInvited(user.id),
    marks: loadMarks(user.id),
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>(loadState)

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
    writeJson(marksKey(state.user.id), state.marks)
  }, [state.user, state.marks])

  const signup = useCallback(async (name: string, email: string, password: string) => {
    const user = await register(name, email, password)
    writeJson(sessionKey, user.id)
    setState({ ...emptyState(), user, requirements: defaultRequirements })
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const user = await authenticate(email, password)
    writeJson(sessionKey, user.id)
    setState({
      user,
      requirements: sanitizeRequirements(readJson<unknown>(requirementsKey(user.id), null)),
      flat: loadFlat(user.id),
      applicants: loadApplicants(user.id),
      mailbox: loadMailbox(user.id),
      invitedIds: loadInvited(user.id),
      marks: loadMarks(user.id),
    })
  }, [])

  const logout = useCallback(() => {
    removeKey(sessionKey)
    setState(emptyState())
  }, [])

  const updateRequirements = useCallback((requirements: Requirements) => {
    setState((current) => ({ ...current, requirements }))
  }, [])

  const setFlat = useCallback((draft: Omit<LandlordFlat, 'id' | 'addedAt'>) => {
    const flat: LandlordFlat = {
      ...draft,
      id: `flat-${Date.now().toString(36)}`,
      addedAt: new Date().toISOString(),
    }
    setState((current) => ({ ...current, flat, invitedIds: [], marks: {} }))
    return flat
  }, [])

  const clearFlat = useCallback(() => {
    setState((current) => ({ ...current, flat: null, applicants: [], invitedIds: [], marks: {} }))
  }, [])

  const addApplicant = useCallback((draft: Omit<Applicant, 'id' | 'appliedAt'>) => {
    const applicant: Applicant = {
      ...draft,
      id: `app-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      appliedAt: new Date().toISOString(),
    }
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
        marks,
      }
    })
  }, [])

  const importApplicants = useCallback(
    (drafts: Omit<Applicant, 'id' | 'appliedAt'>[], mode: 'replace' | 'append' = 'replace') => {
      const stamped = drafts.map((item, index) => ({
        ...item,
        id: `imp-${Date.now().toString(36)}-${index}-${Math.random().toString(36).slice(2, 6)}`,
        appliedAt: new Date(Date.now() - index * 60_000).toISOString(),
      }))
      setState((current) => ({
        ...current,
        applicants: mode === 'append' ? [...stamped, ...current.applicants] : stamped,
        invitedIds: mode === 'replace' ? [] : current.invitedIds,
        marks: mode === 'replace' ? {} : current.marks,
      }))
      return stamped.length
    },
    [],
  )

  const loadSampleApplicants = useCallback(() => {
    const stamped = SAMPLE_APPLICANTS.map((item, index) => ({
      ...item,
      id: `sample-${index}-${Date.now().toString(36)}`,
      appliedAt: new Date(Date.now() - index * 36e5).toISOString(),
    }))
    setState((current) => ({ ...current, applicants: stamped, invitedIds: [], marks: {} }))
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
    const stamped = parsed.drafts.map((item, index) => ({
      ...item,
      id: `demo-${index}-${Date.now().toString(36)}`,
      appliedAt: new Date(Date.now() - index * 60_000).toISOString(),
      messagePreview: '[Demo applicant — free text is not used for scoring.]',
    }))
    setState((current) => ({
      ...current,
      flat,
      applicants: stamped,
      invitedIds: [],
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

  const clearInvited = useCallback(() => {
    setState((current) => ({ ...current, invitedIds: [] }))
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
      ...state,
      signup,
      login,
      logout,
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
      clearInvited,
      setApplicantMark,
    }),
    [
      state,
      signup,
      login,
      logout,
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
      clearInvited,
      setApplicantMark,
    ],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

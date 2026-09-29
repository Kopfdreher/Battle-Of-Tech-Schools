import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { defaultRequirements, sanitizeRequirements } from '../data/requirements.ts'
import { authenticate, findUser, register } from '../lib/auth.ts'
import { sameAddress } from '../lib/places.ts'
import { placesKey, readJson, removeKey, requirementsKey, sessionKey, writeJson } from '../lib/storage.ts'
import type { Requirements, SavedPlace, User } from '../types.ts'
import { SessionContext, type SessionValue } from './session.ts'

type SessionState = {
  user: User | null
  requirements: Requirements
  places: SavedPlace[]
}

function loadPlaces(userId: string) {
  const raw = readJson<SavedPlace[]>(placesKey(userId), [])
  return Array.isArray(raw) ? raw.filter((place) => place && typeof place.id === 'string') : []
}

function loadState(): SessionState {
  const userId = readJson<string | null>(sessionKey, null)
  const user = userId ? findUser(userId) : null
  if (!user) {
    return { user: null, requirements: defaultRequirements, places: [] }
  }
  return {
    user,
    requirements: sanitizeRequirements(readJson<unknown>(requirementsKey(user.id), null)),
    places: loadPlaces(user.id),
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
    writeJson(placesKey(state.user.id), state.places)
  }, [state.user, state.places])

  const signup = useCallback(async (name: string, email: string, password: string) => {
    const user = await register(name, email, password)
    writeJson(sessionKey, user.id)
    setState({ user, requirements: defaultRequirements, places: [] })
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const user = await authenticate(email, password)
    writeJson(sessionKey, user.id)
    setState({
      user,
      requirements: sanitizeRequirements(readJson<unknown>(requirementsKey(user.id), null)),
      places: loadPlaces(user.id),
    })
  }, [])

  const logout = useCallback(() => {
    removeKey(sessionKey)
    setState({ user: null, requirements: defaultRequirements, places: [] })
  }, [])

  const updateRequirements = useCallback((requirements: Requirements) => {
    setState((current) => ({ ...current, requirements }))
  }, [])

  const addPlace = useCallback((draft: Omit<SavedPlace, 'id' | 'addedAt'>) => {
    const place: SavedPlace = {
      ...draft,
      id: `place-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      addedAt: new Date().toISOString(),
    }
    setState((current) => {
      const withoutDupes = current.places.filter((item) => !sameAddress(item.address, place.address))
      return { ...current, places: [place, ...withoutDupes] }
    })
    return place
  }, [])

  const removePlace = useCallback((id: string) => {
    setState((current) => ({
      ...current,
      places: current.places.filter((place) => place.id !== id),
    }))
  }, [])

  const value = useMemo<SessionValue>(
    () => ({
      ...state,
      signup,
      login,
      logout,
      updateRequirements,
      addPlace,
      removePlace,
    }),
    [state, signup, login, logout, updateRequirements, addPlace, removePlace],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

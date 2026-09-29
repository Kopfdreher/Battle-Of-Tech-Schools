import { createContext, useContext } from 'react'
import type { Requirements, SavedPlace, User } from '../types.ts'

export type SessionValue = {
  user: User | null
  requirements: Requirements
  places: SavedPlace[]
  signup: (name: string, email: string, password: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  updateRequirements: (requirements: Requirements) => void
  addPlace: (draft: Omit<SavedPlace, 'id' | 'addedAt'>) => SavedPlace
  removePlace: (id: string) => void
}

export const SessionContext = createContext<SessionValue | null>(null)

export function useSession() {
  const value = useContext(SessionContext)
  if (!value) throw new Error('useSession must be used within SessionProvider')
  return value
}

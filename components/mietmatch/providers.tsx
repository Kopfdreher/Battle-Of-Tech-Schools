'use client'

import { useSearchParams } from 'next/navigation'
import { createContext, Suspense, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { LocaleProvider } from './context/LocaleContext'
import { SessionProvider } from './context/SessionContext'
import type { Board } from '@/lib/board'

export type ListingChoice = { id: string; label: string }

const ListingChoices = createContext<ListingChoice[]>([])

export function useListingChoices() {
  return useContext(ListingChoices)
}

function ListingSync({ onPick }: { onPick: (id: string | null) => void }) {
  const id = useSearchParams().get('listing')
  useEffect(() => {
    onPick(id)
  }, [id, onPick])
  return null
}

function BoardSession({ board, children }: { board: Board | null; children: ReactNode }) {
  const [requested, setRequested] = useState<string | null>(null)
  const onPick = useCallback((id: string | null) => setRequested(id), [])
  const picked = useRef<string | null>(null)
  if (requested) picked.current = requested

  const sets = board?.sets ?? []
  const active = sets.find((set) => set.flat.id === picked.current) ?? sets[0] ?? null
  if (active) picked.current = active.flat.id

  const serverBoard = useMemo(
    () => (active ? { flat: active.flat, applicants: active.applicants } : null),
    [active],
  )
  const choices = useMemo(
    () => sets.map((set) => ({ id: set.flat.id, label: set.flat.address })),
    [sets],
  )

  return (
    <ListingChoices.Provider value={choices}>
      <Suspense fallback={null}>
        <ListingSync onPick={onPick} />
      </Suspense>
      <SessionProvider serverBoard={serverBoard}>{children}</SessionProvider>
    </ListingChoices.Provider>
  )
}

export function MietProviders({ board, children }: { board: Board | null; children: ReactNode }) {
  return (
    <LocaleProvider>
      <BoardSession board={board}>{children}</BoardSession>
    </LocaleProvider>
  )
}

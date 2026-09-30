'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { Navigate } from './nav'
import { AppShell } from './components/AppShell'
import { useSession } from './context/session'
import { useListingChoices } from './providers'

export function Frame({ children }: { children: ReactNode }) {
  const { user, ready, onboardingDone, flat } = useSession()
  const listings = useListingChoices()
  const pathname = usePathname()

  if (!ready) return null
  if (!user) return <Navigate to="/login" />
  if (!onboardingDone) return <Navigate to="/onboarding" />

  return (
    <AppShell>
      {pathname === '/' && listings.length > 1 ? (
        <div className="listing-switch">
          {listings.map((listing) => (
            <Link
              key={listing.id}
              className={flat?.id === listing.id ? 'filter-chip on' : 'filter-chip'}
              href={`/?listing=${listing.id}`}
            >
              {listing.label}
            </Link>
          ))}
        </div>
      ) : null}
      {children}
    </AppShell>
  )
}

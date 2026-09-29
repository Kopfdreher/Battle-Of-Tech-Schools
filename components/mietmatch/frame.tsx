'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { Navigate } from './nav'
import { AppShell } from './components/AppShell'
import { useSession } from './context/session'
import { useListingChoices } from './providers'

export function Frame({ children }: { children: ReactNode }) {
  const { user, ready, flat } = useSession()
  const listings = useListingChoices()
  const pathname = usePathname()

  if (!ready) return null
  if (!user) return <Navigate to="/login" />

  return (
    <AppShell>
      {pathname === '/' ? (
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
          <Link className="filter-chip" href="/review">
            Database table
          </Link>
        </div>
      ) : null}
      {children}
    </AppShell>
  )
}

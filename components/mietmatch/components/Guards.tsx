'use client'

import { Navigate, Outlet } from '@/components/mietmatch/nav'
import type { ReactNode } from 'react'
import { useSession } from '../context/session'

export function GuestOnly({ children }: { children: ReactNode }) {
  const { user, ready, onboardingDone } = useSession()
  if (!ready) return null
  if (user && !onboardingDone) return <Navigate to="/onboarding" />
  if (user) return <Navigate to="/" />
  return children
}

export function RequireUser() {
  const { user, ready, onboardingDone } = useSession()
  if (!ready) return null
  if (!user) return <Navigate to="/login" />
  if (!onboardingDone) return <Navigate to="/onboarding" />
  return <Outlet />
}

export function HomeRedirect() {
  const { user, ready, onboardingDone } = useSession()
  if (!ready) return null
  if (!user) return <Navigate to="/login" />
  if (!onboardingDone) return <Navigate to="/onboarding" />
  return <Navigate to="/" />
}

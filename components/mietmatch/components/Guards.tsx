'use client'

import { Navigate, Outlet } from '@/components/mietmatch/nav'
import type { ReactNode } from 'react'
import { useSession } from '../context/session'

export function GuestOnly({ children }: { children: ReactNode }) {
  const { user, ready } = useSession()
  if (!ready) return null
  if (user) return <Navigate to="/" />
  return children
}

export function RequireUser() {
  const { user, ready } = useSession()
  if (!ready) return null
  if (!user) return <Navigate to="/login" />
  return <Outlet />
}

export function HomeRedirect() {
  const { user, ready } = useSession()
  if (!ready) return null
  if (!user) return <Navigate to="/login" />
  return <Navigate to="/" />
}

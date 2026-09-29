import { Navigate, Outlet } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { useSession } from '../context/session.ts'

export function GuestOnly({ children }: { children: ReactNode }) {
  const { user } = useSession()
  if (user) return <Navigate to="/" />
  return children
}

export function RequireUser() {
  const { user } = useSession()
  if (!user) return <Navigate to="/login" />
  return <Outlet />
}

export function HomeRedirect() {
  const { user } = useSession()
  if (!user) return <Navigate to="/login" />
  return <Navigate to="/" />
}

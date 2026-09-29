import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { AppShell } from '../components/AppShell.tsx'
import { findUser } from '../lib/auth.ts'
import { readJson, sessionKey } from '../lib/storage.ts'

export const Route = createFileRoute('/_app')({
  beforeLoad: () => {
    const userId = readJson<string | null>(sessionKey, null)
    const user = userId ? findUser(userId) : null
    if (!user) {
      throw redirect({ to: '/login' })
    }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}

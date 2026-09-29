import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { useSession } from '../context/session.ts'
import { Brand } from './Brand.tsx'
import { ProfileMenu } from './ProfileMenu.tsx'

const links = [
  { to: '/', label: 'Kiezboard', end: true },
  { to: '/address', label: 'Add address', end: false },
  { to: '/requirements', label: 'Requirements', end: false },
] as const

export function AppShell({ children }: { children?: ReactNode }) {
  const { user } = useSession()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  if (!user) return null

  return (
    <div className="shell">
      <aside className="side">
        <Brand />
        <nav className="nav" aria-label="Main">
          {links.map((link) => {
            const active = link.end ? pathname === link.to : pathname.startsWith(link.to)
            return (
              <Link
                key={link.to}
                to={link.to}
                className={active ? 'nav-link active' : 'nav-link'}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>
        <ProfileMenu />
      </aside>
      <main className="main">{children ?? <Outlet />}</main>
    </div>
  )
}

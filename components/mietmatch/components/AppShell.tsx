'use client'

import { Link, Outlet, useRouterState } from '@/components/mietmatch/nav'
import type { ReactNode } from 'react'
import { useLocale } from '../context/LocaleContext'
import { useSession } from '../context/session'
import { Brand } from './Brand'
import { LanguageSwitcher } from './LanguageSwitcher'
import { ProfileMenu } from './ProfileMenu'

export function AppShell({ children }: { children?: ReactNode }) {
  const { user } = useSession()
  const { t } = useLocale()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  if (!user) return null

  const links = [
    { to: '/', label: t('nav.shortlist'), end: true },
    { to: '/appointments', label: t('nav.appointments'), end: false },
    { to: '/import', label: t('nav.import'), end: false },
    { to: '/address', label: t('nav.address'), end: false },
    { to: '/requirements', label: t('nav.criteria'), end: false },
  ] as const

  return (
    <div className="shell">
      <aside className="side">
        <div className="side-top">
          <Brand />
          <LanguageSwitcher compact />
        </div>
        <nav className="nav" aria-label={t('nav.main')}>
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
        <div className="side-foot">
          <img className="side-mascot" src="/mascot.png" alt="" />
          <ProfileMenu />
        </div>
      </aside>
      <main className="main">{children ?? <Outlet />}</main>
    </div>
  )
}

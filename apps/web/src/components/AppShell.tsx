import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { useLocale } from '../context/LocaleContext.tsx'
import { useSession } from '../context/session.ts'
import { Brand } from './Brand.tsx'
import { LanguageSwitcher } from './LanguageSwitcher.tsx'
import { ProfileMenu } from './ProfileMenu.tsx'

export function AppShell({ children }: { children?: ReactNode }) {
  const { user } = useSession()
  const { t } = useLocale()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  if (!user) return null

  const links = [
    { to: '/', label: t('nav.shortlist'), end: true },
    { to: '/import', label: t('nav.import'), end: false },
    { to: '/address', label: t('nav.address'), end: false },
    { to: '/requirements', label: t('nav.criteria'), end: false },
  ] as const

  return (
    <div className="shell">
      <aside className="side">
        <Brand />
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
          <LanguageSwitcher />
          <ProfileMenu />
        </div>
      </aside>
      <main className="main">{children ?? <Outlet />}</main>
    </div>
  )
}

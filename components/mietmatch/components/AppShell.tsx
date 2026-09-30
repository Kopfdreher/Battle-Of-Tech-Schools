'use client'

import { Link, Outlet, useRouterState } from '@/components/mietmatch/nav'
import type { ReactNode } from 'react'
import { useLocale } from '../context/LocaleContext'
import { useSession } from '../context/session'
import { Brand } from './Brand'
import { LanguageSwitcher } from './LanguageSwitcher'
import { ProfileMenu } from './ProfileMenu'

function NavIcon({ name }: { name: 'shortlist' | 'appointments' | 'import' | 'address' | 'criteria' | 'settings' }) {
  const common = {
    viewBox: '0 0 24 24',
    width: 18,
    height: 18,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
  }

  if (name === 'shortlist') {
    return (
      <svg {...common}>
        <path d="M8 6h13M8 12h13M8 18h13" />
        <path d="M3 6h.01M3 12h.01M3 18h.01" />
      </svg>
    )
  }
  if (name === 'appointments') {
    return (
      <svg {...common}>
        <rect x="3.5" y="5" width="17" height="15" rx="2" />
        <path d="M8 3.5v3M16 3.5v3M3.5 10h17" />
      </svg>
    )
  }
  if (name === 'import') {
    return (
      <svg {...common}>
        <path d="M12 4v10" />
        <path d="M8 10l4 4 4-4" />
        <path d="M5 18h14" />
      </svg>
    )
  }
  if (name === 'address') {
    return (
      <svg {...common}>
        <path d="M5 11.5 12 5l7 6.5V20H5v-8.5Z" />
        <path d="M10 20v-6h4v6" />
      </svg>
    )
  }
  if (name === 'criteria') {
    return (
      <svg {...common}>
        <path d="M4 7h10M14 7a2 2 0 1 0 4 0 2 2 0 0 0-4 0ZM20 17H10M10 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z" />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 4.5v1.5M12 18v1.5M4.5 12H6M18 12h1.5M6.8 6.8l1.1 1.1M16.1 16.1l1.1 1.1M6.8 17.2l1.1-1.1M16.1 7.9l1.1-1.1" />
    </svg>
  )
}

export function AppShell({ children }: { children?: ReactNode }) {
  const { user } = useSession()
  const { t } = useLocale()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  if (!user) return null

  const links = [
    { to: '/', label: t('nav.shortlist'), end: true, icon: 'shortlist' as const },
    { to: '/appointments', label: t('nav.appointments'), end: false, icon: 'appointments' as const },
    { to: '/import', label: t('nav.import'), end: false, icon: 'import' as const },
    { to: '/address', label: t('nav.address'), end: false, icon: 'address' as const },
    { to: '/requirements', label: t('nav.criteria'), end: false, icon: 'criteria' as const },
    { to: '/settings', label: t('nav.settings'), end: false, icon: 'settings' as const },
  ]

  return (
    <div className="shell">
      <aside className="side">
        <div className="side-top">
          <Brand />
          <LanguageSwitcher compact />
        </div>
        <nav className="nav" aria-label={t('nav.main')}>
          <p className="nav-label">{t('nav.main')}</p>
          {links.map((link) => {
            const active = link.end ? pathname === link.to : pathname.startsWith(link.to)
            return (
              <Link
                key={link.to}
                to={link.to}
                className={active ? 'nav-link active' : 'nav-link'}
              >
                <span className="nav-ico">
                  <NavIcon name={link.icon} />
                </span>
                <span className="nav-text">{link.label}</span>
              </Link>
            )
          })}
        </nav>
        <div className="side-foot">
          <ProfileMenu />
        </div>
      </aside>
      <main className="main">{children ?? <Outlet />}</main>
    </div>
  )
}

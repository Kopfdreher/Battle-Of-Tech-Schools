'use client'

import type { ReactNode } from 'react'
import { Brand } from './Brand'
import { LanguageSwitcher } from './LanguageSwitcher'

export function AuthLayout({
  children,
  kicker,
}: {
  children: ReactNode
  kicker?: string
}) {
  return (
    <div className="auth" aria-label="BesichtiGo">
      <header className="auth-top">
        <div className="auth-brand-frame">
          <Brand size="sm" />
        </div>
      </header>
      <main className="auth-panel">
        <div className="auth-card panel">
          <div className="auth-card-head">
            {kicker ? <p className="kicker">{kicker}</p> : <span />}
            <LanguageSwitcher compact />
          </div>
          {children}
        </div>
      </main>
    </div>
  )
}

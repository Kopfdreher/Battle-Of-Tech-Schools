'use client'

import { useState } from 'react'
import { Link } from '@/components/mietmatch/nav'
import { useLocale } from '../context/LocaleContext'
import { useSession } from '../context/session'
import type { MailboxProvider } from '../types'

export function SettingsPage() {
  const { user, mailbox, connectMailbox, disconnectMailbox } = useSession()
  const { t } = useLocale()
  const [note, setNote] = useState<string | null>(null)

  function revoke() {
    disconnectMailbox()
    setNote(t('settings.mailbox.revoked'))
  }

  function allow(provider: MailboxProvider) {
    connectMailbox(provider)
    setNote(t('settings.mailbox.connected', { provider: provider === 'gmail' ? 'Gmail' : 'Outlook' }))
  }

  return (
    <div className="settings-page">
      <header className="page-head">
        <p className="kicker">{t('settings.kicker')}</p>
        <h1>{t('settings.title')}</h1>
        <p className="lede">{t('settings.lede')}</p>
      </header>

      <section className="panel settings-card">
        <p className="kicker">{t('settings.account.kicker')}</p>
        <h2>{t('settings.account.title')}</h2>
        <p className="lede">
          {user?.name} · {user?.email}
        </p>
      </section>

      <section className="panel settings-card">
        <p className="kicker">{t('settings.mailbox.kicker')}</p>
        <h2>{t('settings.mailbox.title')}</h2>
        <p className="lede">{t('settings.mailbox.lede')}</p>

        {mailbox ? (
          <div className="mailbox-status">
            <p>
              <strong>{mailbox.provider === 'gmail' ? 'Gmail' : 'Outlook'}</strong>
              {' · '}
              {mailbox.email}
            </p>
            <p className="hint">{t('settings.mailbox.active')}</p>
            <div className="place-actions">
              <button type="button" className="btn" onClick={revoke}>
                {t('settings.mailbox.revoke')}
              </button>
            </div>
          </div>
        ) : (
          <div className="mailbox-status">
            <p className="hint">{t('settings.mailbox.none')}</p>
            <div className="place-actions">
              <button type="button" className="btn primary" onClick={() => allow('gmail')}>
                {t('settings.mailbox.gmail')}
              </button>
              <button type="button" className="btn" onClick={() => allow('outlook')}>
                {t('settings.mailbox.outlook')}
              </button>
            </div>
          </div>
        )}
        {note ? <p className="hint import-ok">{note}</p> : null}
      </section>

      <section className="panel settings-card">
        <p className="kicker">{t('settings.csv.kicker')}</p>
        <h2>{t('settings.csv.title')}</h2>
        <p className="lede">{t('settings.csv.lede')}</p>
        <div className="place-actions">
          <Link className="btn primary" to="/import">
            {t('settings.csv.open')}
          </Link>
        </div>
      </section>

      <p className="hint settings-retention">{t('onboarding.retention')}</p>
    </div>
  )
}

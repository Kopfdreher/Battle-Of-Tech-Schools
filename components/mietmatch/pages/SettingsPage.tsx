'use client'

import { useState } from 'react'
import { useLocale } from '../context/LocaleContext'
import { useSession } from '../context/session'
import type { MailboxProvider } from '../types'

export function SettingsPage() {
  const { user, mailbox, connectMailbox, disconnectMailbox, namesVisible, setNamesVisible } =
    useSession()
  const { t } = useLocale()
  const [note, setNote] = useState<string | null>(null)

  function revoke() {
    disconnectMailbox()
    setNote(t('settings.mailbox.revoked'))
  }

  function allow(provider: MailboxProvider) {
    connectMailbox(provider)
    setNote(
      t('settings.mailbox.connected', { provider: provider === 'gmail' ? 'Gmail' : 'Outlook' }),
    )
  }

  return (
    <div className="settings-page">
      <header className="settings-head">
        <p className="kicker">{t('settings.kicker')}</p>
        <h1>{t('settings.title')}</h1>
      </header>

      <div className="settings-grid">
        <section className="settings-row">
          <div className="settings-row-copy">
            <p className="kicker">{t('settings.account.kicker')}</p>
            <h2>{user?.name}</h2>
            <p className="hint">{user?.email}</p>
          </div>
        </section>

        <section className="settings-row">
          <div className="settings-row-copy">
            <p className="kicker">{t('privacy.kicker')}</p>
            <h2>{t('privacy.title')}</h2>
          </div>
          <div className="settings-toggle">
            <span>{t('privacy.toggle')}</span>
            <button
              type="button"
              className={namesVisible ? 'req-switch on' : 'req-switch'}
              role="switch"
              aria-checked={namesVisible}
              aria-label={t('privacy.toggle')}
              onClick={() => setNamesVisible(!namesVisible)}
            >
              <span className="req-switch-knob" />
            </button>
          </div>
        </section>

        <section className="settings-row">
          <div className="settings-row-copy">
            <p className="kicker">{t('settings.mailbox.kicker')}</p>
            <h2>{t('settings.mailbox.title')}</h2>
            {mailbox ? (
              <p className="hint">
                {mailbox.provider === 'gmail' ? 'Gmail' : 'Outlook'} · {mailbox.email}
              </p>
            ) : (
              <p className="hint">{t('settings.mailbox.none')}</p>
            )}
          </div>
          <div className="settings-row-actions">
            {mailbox ? (
              <button type="button" className="btn slim ghost" onClick={revoke}>
                {t('settings.mailbox.revoke')}
              </button>
            ) : (
              <>
                <button type="button" className="btn slim primary" onClick={() => allow('gmail')}>
                  {t('settings.mailbox.gmail')}
                </button>
                <button type="button" className="btn slim" onClick={() => allow('outlook')}>
                  {t('settings.mailbox.outlook')}
                </button>
              </>
            )}
          </div>
          {note ? <p className="hint import-ok settings-note">{note}</p> : null}
        </section>
      </div>
    </div>
  )
}

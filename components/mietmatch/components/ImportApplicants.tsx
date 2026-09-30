'use client'

import { useRouter } from 'next/navigation'
import { useId, useRef, useState } from 'react'
import { Link } from '@/components/mietmatch/nav'
import { syncApplicationsAction, syncCsvAction } from '@/app/actions/n8n'
import { useLocale } from '../context/LocaleContext'
import { useSession } from '../context/session'
import { parseApplicantCsv } from '../lib/csv'
import type { MailboxProvider } from '../types'

export function ImportApplicants() {
  const { user, mailbox, connectMailbox, disconnectMailbox, importApplicants, flat } = useSession()
  const { t } = useLocale()
  const router = useRouter()
  const fileId = useId()
  const fileRef = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<'replace' | 'append'>('replace')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [consentFor, setConsentFor] = useState<MailboxProvider | null>(null)

  async function applyCsv(text: string) {
    setError(null)
    setMessage("Sending CSV to n8n for processing...")
    
    // We send the raw CSV text directly to the new n8n webhook
    await syncCsvAction(text, mode)
    
    setMessage("Processing complete! Refreshing data...")
    await new Promise(resolve => setTimeout(resolve, 5000))
    router.refresh()
  }

  function onFile(file: File | null) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => await applyCsv(String(reader.result ?? ''))
    reader.onerror = () => setError(t('import.csv.readError'))
    reader.readAsText(file)
  }

  function onConsentAllow() {
    if (!consentFor) return
    connectMailbox(consentFor)
    setConsentFor(null)
  }

  async function startInboxScan() {
    setError(null)
    setMessage(t('import.email.reading'))
    try {
      if (user) {
        await syncApplicationsAction(flat?.id || '', user.email)
        setMessage("Sync triggered successfully! Waiting for n8n to finish...")
        await new Promise(resolve => setTimeout(resolve, 5000))
        setMessage("Sync complete! Refreshing data...")
        router.refresh()
      }
    } catch (e) {
      setError("Failed to trigger N8n workflow")
    }
  }

  return (
    <div className="import-stack">
      <div className="import-modes">
        <p className="kicker">{t('import.mode.kicker')}</p>
        <div className="import-mode-row">
          <label className="check-row">
            <input
              type="radio"
              name="import-mode"
              checked={mode === 'replace'}
              onChange={() => setMode('replace')}
            />
            <span>{t('import.mode.replace')}</span>
          </label>
          <label className="check-row">
            <input
              type="radio"
              name="import-mode"
              checked={mode === 'append'}
              onChange={() => setMode('append')}
            />
            <span>{t('import.mode.append')}</span>
          </label>
        </div>
      </div>

      <div className="import-grid">
        <section className="import-panel" id="email-import" aria-label={t('import.email.title')}>
          <div className="import-panel-head">
            <p className="kicker">{t('import.email.kicker')}</p>
            <h2>{t('import.email.title')}</h2>
            <p className="import-revoke">
              {t('import.email.revokeBefore')}
              <Link to="/settings">{t('import.email.settingsLink')}</Link>
              {t('import.email.revokeAfter')}
            </p>
          </div>
          {mailbox ? (
            <div className="mailbox-status">
              <p>
                <strong>{mailbox.provider === 'gmail' ? 'Gmail' : 'Outlook'}</strong> · {mailbox.email}
              </p>
              <div className="import-actions">
                <button type="button" className="btn slim primary" onClick={startInboxScan}>
                  {t('import.email.read')}
                </button>
                <button
                  type="button"
                  className="btn slim ghost"
                  onClick={() => {
                    disconnectMailbox()
                    setMessage(t('settings.mailbox.revoked'))
                  }}
                >
                  {t('import.email.disconnect')}
                </button>
              </div>
            </div>
          ) : (
            <div className="import-actions">
              <button type="button" className="btn slim primary" onClick={() => setConsentFor('gmail')}>
                {t('import.email.gmail')}
              </button>
              <button type="button" className="btn slim" onClick={() => setConsentFor('outlook')}>
                {t('import.email.outlook')}
              </button>
            </div>
          )}
        </section>

        <section className="import-panel" id="csv-import" aria-label={t('import.csv.title')}>
          <div className="import-panel-head">
            <p className="kicker">{t('import.csv.kicker')}</p>
            <h2>{t('import.csv.title')}</h2>
            <p className="import-revoke">{t('import.csv.lede')}</p>
          </div>
          <input
            ref={fileRef}
            id={fileId}
            className="sr-only"
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => {
              onFile(event.target.files?.[0] ?? null)
              event.target.value = ''
            }}
          />
          <div className="import-actions">
            <button type="button" className="btn slim primary" onClick={() => fileRef.current?.click()}>
              {t('import.csv.upload')}
            </button>
          </div>
        </section>
      </div>

      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}
      {message ? <p className="hint import-ok">{message}</p> : null}

      {consentFor ? (
        <div className="backdrop" role="dialog" aria-modal="true" aria-labelledby="consent-title">
          <div className="dialog panel">
            <p className="kicker">{consentFor === 'gmail' ? 'Gmail' : 'Outlook'}</p>
            <h2 id="consent-title">{t('import.consent.title')}</h2>
            <ul className="scopes">
              <li>{t('import.consent.1')}</li>
              <li>{t('import.consent.2')}</li>
              <li>{t('import.consent.3')}</li>
            </ul>
            <p className="hint">{t('import.consent.hint', { email: user?.email ?? '' })}</p>
            <div className="place-actions">
              <button type="button" className="btn slim primary" onClick={onConsentAllow}>
                {t('import.consent.allow')}
              </button>
              <button type="button" className="btn slim ghost" onClick={() => setConsentFor(null)}>
                {t('import.consent.cancel')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

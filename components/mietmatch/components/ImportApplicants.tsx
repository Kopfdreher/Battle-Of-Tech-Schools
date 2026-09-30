'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { Link } from '@/components/mietmatch/nav'
import { SAMPLE_APPLICANTS } from '../data/applicants'
import { useLocale } from '../context/LocaleContext'
import { useSession } from '../context/session'
import type { MailboxProvider } from '../types'

const SCAN_STEPS_KEYS = [
  'import.scan.1',
  'import.scan.2',
  'import.scan.3',
  'import.scan.4',
] as const

export function ImportApplicants() {
  const { user, mailbox, connectMailbox, disconnectMailbox, importApplicants, clearApplicants } = useSession()
  const { t } = useLocale()
  const [mode, setMode] = useState<'replace' | 'append'>('replace')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [consentFor, setConsentFor] = useState<MailboxProvider | null>(null)
  const [scanning, setScanning] = useState(false)
  const [scanStep, setScanStep] = useState(0)

  useEffect(() => {
    if (!scanning) return
    if (scanStep >= SCAN_STEPS_KEYS.length - 1) {
      const timer = window.setTimeout(() => {
        const drafts = SAMPLE_APPLICANTS.map((item) => ({
          ...item,
          messagePreview: '[Extracted from application email — free text is not used for scoring.]',
        }))
        const count = importApplicants(drafts, mode)
        setScanning(false)
        setScanStep(0)
        setMessage(
          t('import.scan.done', {
            count,
            provider: mailbox?.provider === 'outlook' ? 'Outlook' : 'Gmail',
          }),
        )
      }, 700)
      return () => window.clearTimeout(timer)
    }
    const timer = window.setTimeout(() => setScanStep((step) => step + 1), 650)
    return () => window.clearTimeout(timer)
  }, [scanning, scanStep, importApplicants, mode, mailbox?.provider, t])

  function onConsentAllow() {
    if (!consentFor) return
    connectMailbox(consentFor)
    setConsentFor(null)
  }

  function startInboxScan() {
    setError(null)
    setMessage(null)
    setScanStep(0)
    setScanning(true)
  }

  return (
    <div className="import-stack">
      <div className="import-modes panel">
        <p className="kicker">{t('import.mode.kicker')}</p>
        <div className="place-actions">
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

      <section className="panel import-panel" id="email-import" aria-label={t('import.email.title')}>
        <p className="kicker">{t('import.email.kicker')}</p>
        <h2>{t('import.email.title')}</h2>
        <p className="lede">{t('import.email.lede')}</p>
        {mailbox ? (
          <div className="mailbox-status">
            <p>
              <strong>{mailbox.provider === 'gmail' ? 'Gmail' : 'Outlook'}</strong> · {mailbox.email}
            </p>
            <div className="import-actions">
              <button type="button" className="btn primary" onClick={startInboxScan} disabled={scanning}>
                {scanning ? t('import.email.reading') : t('import.email.read')}
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  clearApplicants()
                  setMessage('Cleared shortlist. You can upload a new CSV.')
                  setError(null)
                }}
              >
                Clear shortlist
              </button>
              <button type="button" className="btn ghost" onClick={() => setConsentFor(null)}>
                {t('import.email.disconnect')}
              </button>
            </div>
          </div>
        ) : (
          <div className="import-actions">
            <button type="button" className="btn primary" onClick={() => setConsentFor('gmail')}>
              {t('import.email.gmail')}
            </button>
            <button type="button" className="btn" onClick={() => setConsentFor('outlook')}>
              {t('import.email.outlook')}
            </button>
            <LinkSettings />
          </div>
        )}
        {scanning ? (
          <div className="scan-progress" aria-live="polite">
            <p>{t(SCAN_STEPS_KEYS[scanStep])}</p>
            <div className="bar">
              <span style={{ width: `${((scanStep + 1) / SCAN_STEPS_KEYS.length) * 100}%` }} />
            </div>
          </div>
        ) : null}
      </section>

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
              <button type="button" className="btn primary" onClick={onConsentAllow}>
                {t('import.consent.allow')}
              </button>
              <button type="button" className="btn ghost" onClick={() => setConsentFor(null)}>
                {t('import.consent.cancel')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function LinkSettings() {
  const { t } = useLocale()
  return (
    <Link className="text-button" to="/settings">
      {t('import.email.settings')}
    </Link>
  )
}


'use client'

import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { Link } from '@/components/mietmatch/nav'
import { SAMPLE_APPLICANTS } from '../data/applicants'
import { useLocale } from '../context/LocaleContext'
import { useSession } from '../context/session'
import {
  buildDemoCsv,
  CSV_TEMPLATE,
  parseApplicantCsv,
} from '../lib/csv'
import type { MailboxProvider } from '../types'

const SCAN_STEPS_KEYS = [
  'import.scan.1',
  'import.scan.2',
  'import.scan.3',
  'import.scan.4',
] as const

export function ImportApplicants() {
  const { user, mailbox, connectMailbox, disconnectMailbox, importApplicants } = useSession()
  const { t } = useLocale()
  const fileId = useId()
  const fileRef = useRef<HTMLInputElement>(null)
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

  function applyCsv(text: string) {
    setError(null)
    setMessage(null)
    const parsed = parseApplicantCsv(text)
    if (parsed.drafts.length === 0) {
      setError(parsed.errors[0] ?? t('import.csv.error'))
      return
    }
    const count = importApplicants(parsed.drafts, mode)
    setMessage(
      t('import.csv.imported', {
        count,
        skipped: parsed.errors.length,
      }),
    )
  }

  function onFile(file: File | null) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => applyCsv(String(reader.result ?? ''))
    reader.onerror = () => setError(t('import.csv.readError'))
    reader.readAsText(file)
  }

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

  function download(filename: string, content: string) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
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
                className="btn ghost"
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

      <section className="panel import-panel" id="csv-import" aria-label={t('import.csv.title')}>
        <p className="kicker">{t('import.csv.kicker')}</p>
        <h2>{t('import.csv.title')}</h2>
        <p className="lede">{t('import.csv.lede')}</p>
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
          <button type="button" className="btn primary" onClick={() => fileRef.current?.click()}>
            {t('import.csv.upload')}
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => download('besichtigo-applicants-template.csv', CSV_TEMPLATE)}
          >
            {t('import.csv.template')}
          </button>
          <button type="button" className="btn" onClick={() => applyCsv(buildDemoCsv(100))}>
            {t('import.csv.demo')}
          </button>
          <button
            type="button"
            className="btn ghost"
            onClick={() => download('besichtigo-100-applicants.csv', buildDemoCsv(100))}
          >
            {t('import.csv.downloadDemo')}
          </button>
        </div>
        <CsvPaste onImport={applyCsv} label={t('import.csv.paste')} submitLabel={t('import.csv.pasteSubmit')} />
        <p className="footnote">{t('import.csv.columns')}</p>
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

function CsvPaste({
  onImport,
  label,
  submitLabel,
}: {
  onImport: (text: string) => void
  label: string
  submitLabel: string
}) {
  const [paste, setPaste] = useState('')

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!paste.trim()) return
    onImport(paste)
    setPaste('')
  }

  return (
    <form className="address-box" onSubmit={onSubmit}>
      <div className="field">
        <label htmlFor="csv-paste">{label}</label>
        <textarea
          id="csv-paste"
          rows={4}
          value={paste}
          onChange={(event) => setPaste(event.target.value)}
          placeholder="name,email,net_income,household_size,contract,..."
        />
      </div>
      <button className="btn" type="submit">
        {submitLabel}
      </button>
    </form>
  )
}

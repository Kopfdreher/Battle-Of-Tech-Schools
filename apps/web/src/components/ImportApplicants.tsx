import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { SAMPLE_APPLICANTS } from '../data/applicants.ts'
import { useSession } from '../context/session.ts'
import {
  buildDemoCsv,
  CSV_TEMPLATE,
  parseApplicantCsv,
} from '../lib/csv.ts'
import type { MailboxProvider } from '../types.ts'

type Source = 'chooser' | 'email' | 'csv'

const SCAN_STEPS = [
  'Connecting to your inbox…',
  'Finding application emails…',
  'Extracting structured fields (income, contract, documents)…',
  'Building your shortlist…',
]

export function ImportApplicants() {
  const { user, mailbox, connectMailbox, disconnectMailbox, importApplicants } = useSession()
  const fileId = useId()
  const fileRef = useRef<HTMLInputElement>(null)
  const [source, setSource] = useState<Source>(mailbox ? 'email' : 'chooser')
  const [mode, setMode] = useState<'replace' | 'append'>('replace')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [consentFor, setConsentFor] = useState<MailboxProvider | null>(null)
  const [scanning, setScanning] = useState(false)
  const [scanStep, setScanStep] = useState(0)

  useEffect(() => {
    if (!scanning) return
    if (scanStep >= SCAN_STEPS.length - 1) {
      const timer = window.setTimeout(() => {
        const drafts = SAMPLE_APPLICANTS.map((item) => ({
          ...item,
          messagePreview: '[Extracted from application email — free text is not used for scoring.]',
        }))
        const count = importApplicants(drafts, mode)
        setScanning(false)
        setScanStep(0)
        setMessage(
          `Read ${count} application emails from ${mailbox?.provider === 'outlook' ? 'Outlook' : 'Gmail'}. Match % is ready.`,
        )
      }, 700)
      return () => window.clearTimeout(timer)
    }
    const timer = window.setTimeout(() => setScanStep((step) => step + 1), 650)
    return () => window.clearTimeout(timer)
  }, [scanning, scanStep, importApplicants, mode, mailbox?.provider])

  function applyCsv(text: string) {
    setError(null)
    setMessage(null)
    const parsed = parseApplicantCsv(text)
    if (parsed.drafts.length === 0) {
      setError(parsed.errors[0] ?? 'No applicants found in that CSV.')
      return
    }
    const count = importApplicants(parsed.drafts, mode)
    setMessage(
      `Imported ${count} applicant${count === 1 ? '' : 's'} from CSV${
        parsed.errors.length ? ` (${parsed.errors.length} skipped)` : ''
      }.`,
    )
  }

  function onFile(file: File | null) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => applyCsv(String(reader.result ?? ''))
    reader.onerror = () => setError('Could not read that file.')
    reader.readAsText(file)
  }

  function onConsentAllow() {
    if (!consentFor) return
    connectMailbox(consentFor)
    setConsentFor(null)
    setSource('email')
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
    <section className="panel import-panel" aria-label="Get applicants">
      <p className="kicker">Get applicants</p>
      <h2>Bring applications into the shortlist</h2>
      <p className="lede">
        Connect an inbox and pull applicant emails, or upload a CSV of people who applied. Either way, we score each
        person with a match %.
      </p>

      {source === 'chooser' ? (
        <div className="intake-grid">
          <button type="button" className="intake-card" onClick={() => setSource('email')}>
            <strong>Connect email</strong>
            <span>Gmail or Outlook — read application messages and extract applicant data.</span>
          </button>
          <button type="button" className="intake-card" onClick={() => setSource('csv')}>
            <strong>Upload CSV</strong>
            <span>Import a spreadsheet with names, income, contract, documents, and more.</span>
          </button>
        </div>
      ) : null}

      {source !== 'chooser' ? (
        <div className="import-modes">
          <button type="button" className="text-button" onClick={() => setSource('chooser')}>
            ← Back to options
          </button>
          <label className="check-row">
            <input
              type="radio"
              name="import-mode"
              checked={mode === 'replace'}
              onChange={() => setMode('replace')}
            />
            <span>Replace shortlist</span>
          </label>
          <label className="check-row">
            <input
              type="radio"
              name="import-mode"
              checked={mode === 'append'}
              onChange={() => setMode('append')}
            />
            <span>Append</span>
          </label>
        </div>
      ) : null}

      {source === 'email' ? (
        <div className="intake-detail">
          <h3>Connect your inbox</h3>
          <p className="hint">
            We look for messages that look like flat applications, then pull structured fields only. Free-text body
            text is not used for the match score.
          </p>
          {mailbox ? (
            <div className="mailbox-status">
              <p>
                <strong>{mailbox.provider === 'gmail' ? 'Gmail' : 'Outlook'}</strong> connected as {mailbox.email}
              </p>
              <div className="import-actions">
                <button type="button" className="btn primary" onClick={startInboxScan} disabled={scanning}>
                  {scanning ? 'Reading inbox…' : 'Read applicant emails'}
                </button>
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => {
                    disconnectMailbox()
                    setMessage(null)
                  }}
                >
                  Disconnect
                </button>
              </div>
            </div>
          ) : (
            <div className="import-actions">
              <button type="button" className="btn primary" onClick={() => setConsentFor('gmail')}>
                Connect Gmail
              </button>
              <button type="button" className="btn" onClick={() => setConsentFor('outlook')}>
                Connect Outlook
              </button>
            </div>
          )}
          {scanning ? (
            <div className="scan-progress" aria-live="polite">
              <p>{SCAN_STEPS[scanStep]}</p>
              <div className="bar">
                <span style={{ width: `${((scanStep + 1) / SCAN_STEPS.length) * 100}%` }} />
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {source === 'csv' ? (
        <div className="intake-detail">
          <h3>Upload a CSV of applicants</h3>
          <p className="hint">
            Use your own export of people who applied, or download our template / 100-row demo file.
          </p>
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
              Upload CSV file
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => download('mietmatch-applicants-template.csv', CSV_TEMPLATE)}
            >
              Download template
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => applyCsv(buildDemoCsv(100))}
            >
              Load 100 demo applicants
            </button>
            <button
              type="button"
              className="btn ghost"
              onClick={() => download('mietmatch-100-applicants.csv', buildDemoCsv(100))}
            >
              Download 100-row demo
            </button>
          </div>
          <CsvPaste onImport={applyCsv} />
          <p className="footnote">
            Columns: name, email, net_income, household_size, contract, employment, arrears_letter, income_proof,
            employment_proof, schufa, smokes.
          </p>
        </div>
      ) : null}

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
            <h2 id="consent-title">Allow BesichtiGo to read application mail?</h2>
            <ul className="scopes">
              <li>See messages that look like flat applications</li>
              <li>Extract structured fields (income, household, documents)</li>
              <li>Keep access read-only — we do not send mail</li>
            </ul>
            <p className="hint">
              Preview uses sample Berlin applications for {user?.email}. Your password stays with{' '}
              {consentFor === 'gmail' ? 'Google' : 'Microsoft'}.
            </p>
            <div className="place-actions">
              <button type="button" className="btn primary" onClick={onConsentAllow}>
                Allow read-only access
              </button>
              <button type="button" className="btn ghost" onClick={() => setConsentFor(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

function CsvPaste({ onImport }: { onImport: (text: string) => void }) {
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
        <label htmlFor="csv-paste">Or paste CSV text</label>
        <textarea
          id="csv-paste"
          rows={4}
          value={paste}
          onChange={(event) => setPaste(event.target.value)}
          placeholder="name,email,net_income,household_size,contract,..."
        />
      </div>
      <button className="btn" type="submit">
        Import pasted CSV
      </button>
    </form>
  )
}

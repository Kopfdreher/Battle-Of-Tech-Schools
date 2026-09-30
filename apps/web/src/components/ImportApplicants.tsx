import { useEffect, useState } from 'react'
import { SAMPLE_APPLICANTS } from '../data/applicants.ts'
import { useSession } from '../context/session.ts'
import type { MailboxProvider } from '../types.ts'

type Source = 'chooser' | 'email'

const SCAN_STEPS = [
  'Connecting to your inbox…',
  'Finding application emails…',
  'Extracting structured fields (income, contract, documents)…',
  'Building your shortlist…',
]

export function ImportApplicants() {
  const { user, mailbox, connectMailbox, disconnectMailbox, importApplicants } = useSession()
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

  return (
    <section className="panel import-panel" aria-label="Get applicants">
      <p className="kicker">Get applicants</p>
      <h2>Bring applications into the shortlist</h2>
      <p className="lede">Connect an inbox and pull applicant emails. We score each person with a match %.</p>

      {source === 'chooser' ? (
        <div className="intake-grid">
          <button type="button" className="intake-card" onClick={() => setSource('email')}>
            <strong>Connect email</strong>
            <span>Gmail or Outlook — read application messages and extract applicant data.</span>
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
            <h2 id="consent-title">Allow Mietmatch to read application mail?</h2>
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

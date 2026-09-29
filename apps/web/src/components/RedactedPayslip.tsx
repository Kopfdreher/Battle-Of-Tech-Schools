import type { AuthenticityReport } from '../lib/authenticityEngine.ts'

type Props = {
  report: AuthenticityReport
}

export function RedactedPayslip({ report }: Props) {
  return (
    <div className="redacted-slip" aria-label="Redacted payslip preview">
      <header className="redacted-slip-head">
        <strong>{report.redacted.employer}</strong>
        <span>{report.redacted.period}</span>
      </header>
      <dl>
        <div>
          <dt>Employee</dt>
          <dd>
            <span className="redact-bar" title="Redacted for AGG / GDPR">
              ████ ██████
            </span>
          </dd>
        </div>
        <div>
          <dt>Address / photo</dt>
          <dd>
            <span className="redact-bar">████████████</span>
          </dd>
        </div>
        <div>
          <dt>Gross</dt>
          <dd className="hl">€{report.mathAudit.gross.toLocaleString()}</dd>
        </div>
        <div>
          <dt>Tax / SV</dt>
          <dd className="hl">€{report.mathAudit.deductions.toLocaleString()}</dd>
        </div>
        <div>
          <dt>Net</dt>
          <dd className="hl net">€{report.redacted.highlightedNet.toLocaleString()}</dd>
        </div>
      </dl>
      <p className="redacted-hint">{report.redacted.contractHint}</p>
    </div>
  )
}

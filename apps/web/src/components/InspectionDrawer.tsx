import { useEffect } from 'react'
import { useLocale } from '../context/LocaleContext.tsx'
import type { AuthenticityReport, CheckStatus } from '../lib/authenticityEngine.ts'
import { RedactedPayslip } from './RedactedPayslip.tsx'

type Props = {
  open: boolean
  report: AuthenticityReport | undefined
  onClose: () => void
}

function mark(status: CheckStatus) {
  if (status === 'PASS') return 'ok'
  if (status === 'WARNING') return 'warn'
  return 'bad'
}

function glyph(status: CheckStatus) {
  if (status === 'PASS') return '✓'
  if (status === 'WARNING') return '!'
  return '×'
}

export function InspectionDrawer({ open, report, onClose }: Props) {
  const { t } = useLocale()

  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || !report) return null

  const checks = [report.metadataCheck, report.mathAudit, report.identityCheck, report.layoutCheck]
  const tone =
    report.overallStatus === 'verified' ? t('verify.high') : report.overallStatus === 'warning' ? t('verify.mid') : t('verify.low')

  return (
    <div className="inspect-overlay" role="presentation" onClick={onClose}>
      <aside
        className="inspect-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="inspect-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="inspect-head">
          <div>
            <p className="kicker">{t('verify.kicker')}</p>
            <h2 id="inspect-title">{t('verify.title')}</h2>
            <p className="lede inspect-index">
              {t('verify.index')} <strong>{report.trustIndex}/100</strong> · {tone}
            </p>
            <p className="hint">
              {report.documentLabel} · {report.source}
            </p>
          </div>
          <button type="button" className="btn ghost" onClick={onClose}>
            {t('verify.close')}
          </button>
        </header>

        <ul className="inspect-checks">
          {checks.map((check) => (
            <li key={check.label} className={mark(check.status)}>
              <span className="pill">{glyph(check.status)}</span>
              <div>
                <strong>
                  {check.label}: {check.status}
                </strong>
                <p>{check.detail}</p>
              </div>
            </li>
          ))}
        </ul>

        {report.flags.length > 0 ? (
          <ul className="flag-list">
            {report.flags.map((flag) => (
              <li key={flag}>{flag}</li>
            ))}
          </ul>
        ) : (
          <p className="hint">{t('verify.noFlags')}</p>
        )}

        <h3 className="inspect-sub">{t('verify.preview')}</h3>
        <RedactedPayslip report={report} />
      </aside>
    </div>
  )
}

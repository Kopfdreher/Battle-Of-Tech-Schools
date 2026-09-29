import type { AuthenticityReport, OverallStatus } from '../lib/authenticityEngine.ts'

const LABELS: Record<OverallStatus, { en: string; de: string }> = {
  verified: { en: 'Verified', de: 'Geprüft' },
  warning: { en: 'Warning', de: 'Hinweis' },
  fail: { en: 'Risk', de: 'Risiko' },
}

type Props = {
  report: AuthenticityReport | undefined
  locale: 'en' | 'de'
  onInspect?: () => void
}

export function AuthenticityBadge({ report, locale, onInspect }: Props) {
  if (!report) {
    return <span className="trust-badge pending">···</span>
  }

  const label = LABELS[report.overallStatus][locale]
  const title = `${report.trustIndex}/100 · ${label}`

  if (onInspect) {
    return (
      <button
        type="button"
        className={`trust-badge ${report.overallStatus}`}
        title={title}
        onClick={(event) => {
          event.stopPropagation()
          onInspect()
        }}
      >
        <span className="trust-dot" aria-hidden="true" />
        <span className="trust-score">{report.trustIndex}</span>
        <span className="trust-label">{label}</span>
      </button>
    )
  }

  return (
    <span className={`trust-badge ${report.overallStatus}`} title={title}>
      <span className="trust-dot" aria-hidden="true" />
      <span className="trust-score">{report.trustIndex}</span>
      <span className="trust-label">{label}</span>
    </span>
  )
}

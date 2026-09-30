'use client'

import { Link, useNavigate, useParams } from '@/components/mietmatch/nav'
import { AuthenticityBadge } from '@/components/authenticity/authenticity-badge'
import { evaluateAuthenticity } from '@/lib/authenticity/engine'
import { combinedMatchPercent } from '@/lib/authenticity/score'
import { BlurredName } from '../components/BlurredName'
import { useLocale } from '../context/LocaleContext'
import { useSession } from '../context/session'
import { evaluateApplicant, STRONG_MATCH_RATE } from '../lib/match'

export function ListingPage() {
  const { id } = useParams({ from: '/_app/applicants/$id' })
  const navigate = useNavigate()
  const { t } = useLocale()
  const { flat, applicants, requirements, removeApplicant, marks, setApplicantMark } = useSession()
  const applicant = applicants.find((item) => item.id === id)

  if (!flat) {
    return (
      <div className="detail">
        <Link className="back" to="/">
          {t('detail.back')}
        </Link>
        <p className="empty">{t('detail.needFlat')}</p>
      </div>
    )
  }

  if (!applicant) {
    return (
      <div className="detail">
        <Link className="back" to="/">
          {t('detail.back')}
        </Link>
        <p className="empty">{t('detail.missing')}</p>
      </div>
    )
  }

  const verdict = evaluateApplicant(applicant, flat, requirements, applicants)
  const report = evaluateAuthenticity({
    id: applicant.id,
    applicantName: applicant.displayName,
    income: applicant.netIncomeMonthly,
    hasPermanentContract: applicant.contractType === 'permanent',
  })
  const displayRate = combinedMatchPercent(verdict.matchRate, report.trustIndex)
  const tone = displayRate >= STRONG_MATCH_RATE ? 'good' : 'bad'
  const mark = marks[applicant.id] ?? null
  const peopleLabel =
    applicant.householdSize === 1
      ? `1 ${t('row.person')}`
      : `${applicant.householdSize} ${t('row.people')}`

  const docs = [
    { id: 'arrears', label: t('detail.doc.arrears'), ok: applicant.hasArrearsLetter },
    { id: 'income', label: t('detail.doc.income'), ok: applicant.hasIncomeProof },
    { id: 'employment', label: t('detail.doc.employment'), ok: applicant.hasEmploymentProof },
    { id: 'schufa', label: t('detail.doc.schufa'), ok: applicant.hasSchufa },
  ]

  const authApplicant = {
    id: applicant.id,
    applicantName: applicant.displayName,
    income: applicant.netIncomeMonthly,
    hasPermanentContract: applicant.contractType === 'permanent',
  }

  return (
    <article className="detail">
      <Link className="back" to="/">
        {t('detail.back')}
      </Link>

      <header className="detail-hero">
        <div className="detail-hero-copy">
          <p className="kicker">{tone === 'good' ? t('row.strong') : t('row.weak')}</p>
          <h1>
            <BlurredName as="span" name={applicant.displayName} />
          </h1>
          <ul className="detail-meta">
            <li>€{applicant.netIncomeMonthly} {t('detail.net')}</li>
            <li>{peopleLabel}</li>
            <li>{applicant.contractType}</li>
            <li>{applicant.employmentType}</li>
            {applicant.smokes ? <li>{t('detail.smokes')}</li> : null}
          </ul>
        </div>
        <div className="detail-hero-side">
          <AuthenticityBadge
            variant="compact"
            matchRate={verdict.matchRate}
            caption={tone === 'good' ? t('row.strongShort') : t('row.weakShort')}
            initialReport={report}
            applicant={authApplicant}
          />
          <AuthenticityBadge variant="verify" initialReport={report} applicant={authApplicant} />
        </div>
      </header>

      {verdict.flags.length > 0 ? (
        <ul className="flag-list" aria-label={t('detail.flags')}>
          {verdict.flags.map((flag) => (
            <li key={flag}>{flag}</li>
          ))}
        </ul>
      ) : null}

      <section className="detail-panel" aria-label={t('detail.fit')}>
        <div className="detail-panel-head">
          <h2>{t('detail.fit')}</h2>
          <span>
            {verdict.checks.filter((c) => c.ok).length}/{verdict.checks.length}
          </span>
        </div>
        <ul className="detail-checks">
          {verdict.checks.map((check) => (
            <li key={check.id} className={check.ok ? 'ok' : 'bad'}>
              <span className="detail-check-mark" aria-hidden="true">
                {check.ok ? '✓' : '–'}
              </span>
              <span>{check.label}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="detail-panel" aria-label={t('detail.docs')}>
        <div className="detail-panel-head">
          <h2>{t('detail.docs')}</h2>
          <span>
            {docs.filter((d) => d.ok).length}/{docs.length}
          </span>
        </div>
        <ul className="detail-docs">
          {docs.map((doc) => (
            <li key={doc.id} className={doc.ok ? 'ok' : 'bad'}>
              <span className="detail-doc-dot" aria-hidden="true" />
              <span>{doc.label}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="detail-actions">
        <button
          type="button"
          className={mark === 'like' ? 'btn slim primary' : 'btn slim'}
          onClick={() => setApplicantMark(applicant.id, mark === 'like' ? null : 'like')}
        >
          {mark === 'like' ? t('row.liked') : t('row.like')}
        </button>
        <button
          type="button"
          className="btn slim ghost"
          onClick={() => {
            removeApplicant(applicant.id)
            void navigate({ to: '/' })
          }}
        >
          {t('row.removeAll')}
        </button>
      </div>
    </article>
  )
}

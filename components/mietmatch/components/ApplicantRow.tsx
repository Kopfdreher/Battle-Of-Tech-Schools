'use client'

import { useMemo } from 'react'
import { Link } from '@/components/mietmatch/nav'
import { AuthenticityBadge } from '@/components/authenticity/authenticity-badge'
import { evaluateAuthenticity } from '@/lib/authenticity/engine'
import { combinedMatchPercent } from '@/lib/authenticity/score'
import { useLocale } from '../context/LocaleContext'
import { useSession, type ApplicantMark } from '../context/session'
import { STRONG_MATCH_RATE, type Verdict } from '../lib/match'
import type { Applicant } from '../types'
import { BlurredName } from './BlurredName'

export type ListGroup = 'all' | 'like'

type Props = {
  applicant: Applicant
  verdict: Verdict
  open: boolean
  listGroup: ListGroup
  onToggle: () => void
  onRemoveFromBoard: () => void
}

function LikeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M12 20s-7-4.35-7-9.2A4.1 4.1 0 0 1 12 7.1a4.1 4.1 0 0 1 7 3.7C19 15.65 12 20 12 20Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function ApplicantRow({
  applicant,
  verdict,
  open,
  listGroup,
  onToggle,
  onRemoveFromBoard,
}: Props) {
  const { marks, setApplicantMark } = useSession()
  const { t } = useLocale()
  const report = useMemo(
    () =>
      evaluateAuthenticity({
        id: applicant.id,
        applicantName: applicant.displayName,
        income: applicant.netIncomeMonthly,
        hasPermanentContract: applicant.contractType === 'permanent',
      }),
    [applicant.id, applicant.displayName, applicant.netIncomeMonthly, applicant.contractType],
  )
  const displayRate = combinedMatchPercent(verdict.matchRate, report.trustIndex)
  const tone = displayRate >= STRONG_MATCH_RATE ? 'good' : 'bad'
  const mark = marks[applicant.id] ?? null

  function toggleMark(next: ApplicantMark) {
    setApplicantMark(applicant.id, mark === next ? null : next)
  }

  function removeFromCurrentList() {
    if (listGroup === 'all') {
      onRemoveFromBoard()
      return
    }
    setApplicantMark(applicant.id, null)
  }

  const removeLabel =
    listGroup === 'like' ? t('row.removeLiked') : t('row.removeAll')

  const matchLabel = tone === 'good' ? t('row.strong') : t('row.weak')
  const matchShort = tone === 'good' ? t('row.strongShort') : t('row.weakShort')
  const peopleLabel =
    applicant.householdSize === 1
      ? `1 ${t('row.person')}`
      : `${applicant.householdSize} ${t('row.people')}`

  return (
    <article
      className={[
        'invite',
        tone,
        open ? 'open' : '',
        mark === 'like' ? 'marked-like' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="invite-head-row">
        <button type="button" className="invite-head" onClick={onToggle} aria-expanded={open}>
          <span className="invite-copy">
            <BlurredName as="strong" name={applicant.displayName} />
            <small>
              {peopleLabel} · {applicant.contractType} · {matchLabel}
            </small>
          </span>
          <AuthenticityBadge
            variant="score"
            className="invite-fit"
            matchRate={verdict.matchRate}
            caption={matchShort}
            initialReport={report}
            applicant={{
              id: applicant.id,
              applicantName: applicant.displayName,
              income: applicant.netIncomeMonthly,
              hasPermanentContract: applicant.contractType === 'permanent',
            }}
          />
        </button>

        <div className="row-mark-icons" role="group" aria-label="Applicant">
          <button
            type="button"
            className={mark === 'like' ? 'row-mark-btn like on' : 'row-mark-btn like'}
            aria-pressed={mark === 'like'}
            title={mark === 'like' ? t('row.liked') : t('row.like')}
            onClick={(event) => {
              event.stopPropagation()
              toggleMark('like')
            }}
          >
            <LikeIcon />
            <span className="sr-only">{mark === 'like' ? t('row.liked') : t('row.like')}</span>
          </button>
          <button
            type="button"
            className="row-mark-btn remove"
            title={removeLabel}
            onClick={(event) => {
              event.stopPropagation()
              removeFromCurrentList()
            }}
          >
            <span aria-hidden="true">×</span>
            <span className="sr-only">{removeLabel}</span>
          </button>
        </div>
      </div>

      {open ? (
        <div className="invite-body">
          <section className="trust-panel" aria-label={t('row.trustTitle')}>
            <div className="trust-panel-copy">
              <p className="kicker">{t('row.trustTitle')}</p>
              <p className="hint">{t('row.trustHint')}</p>
            </div>
            <AuthenticityBadge
              variant="verify"
              initialReport={report}
              applicant={{
                id: applicant.id,
                applicantName: applicant.displayName,
                income: applicant.netIncomeMonthly,
                hasPermanentContract: applicant.contractType === 'permanent',
              }}
            />
          </section>
          {verdict.flags.length > 0 ? (
            <ul className="flag-list">
              {verdict.flags.map((flag) => (
                <li key={flag}>{flag}</li>
              ))}
            </ul>
          ) : null}
          <section className="match-panel" aria-label="Applicant fit">
            <div className="match-panel-head">
              <p className="kicker">{matchLabel}</p>
              <p className="match-rate-line">
                {t('row.fit')} <strong>{displayRate}%</strong>
              </p>
            </div>
            <ul className="match-list">
              {verdict.checks.map((check, index) => (
                <li key={check.id} className={check.ok ? 'ok' : 'bad'}>
                  <div className="match-row">
                    <span className="match-label">
                      <span className="criteria-rank" aria-hidden="true">
                        {index + 1}
                      </span>
                      {check.label}
                    </span>
                    <span className="match-percent">{check.percent}%</span>
                  </div>
                  <div className="match-bar" aria-hidden="true">
                    <span style={{ width: `${check.percent}%` }} />
                  </div>
                  <p className="match-reason">{check.reason}</p>
                </li>
              ))}
            </ul>
          </section>
          <div className="place-actions mark-actions">
            <button type="button" className="btn slim" onClick={removeFromCurrentList}>
              {removeLabel}
            </button>
            {listGroup !== 'all' ? (
              <button type="button" className="btn slim ghost" onClick={onRemoveFromBoard}>
                {t('row.removeBoard')}
              </button>
            ) : null}
            <Link className="btn slim primary" to="/applicants/$id" params={{ id: applicant.id }}>
              {t('row.open')}
            </Link>
          </div>
        </div>
      ) : null}
    </article>
  )
}

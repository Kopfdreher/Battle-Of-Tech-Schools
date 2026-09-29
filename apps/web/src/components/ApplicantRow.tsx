import { Link } from '@tanstack/react-router'
import { useLocale } from '../context/LocaleContext.tsx'
import { useSession, type ApplicantMark } from '../context/session.ts'
import { matchTone, type Verdict } from '../lib/match.ts'
import type { Applicant } from '../types.ts'

export type ListGroup = 'all' | 'like' | 'unsure'

type Props = {
  number: number
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

function UnsureIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
      <path
        d="M9.5 9.2a2.6 2.6 0 0 1 5 1c0 1.6-2.5 1.9-2.5 3.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="17" r="1.1" fill="currentColor" />
    </svg>
  )
}

export function ApplicantRow({
  number,
  applicant,
  verdict,
  open,
  listGroup,
  onToggle,
  onRemoveFromBoard,
}: Props) {
  const { marks, setApplicantMark } = useSession()
  const { t } = useLocale()
  const tone = matchTone(verdict)
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
    listGroup === 'like'
      ? t('row.removeLiked')
      : listGroup === 'unsure'
        ? t('row.removeUnsure')
        : t('row.removeAll')

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
        mark === 'unsure' ? 'marked-unsure' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="invite-head-row">
        <button type="button" className="invite-head" onClick={onToggle} aria-expanded={open}>
          <span className="invite-num" aria-hidden="true">
            {number}
          </span>
          <span className="invite-copy">
            <strong>{applicant.displayName}</strong>
            <small>
              {peopleLabel} · {applicant.contractType} · {matchLabel}
            </small>
          </span>
          <span className="invite-fit">
            <strong>{verdict.matchRate}%</strong>
            <span>{matchShort}</span>
          </span>
        </button>

        <div className="row-mark-icons" role="group" aria-label={applicant.displayName}>
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
            className={mark === 'unsure' ? 'row-mark-btn unsure on' : 'row-mark-btn unsure'}
            aria-pressed={mark === 'unsure'}
            title={mark === 'unsure' ? t('row.unsureOn') : t('row.unsure')}
            onClick={(event) => {
              event.stopPropagation()
              toggleMark('unsure')
            }}
          >
            <UnsureIcon />
            <span className="sr-only">{mark === 'unsure' ? t('row.unsureOn') : t('row.unsure')}</span>
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
          {verdict.flags.length > 0 ? (
            <ul className="flag-list">
              {verdict.flags.map((flag) => (
                <li key={flag}>{flag}</li>
              ))}
            </ul>
          ) : null}
          <p className="invite-mail">{applicant.messagePreview}</p>
          <section className="match-panel" aria-label="Applicant fit">
            <div className="match-panel-head">
              <p className="kicker">{matchLabel}</p>
              <p className="match-rate-line">
                {t('row.fit')} <strong>{verdict.matchRate}%</strong>
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
            <button type="button" className="btn" onClick={removeFromCurrentList}>
              {removeLabel}
            </button>
            {listGroup !== 'all' ? (
              <button type="button" className="btn ghost" onClick={onRemoveFromBoard}>
                {t('row.removeBoard')}
              </button>
            ) : null}
            <Link className="btn" to="/applicants/$id" params={{ id: applicant.id }}>
              {t('row.open')}
            </Link>
          </div>
        </div>
      ) : null}
    </article>
  )
}

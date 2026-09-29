'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from '@/components/mietmatch/nav'
import { useLocale } from '../context/LocaleContext'
import { useSession } from '../context/session'
import type { ListGroup } from './ApplicantRow'
import type { Verdict } from '../lib/match'
import type { Applicant, LandlordFlat } from '../types'

type Ranked = {
  applicant: Applicant
  verdict: Verdict
  number: number
}

type SentBatch = {
  id: string
  count: number
  date: string
  time: string
  names: string[]
  fromRank: number
  toRank: number
  group: ListGroup
  sentAt: string
}

type Props = {
  flat: LandlordFlat
  ranked: Ranked[]
  landlordName: string
  group: ListGroup
}

function defaultVisitDate() {
  const date = new Date()
  date.setDate(date.getDate() + 2)
  return date.toISOString().slice(0, 10)
}

function formatVisit(date: string, time: string) {
  try {
    const when = new Date(`${date}T${time}:00`)
    return new Intl.DateTimeFormat('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Berlin',
    }).format(when)
  } catch {
    return `${date} · ${time}`
  }
}

export function InvitePanel({ flat, ranked, landlordName, group }: Props) {
  const { invitedIds, marks, scheduleInvitations, clearInvited } = useSession()
  const { t } = useLocale()
  const invited = useMemo(() => new Set(invitedIds), [invitedIds])

  function groupLabel(id: ListGroup) {
    if (id === 'like') return t('invite.group.like')
    if (id === 'unsure') return t('invite.group.unsure')
    return t('invite.group.all')
  }

  const pool = useMemo(() => {
    if (group === 'like') return ranked.filter((row) => marks[row.applicant.id] === 'like')
    if (group === 'unsure') return ranked.filter((row) => marks[row.applicant.id] === 'unsure')
    return ranked
  }, [ranked, marks, group])

  const pending = useMemo(
    () => pool.filter((row) => !invited.has(row.applicant.id)),
    [pool, invited],
  )

  const maxBatch = pending.length
  const [countText, setCountText] = useState('10')
  const [date, setDate] = useState(defaultVisitDate)
  const [time, setTime] = useState('16:00')
  const [sending, setSending] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [batches, setBatches] = useState<SentBatch[]>([])

  useEffect(() => {
    setCountText((current) => {
      const parsed = Number(current)
      if (!current.trim() || !Number.isFinite(parsed)) return current
      if (maxBatch === 0) return current
      return String(Math.min(Math.max(1, Math.floor(parsed)), maxBatch))
    })
  }, [maxBatch])

  const count = useMemo(() => {
    const parsed = Number(countText)
    if (!Number.isFinite(parsed) || parsed < 1) return 0
    return Math.min(Math.floor(parsed), Math.max(0, maxBatch))
  }, [countText, maxBatch])

  const recipients = useMemo(() => pending.slice(0, count), [pending, count])

  function clampCountText() {
    if (maxBatch === 0) return
    const parsed = Number(countText)
    if (!countText.trim() || !Number.isFinite(parsed) || parsed < 1) {
      setCountText('1')
      return
    }
    setCountText(String(Math.min(Math.floor(parsed), maxBatch)))
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    clampCountText()
    if (pool.length === 0) {
      setError(
        group === 'like'
          ? t('invite.error.noLiked')
          : group === 'unsure'
            ? t('invite.error.noUnsure')
            : t('invite.error.none'),
      )
      return
    }
    if (maxBatch === 0) {
      setError(t('invite.error.done', { group: groupLabel(group) }))
      return
    }
    if (!date || !time) {
      setError(t('invite.error.datetime'))
      return
    }
    const inviteCount = (() => {
      const parsed = Number(countText)
      if (!Number.isFinite(parsed) || parsed < 1) return 0
      return Math.min(Math.floor(parsed), maxBatch)
    })()
    const invitees = pending.slice(0, inviteCount)
    if (invitees.length === 0) {
      setError(t('invite.error.count'))
      return
    }

    setSending(true)
    setProgress(0)
    const total = invitees.length
    let sent = 0
    const timer = window.setInterval(() => {
      sent += 1
      setProgress(Math.round((sent / total) * 100))
      if (sent >= total) {
        window.clearInterval(timer)
        scheduleInvitations({
          applicantIds: invitees.map((row) => row.applicant.id),
          date,
          time,
        })
        setBatches((current) => [
          {
            id: `invite-${Date.now().toString(36)}`,
            count: invitees.length,
            date,
            time,
            names: invitees.map((row) => row.applicant.displayName),
            fromRank: invitees[0]!.number,
            toRank: invitees[invitees.length - 1]!.number,
            group,
            sentAt: new Date().toISOString(),
          },
          ...current,
        ])
        setSending(false)
        setProgress(100)
      }
    }, 280)
  }

  return (
    <section className="panel invite-send" aria-label={t('invite.title')}>
      <div className="invite-send-head">
        <div>
          <p className="kicker">{t('invite.kicker')}</p>
          <h2>{t('invite.title')}</h2>
          <p className="lede">{t('invite.lede')}</p>
        </div>
        <div className="invite-send-links">
          <Link className="text-button" to="/appointments">
            {t('invite.manage')}
          </Link>
          {invitedIds.length > 0 ? (
            <button type="button" className="btn ghost" onClick={clearInvited} disabled={sending}>
              {t('invite.reset')}
            </button>
          ) : null}
        </div>
      </div>

      <form className="invite-send-form" onSubmit={onSubmit}>
        <label className="field">
          <span>{t('invite.count')}</span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={countText}
            disabled={sending || maxBatch === 0}
            onChange={(event) => {
              const next = event.target.value.replace(/[^\d]/g, '')
              setCountText(next)
            }}
            onBlur={clampCountText}
            aria-describedby="invite-count-hint"
          />
        </label>

        <label className="field">
          <span>{t('invite.date')}</span>
          <input
            type="date"
            value={date}
            disabled={sending}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(event) => setDate(event.target.value)}
            required
          />
        </label>

        <label className="field">
          <span>{t('invite.time')}</span>
          <input
            type="time"
            value={time}
            disabled={sending}
            onChange={(event) => setTime(event.target.value)}
            required
          />
        </label>

        <div className="invite-send-actions">
          <button type="submit" className="btn primary" disabled={sending || recipients.length === 0}>
            {sending
              ? t('invite.sending')
              : recipients.length === 1
                ? t('invite.send', { count: recipients.length })
                : t('invite.sendPlural', { count: recipients.length })}
          </button>
        </div>

        <p className="hint invite-count-hint" id="invite-count-hint">
          {maxBatch === 0
            ? t('invite.hint.empty')
            : count > 0
              ? t('invite.hint.next', {
                  count,
                  group: groupLabel(group),
                  remaining: maxBatch,
                })
              : t('invite.hint.range', { max: maxBatch })}
        </p>
      </form>

      {recipients.length > 0 ? (
        <p className="hint invite-mail-sample">
          {t('invite.mail', {
            name: landlordName,
            address: flat.address,
            when: formatVisit(date, time),
          })}
        </p>
      ) : null}

      {sending ? (
        <div className="scan-progress" aria-live="polite">
          <p className="hint">{t('invite.progress')}</p>
          <div className="bar">
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : null}

      {error ? <p className="error">{error}</p> : null}

      {batches.length > 0 ? (
        <div className="invite-sent-log" aria-live="polite">
          <p className="kicker">{t('invite.sent')}</p>
          <ul>
            {batches.map((batch) => (
              <li key={batch.id}>
                <strong>
                  {batch.count === 1
                    ? t('invite.sentLine', {
                        group: groupLabel(batch.group),
                        from: batch.fromRank,
                        to: batch.toRank,
                        count: batch.count,
                      })
                    : t('invite.sentLinePlural', {
                        group: groupLabel(batch.group),
                        from: batch.fromRank,
                        to: batch.toRank,
                        count: batch.count,
                      })}
                </strong>
                <span>
                  {formatVisit(batch.date, batch.time)} · {batch.names.slice(0, 3).join(', ')}
                  {batch.names.length > 3 ? ` +${batch.names.length - 3}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}

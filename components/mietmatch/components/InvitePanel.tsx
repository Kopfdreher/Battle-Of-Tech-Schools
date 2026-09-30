'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from '@/components/mietmatch/nav'
import { useLocale } from '../context/LocaleContext'
import { useSession } from '../context/session'
import type { ListGroup } from './ApplicantRow'
import type { Verdict } from '../lib/match'
import type { Applicant, LandlordFlat } from '../types'
import { BlurredName } from './BlurredName'
import { sendInvitationEmail } from '@/app/actions/send-invitation'

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
    return t('invite.group.all')
  }

  const pool = useMemo(() => {
    if (group === 'like') return ranked.filter((row) => marks[row.applicant.id] === 'like')
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
  const [successNotice, setSuccessNotice] = useState<string | null>(null)
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

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSuccessNotice(null)
    clampCountText()
    if (pool.length === 0) {
      setError(group === 'like' ? t('invite.error.noLiked') : t('invite.error.none'))
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
    setProgress(15)

    const timer = window.setInterval(() => {
      setProgress((prev) => (prev < 85 ? prev + 15 : prev))
    }, 180)

    try {
      const applicantNames = invitees.map((row) => row.applicant.displayName)
      const res = await sendInvitationEmail({
        landlordName,
        flatAddress: flat.address,
        date,
        time,
        count: invitees.length,
        applicantNames,
        recipientEmail: 'besichtigo@gmail.com',
      })

      window.clearInterval(timer)
      setProgress(100)

      if (!res.success) {
        if (res.error?.includes('only send testing emails to your own email address')) {
          setError(t('invite.error.sandbox', { recipient: res.recipient }))
        } else {
          setError(t('invite.error.sendFailed', { error: res.error || '' }))
        }
        return
      }

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
          names: applicantNames,
          fromRank: invitees[0]!.number,
          toRank: invitees[invitees.length - 1]!.number,
          group,
          sentAt: new Date().toISOString(),
        },
        ...current,
      ])

      setSuccessNotice(
        res.simulated
          ? t('invite.successSimulated', { recipient: res.recipient })
          : t('invite.success', { recipient: res.recipient })
      )
    } catch (err: unknown) {
      window.clearInterval(timer)
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(t('invite.error.sendFailed', { error: message }))
    } finally {
      setSending(false)
    }
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
          <button type="submit" className="btn box-btn primary" disabled={sending || recipients.length === 0}>
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
        <div className="invite-mail-sample" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <p className="hint" style={{ margin: 0 }}>
            {t('invite.mail', {
              name: landlordName,
              address: flat.address,
              when: formatVisit(date, time),
            })}
          </p>
          <p className="hint" style={{ margin: 0, fontSize: '12px', color: '#059669', fontWeight: 600 }}>
            ✉️ {t('invite.sampleEmailHint', { email: 'besichtigo@gmail.com' })}
          </p>
        </div>
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

      {successNotice ? (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '8px',
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            color: '#15803d',
            fontSize: '13px',
            lineHeight: '1.5',
            marginTop: '8px',
          }}
        >
          {successNotice}
        </div>
      ) : null}

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
                <span className="invite-sent-meta">
                  {formatVisit(batch.date, batch.time)} ·{' '}
                  {batch.names.slice(0, 3).map((name, index) => (
                    <span key={`${batch.id}-${index}`}>
                      {index > 0 ? ', ' : ''}
                      <BlurredName name={name} />
                    </span>
                  ))}
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

import { useMemo, useState, type FormEvent } from 'react'
import { Link } from '@tanstack/react-router'
import { useLocale } from '../context/LocaleContext.tsx'
import { useSession } from '../context/session.ts'
import { applicantCode, maskEmail } from '../lib/anonymize.ts'
import type { Invitation } from '../types.ts'

type Slot = {
  date: string
  time: string
  invitations: Invitation[]
}

function slotStamp(slot: { date: string; time: string }) {
  return new Date(`${slot.date}T${slot.time}:00`).getTime()
}

function groupSlots(invitations: Invitation[]) {
  const map = new Map<string, Slot>()
  for (const item of invitations) {
    const key = `${item.date}|${item.time}`
    const slot = map.get(key) ?? { date: item.date, time: item.time, invitations: [] }
    slot.invitations.push(item)
    map.set(key, slot)
  }
  return [...map.values()]
}

function formatSlot(date: string, time: string, locale: string) {
  const when = new Date(`${date}T${time}:00`)
  if (Number.isNaN(when.getTime())) return `${date} · ${time}`
  return new Intl.DateTimeFormat(locale === 'de' ? 'de-DE' : 'en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Berlin',
  }).format(when)
}

export function AppointmentsPage() {
  const { invitations, applicants, flat, rescheduleSlot, cancelInvitation, cancelSlot } = useSession()
  const { t, locale } = useLocale()
  const people = useMemo(() => new Map(applicants.map((item) => [item.id, item])), [applicants])

  const { upcoming, past } = useMemo(() => {
    const now = Date.now()
    const slots = groupSlots(invitations)
    return {
      upcoming: slots
        .filter((slot) => slotStamp(slot) >= now)
        .sort((a, b) => slotStamp(a) - slotStamp(b)),
      past: slots.filter((slot) => slotStamp(slot) < now).sort((a, b) => slotStamp(b) - slotStamp(a)),
    }
  }, [invitations])

  return (
    <div className="appointments">
      <header className="page-head">
        <p className="kicker">{t('appointments.kicker')}</p>
        <h1>{t('appointments.title')}</h1>
        <p className="lede">{t('appointments.lede')}</p>
        {flat ? <p className="hint">{flat.address}</p> : null}
      </header>

      {invitations.length === 0 ? (
        <section className="panel">
          <p>{t('appointments.empty')}</p>
          <Link className="btn" to="/">
            {t('appointments.openShortlist')}
          </Link>
        </section>
      ) : (
        <div className="appointment-list">
          {upcoming.map((slot) => (
            <AppointmentCard
              key={`${slot.date}|${slot.time}`}
              slot={slot}
              past={false}
              locale={locale}
              people={people}
              onReschedule={rescheduleSlot}
              onRemove={cancelInvitation}
              onCancel={cancelSlot}
            />
          ))}
          {past.map((slot) => (
            <AppointmentCard
              key={`${slot.date}|${slot.time}`}
              slot={slot}
              past
              locale={locale}
              people={people}
              onReschedule={rescheduleSlot}
              onRemove={cancelInvitation}
              onCancel={cancelSlot}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function AppointmentCard({
  slot,
  past,
  locale,
  people,
  onReschedule,
  onRemove,
  onCancel,
}: {
  slot: Slot
  past: boolean
  locale: string
  people: Map<string, { id: string; displayName: string; email: string }>
  onReschedule: (slot: { date: string; time: string }, next: { date: string; time: string }) => void
  onRemove: (id: string) => void
  onCancel: (slot: { date: string; time: string }) => void
}) {
  const { t } = useLocale()
  const [date, setDate] = useState(slot.date)
  const [time, setTime] = useState(slot.time)
  const unchanged = date === slot.date && time === slot.time

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!date || !time || unchanged) return
    onReschedule({ date: slot.date, time: slot.time }, { date, time })
  }

  return (
    <article className="panel appointment-card">
      <header className="appointment-head">
        <div>
          <p className="kicker">{past ? t('appointments.past') : t('appointments.upcoming')}</p>
          <h2>{formatSlot(slot.date, slot.time, locale)}</h2>
          <p className="hint">{t('appointments.count', { count: slot.invitations.length })}</p>
        </div>
      </header>

      <form className="appointment-reschedule" onSubmit={onSubmit} aria-label={t('appointments.reschedule')}>
        <label className="field">
          <span>{t('invite.date')}</span>
          <input
            type="date"
            value={date}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(event) => setDate(event.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>{t('invite.time')}</span>
          <input type="time" value={time} onChange={(event) => setTime(event.target.value)} required />
        </label>
        <button className="btn" type="submit" disabled={unchanged || !date || !time}>
          {t('appointments.save')}
        </button>
      </form>

      <ul className="appointment-people">
        {slot.invitations.map((invitation) => {
          const applicant = people.get(invitation.applicantId)
          return (
            <li key={invitation.id} className="appointment-person">
              <div>
                <strong>
                  {applicant ? (
                    <Link to="/applicants/$id" params={{ id: applicant.id }}>
                      {t('applicant.alias', { code: applicantCode(applicant.id) })}
                    </Link>
                  ) : (
                    t('appointments.unknown')
                  )}
                </strong>
                {applicant?.email ? <small>{maskEmail(applicant.email)}</small> : null}
              </div>
              <button type="button" className="text-button" onClick={() => onRemove(invitation.id)}>
                {t('appointments.remove')}
              </button>
            </li>
          )
        })}
      </ul>

      <div className="appointment-actions">
        <button type="button" className="btn danger" onClick={() => onCancel({ date: slot.date, time: slot.time })}>
          {t('appointments.cancel')}
        </button>
      </div>
    </article>
  )
}

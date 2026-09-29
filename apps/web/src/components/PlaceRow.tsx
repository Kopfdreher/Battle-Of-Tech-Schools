import { Link } from '@tanstack/react-router'
import { matchTone, type Verdict } from '../lib/match.ts'
import type { SavedPlace } from '../types.ts'

type Props = {
  number: number
  place: SavedPlace
  verdict: Verdict
  open: boolean
  onToggle: () => void
  onRemove: () => void
}

export function PlaceRow({ number, place, verdict, open, onToggle, onRemove }: Props) {
  const ranked = [...verdict.checks].sort((left, right) => right.percent - left.percent)
  const tone = matchTone(verdict)

  return (
    <article className={open ? `invite ${tone} open` : `invite ${tone}`}>
      <button type="button" className="invite-head" onClick={onToggle} aria-expanded={open}>
        <span className="invite-num" aria-hidden="true">
          {number}
        </span>
        <span className="invite-copy">
          <strong>{place.address}</strong>
          <small>
            {place.district || 'Berlin'} · {tone === 'good' ? 'Strong match' : 'Weak match'}
          </small>
        </span>
        <span className="invite-fit">
          <strong>{verdict.matchRate}%</strong>
          <span>{tone === 'good' ? 'Strong' : 'Weak'}</span>
        </span>
      </button>
      {open ? (
        <div className="invite-body">
          <p className="invite-mail">{place.sourceNote}</p>
          <section className="match-panel" aria-label="Berlin environment match">
            <div className="match-panel-head">
              <p className="kicker">{tone === 'good' ? 'Strong match' : 'Weak match'}</p>
              <p className="match-rate-line">
                Liveability <strong>{verdict.matchRate}%</strong>
              </p>
            </div>
            <ul className="match-list">
              {ranked.map((check) => (
                <li key={check.id} className={check.ok ? 'ok' : 'bad'}>
                  <div className="match-row">
                    <span className="match-label">{check.label}</span>
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
          <div className="place-actions">
            <Link className="btn" to="/listings/$id" params={{ id: place.id }}>
              Open details
            </Link>
            <button type="button" className="btn ghost" onClick={onRemove}>
              Remove address
            </button>
          </div>
        </div>
      ) : null}
    </article>
  )
}

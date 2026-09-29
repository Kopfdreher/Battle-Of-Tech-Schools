import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useSession } from '../context/session.ts'
import { noiseLabel, osmEmbed, osmLink } from '../lib/format.ts'
import { evaluate } from '../lib/match.ts'
import { resolveAddress, sameAddress, toListing, type ResolveOk } from '../lib/places.ts'
import type { Requirements, SavedPlace } from '../types.ts'

type Result =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ready'; draft: ResolveOk['draft'] }
  | { kind: 'outside'; label: string }
  | { kind: 'missing' }

export function AddressPage() {
  const { requirements, places, addPlace } = useSession()
  const { q } = useSearch({ from: '/_app/address' })
  const navigate = useNavigate()
  const query = q?.trim() ?? ''
  const [draft, setDraft] = useState(query)
  const [seenQuery, setSeenQuery] = useState(query)
  const [error, setError] = useState<string | null>(null)
  const [remote, setRemote] = useState<{ query: string; result: Exclude<Result, { kind: 'idle' | 'loading' }> } | null>(
    null,
  )
  if (query !== seenQuery) {
    setSeenQuery(query)
    setDraft(query)
  }

  useEffect(() => {
    if (!query) return
    let cancelled = false
    resolveAddress(query)
      .then((resolved) => {
        if (cancelled) return
        if (!resolved.ok) {
          setRemote({
            query,
            result:
              resolved.reason === 'outside'
                ? { kind: 'outside', label: resolved.label ?? query }
                : { kind: 'missing' },
          })
          return
        }
        setRemote({ query, result: { kind: 'ready', draft: resolved.draft } })
      })
      .catch(() => {
        if (!cancelled) setRemote({ query, result: { kind: 'missing' } })
      })
    return () => {
      cancelled = true
    }
  }, [query])

  const result: Result = !query
    ? { kind: 'idle' }
    : remote?.query === query
      ? remote.result
      : { kind: 'loading' }

  const alreadyOnBoard =
    result.kind === 'ready' && places.some((place) => sameAddress(place.address, result.draft.address))

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const next = draft.trim()
    if (!next) {
      setError('Paste or write an address.')
      return
    }
    setError(null)
    void navigate({ to: '/address', search: { q: next } })
  }

  function onAdd() {
    if (result.kind !== 'ready') return
    const place = addPlace(result.draft)
    void navigate({ to: '/listings/$id', params: { id: place.id } })
  }

  return (
    <div className="address-page">
      <header className="page-head">
        <div>
          <p className="kicker">Address lookup</p>
          <h1>Look up any address</h1>
          <p className="lede">
            Paste or write a Berlin address. Add it to Kiezboard when you want to keep scoring it against your
            criteria.
          </p>
        </div>
      </header>
      <form className="panel address-box" onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="lookup-address">Address</label>
          <textarea
            id="lookup-address"
            name="address"
            rows={3}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Templiner Straße 7, 10437 Berlin"
          />
        </div>
        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}
        <button className="btn primary" type="submit">
          Look up this address
        </button>
      </form>

      {result.kind === 'loading' ? <p className="empty">Searching Berlin for that address…</p> : null}
      {result.kind === 'missing' ? (
        <p className="empty">
          That is not a valid Berlin street address. Use a street name and house number in Berlin.
        </p>
      ) : null}
      {result.kind === 'outside' ? (
        <p className="empty">{result.label} is outside Berlin. Only Berlin addresses can be added.</p>
      ) : null}
      {result.kind === 'ready' ? (
        <PlaceReport
          draft={result.draft}
          requirements={requirements}
          alreadyOnBoard={alreadyOnBoard}
          onAdd={onAdd}
        />
      ) : null}
    </div>
  )
}

function PlaceReport({
  draft,
  requirements,
  alreadyOnBoard,
  onAdd,
}: {
  draft: ResolveOk['draft']
  requirements: Requirements
  alreadyOnBoard: boolean
  onAdd: () => void
}) {
  const preview: SavedPlace = {
    ...draft,
    id: 'preview',
    addedAt: '',
  }
  const listing = toListing(preview)
  const verdict = evaluate(listing, requirements)
  const facts = [
    {
      label: 'Noise',
      value: `${draft.berlin.nightNoiseDb} dB`,
      note: `${noiseLabel(draft.berlin.nightNoiseDb)} · ${draft.berlin.noiseSource}`,
    },
    {
      label: 'Kita / schools',
      value: `${draft.berlin.education.meters} m`,
      note: `${draft.berlin.education.kita} · ${draft.berlin.education.school}`,
    },
    {
      label: 'Commute',
      value: `${draft.berlin.transit.minutes} min`,
      note: `${draft.berlin.transit.name} · ${draft.berlin.transit.line}`,
    },
    {
      label: 'Spielplatz',
      value: `${draft.berlin.playground.meters} m`,
      note: draft.berlin.playground.name,
    },
    {
      label: 'Bars / cafés / clubs',
      value: `${draft.berlin.nightlife.meters} m`,
      note: `${draft.berlin.nightlife.name} · ${draft.berlin.nightlife.scene}`,
    },
    {
      label: 'Accessibility',
      value: `${draft.berlin.accessibility.score}`,
      note: draft.berlin.accessibility.label,
    },
    {
      label: 'Parking lots',
      value: `${draft.berlin.parking.meters} m`,
      note: draft.berlin.parking.name,
    },
    {
      label: 'Supermarket',
      value: `${draft.berlin.supermarket.meters} m`,
      note: draft.berlin.supermarket.name,
    },
  ]

  return (
    <article className="detail">
      <header className="page-head">
        <div>
          <p className="kicker">
            {draft.district || 'Berlin'} · {draft.bezirk}
          </p>
          <h2>{draft.address}</h2>
          <p className="lede">
            Liveability {verdict.matchRate}% ·{' '}
            {verdict.passes ? 'clears your environment criteria' : 'held back by your environment criteria'}
          </p>
          <p>{draft.sourceNote}</p>
          <div className="place-actions">
            {alreadyOnBoard ? (
              <Link className="btn" to="/">
                Already on Kiezboard
              </Link>
            ) : (
              <button className="btn primary" type="button" onClick={onAdd}>
                Add to Kiezboard
              </button>
            )}
          </div>
        </div>
      </header>
      <section className="panel">
        <p className="kicker">Berlin open data</p>
        <h2>What the city data says about this place</h2>
        <p>{draft.berlin.note}</p>
        <dl className="facts">
          {facts.map((fact) => (
            <div key={fact.label}>
              <dt>{fact.label}</dt>
              <dd>
                <strong>{fact.value}</strong>
                <span>{fact.note}</span>
              </dd>
            </div>
          ))}
        </dl>
        <p className="footnote">
          Noise, Kita and schools, commute, Spielplatz, nightlife, accessibility, parking, and supermarket follow
          Berlin open data layers.
        </p>
      </section>
      <section className="map-frame">
        <iframe title={`Map of ${draft.address}`} src={osmEmbed(draft.lat, draft.lng)} loading="lazy" />
        <p>
          <a href={osmLink(draft.lat, draft.lng)} target="_blank" rel="noreferrer">
            Open this place in OpenStreetMap
          </a>
        </p>
      </section>
      <section className="panel checklist-wrap">
        <h2>Against your requirements</h2>
        <ul className="checklist">
          {verdict.checks.map((check) => (
            <li key={check.id} className={check.ok ? 'ok' : 'bad'}>
              <span className="pill">{check.ok ? 'Fits' : 'Held'}</span>
              <div>
                <strong>{check.label}</strong>
                <p>{check.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </article>
  )
}

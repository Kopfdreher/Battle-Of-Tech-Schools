import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { useSession } from '../context/session.ts'
import { noiseLabel, osmEmbed, osmLink } from '../lib/format.ts'
import { evaluate } from '../lib/match.ts'
import { toListing } from '../lib/places.ts'

export function ListingPage() {
  const { id } = useParams({ from: '/_app/listings/$id' })
  const navigate = useNavigate()
  const { places, requirements, removePlace } = useSession()
  const place = places.find((item) => item.id === id)

  if (!place) {
    return (
      <div>
        <Link className="back" to="/">
          Back to Kiezboard
        </Link>
        <p className="empty">That address is not on Kiezboard. Paste or type it on the board to add it.</p>
      </div>
    )
  }

  const listing = toListing(place)
  const verdict = evaluate(listing, requirements)
  const facts = [
    {
      label: 'Noise',
      value: `${place.berlin.nightNoiseDb} dB`,
      note: `${noiseLabel(place.berlin.nightNoiseDb)} · ${place.berlin.noiseSource}`,
    },
    {
      label: 'Kita / schools',
      value: `${place.berlin.education.meters} m`,
      note: `${place.berlin.education.kita} · ${place.berlin.education.school}`,
    },
    {
      label: 'Commute',
      value: `${place.berlin.transit.minutes} min`,
      note: `${place.berlin.transit.name} · ${place.berlin.transit.line}`,
    },
    {
      label: 'Spielplatz',
      value: `${place.berlin.playground.meters} m`,
      note: place.berlin.playground.name,
    },
    {
      label: 'Bars / cafés / clubs',
      value: `${place.berlin.nightlife.meters} m`,
      note: `${place.berlin.nightlife.name} · ${place.berlin.nightlife.scene}`,
    },
    {
      label: 'Accessibility',
      value: `${place.berlin.accessibility.score}`,
      note: place.berlin.accessibility.label,
    },
    {
      label: 'Parking lots',
      value: `${place.berlin.parking.meters} m`,
      note: place.berlin.parking.name,
    },
    {
      label: 'Supermarket',
      value: `${place.berlin.supermarket.meters} m`,
      note: place.berlin.supermarket.name,
    },
  ]

  return (
    <article className="detail">
      <Link className="back" to="/">
        Back to Kiezboard
      </Link>
      <header className="page-head">
        <div>
          <p className="kicker">
            {place.district || 'Berlin'} · {place.bezirk}
          </p>
          <h1>{place.address}</h1>
          <p className="lede">
            Liveability {verdict.matchRate}% from Berlin open data
            {verdict.passes ? ' · clears your environment criteria' : ' · held back by your environment criteria'}
          </p>
          <p>{place.sourceNote}</p>
        </div>
      </header>

      <section className="panel">
        <p className="kicker">Berlin open data</p>
        <h2>What the city data says about this street</h2>
        <p>{place.berlin.note}</p>
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
          Berlin open data layers. Figures here are a preview score for this address.
        </p>
      </section>

      <section className="map-frame">
        <iframe title={`Map of ${place.address}`} src={osmEmbed(place.lat, place.lng)} loading="lazy" />
        <p>
          <a href={osmLink(place.lat, place.lng)} target="_blank" rel="noreferrer">
            Open {place.address} in OpenStreetMap
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
        <div className="place-actions">
          <Link className="btn" to="/address" search={{ q: place.address }}>
            Look up again
          </Link>
          <button
            type="button"
            className="btn ghost"
            onClick={() => {
              removePlace(place.id)
              void navigate({ to: '/' })
            }}
          >
            Remove address
          </button>
        </div>
      </section>
    </article>
  )
}

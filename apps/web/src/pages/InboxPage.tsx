import { useCallback, useMemo, useState, type FormEvent } from 'react'
import { CriteriaSummary } from '../components/CriteriaSummary.tsx'
import { DashboardMap } from '../components/DashboardMap.tsx'
import { PlaceRow } from '../components/PlaceRow.tsx'
import { mapLayersForRequirements } from '../data/requirements.ts'
import { useSession } from '../context/session.ts'
import { greeting } from '../lib/format.ts'
import type { MapLayerId } from '../lib/mapLayers.ts'
import { compareListings, evaluate, matchTone } from '../lib/match.ts'
import { resolveAddress, toListing } from '../lib/places.ts'

export function InboxPage() {
  const { user, requirements, places, addPlace, removePlace } = useSession()
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const requiredLayers = useMemo(() => mapLayersForRequirements(requirements), [requirements])
  const [hiddenLayers, setHiddenLayers] = useState<MapLayerId[]>([])
  const [hiddenFor, setHiddenFor] = useState<string | null>(null)
  const requirementsKey = requirements.selected.slice().sort().join(',')
  const activeHidden = hiddenFor === requirementsKey ? hiddenLayers : []
  const layers = requiredLayers.filter((id) => !activeHidden.includes(id))

  const rows = useMemo(() => {
    const ranked = places
      .map((place) => {
        const listing = toListing(place)
        const verdict = evaluate(listing, requirements)
        return { place, listing, verdict }
      })
      .sort((left, right) =>
        compareListings(
          'fit',
          { listing: left.listing, score: left.verdict.score, matchRate: left.verdict.matchRate },
          { listing: right.listing, score: right.verdict.score, matchRate: right.verdict.matchRate },
        ),
      )
    return ranked.map((row, index) => ({ ...row, number: index + 1 }))
  }, [places, requirements])

  const goodCount = rows.filter((row) => matchTone(row.verdict) === 'good').length

  const pins = useMemo(
    () =>
      rows.map((row) => ({
        number: row.number,
        listing: row.listing,
        tone: matchTone(row.verdict),
      })),
    [rows],
  )

  const onToggleLayer = useCallback(
    (id: MapLayerId) => {
      if (!requiredLayers.includes(id)) return
      setHiddenFor(requirementsKey)
      setHiddenLayers((current) => {
        const base = hiddenFor === requirementsKey ? current : []
        return base.includes(id) ? base.filter((item) => item !== id) : [...base, id]
      })
    },
    [hiddenFor, requirementsKey, requiredLayers],
  )

  const onToggleAll = useCallback(() => {
    setHiddenFor(requirementsKey)
    setHiddenLayers((current) => {
      const base = hiddenFor === requirementsKey ? current : []
      const allVisible = requiredLayers.every((id) => !base.includes(id))
      return allVisible ? [...requiredLayers] : []
    })
  }, [hiddenFor, requirementsKey, requiredLayers])

  const onSelect = useCallback((id: string) => {
    setSelectedId((current) => (current === id ? null : id))
  }, [])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const query = draft.trim()
    if (!query) {
      setError('Paste or write a Berlin street address with a house number.')
      return
    }
    setError(null)
    setPending(true)
    try {
      const result = await resolveAddress(query)
      if (!result.ok) {
        setError(
          result.reason === 'outside'
            ? `${result.label ?? query} is outside Berlin. Only Berlin addresses can be added.`
            : 'That is not a valid Berlin street address. Use a street name and house number in Berlin.',
        )
        return
      }
      const place = addPlace(result.draft)
      setDraft('')
      setSelectedId(place.id)
    } catch {
      setError('Could not look up that address right now. Try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="dashboard">
      <header className="dash-head">
        <div>
          <p className="kicker">{user ? greeting(user.name) : 'Kiezboard'}</p>
          <h1>Kiezboard</h1>
          <p className="lede">
            Paste or type a Berlin address. If it is a real street address in the city, it is added to your list —
            green from 70% liveability up, red below that.
          </p>
        </div>
      </header>

      <form className="panel address-box" onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="board-address">Add an address</label>
          <textarea
            id="board-address"
            name="address"
            rows={2}
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
        <button className="btn primary" type="submit" disabled={pending}>
          {pending ? 'Checking…' : 'Add address'}
        </button>
      </form>

      <CriteriaSummary />

      <div className="dash-grid">
        <section className="invite-side" aria-label="Your addresses">
          <div className="invite-side-head">
            <h2>Your addresses</h2>
            <span>
              {places.length === 0
                ? '0'
                : `${goodCount} green · ${places.length - goodCount} red`}
            </span>
          </div>
          {places.length === 0 ? (
            <p className="empty">No addresses yet. Paste or type a Berlin street address above.</p>
          ) : requirements.selected.length === 0 ? (
            <p className="empty">Select required criteria first. Open Requirements and pick from the suggestions.</p>
          ) : (
            <div className="invite-list">
              {rows.map((row) => (
                <PlaceRow
                  key={row.place.id}
                  number={row.number}
                  place={row.place}
                  verdict={row.verdict}
                  open={selectedId === row.place.id}
                  onToggle={() => onSelect(row.place.id)}
                  onRemove={() => {
                    removePlace(row.place.id)
                    if (selectedId === row.place.id) setSelectedId(null)
                  }}
                />
              ))}
            </div>
          )}
        </section>

        <section className="map-side" aria-label="Map">
          <DashboardMap
            pins={pins}
            selectedId={selectedId}
            layers={layers}
            availableLayers={requiredLayers}
            onSelect={onSelect}
            onToggleLayer={onToggleLayer}
            onToggleAll={onToggleAll}
          />
        </section>
      </div>
    </div>
  )
}

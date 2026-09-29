'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearch } from '@/components/mietmatch/nav'
import { useSession } from '../context/session'
import { resolveAddress, type ResolveOk } from '../lib/places'

type Result =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ready'; draft: ResolveOk['draft'] }
  | { kind: 'outside'; label: string }
  | { kind: 'missing' }

export function AddressPage() {
  const { flat, setFlat, clearFlat } = useSession()
  const { q } = useSearch({ from: '/_app/address' })
  const navigate = useNavigate()
  const query = q?.trim() ?? ''
  const [draft, setDraft] = useState(query)
  const [seenQuery, setSeenQuery] = useState(query)
  const [error, setError] = useState<string | null>(null)
  const [remote, setRemote] = useState<{
    query: string
    result: Exclude<Result, { kind: 'idle' | 'loading' }>
  } | null>(null)
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

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const next = draft.trim()
    if (!next) {
      setError('Paste or write a Berlin street address with a house number.')
      return
    }
    setError(null)
    void navigate({ to: '/address', search: { q: next } })
  }

  function onSave() {
    if (result.kind !== 'ready') return
    setFlat(result.draft)
    void navigate({ to: '/' })
  }

  return (
    <div className="address-page">
      <header className="page-head">
        <div>
          <p className="kicker">Your listing</p>
          <h1>Add the flat address</h1>
          <p className="lede">
            Landlords shortlist applicants against one Berlin flat. We check it is a real city address, then use rent
            and rooms for affordability and household fit.
          </p>
        </div>
      </header>

      {flat ? (
        <p className="hint">
          Current flat: <strong>{flat.address}</strong>. Saving a new address replaces it.{' '}
          <button
            type="button"
            className="text-button"
            onClick={() => {
              clearFlat()
              void navigate({ to: '/' })
            }}
          >
            Clear flat
          </button>
        </p>
      ) : null}

      <form className="panel address-box" onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="lookup-address">Berlin address</label>
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

      {result.kind === 'loading' ? <p className="empty">Checking Berlin for that address…</p> : null}
      {result.kind === 'missing' ? (
        <p className="empty">
          That is not a valid Berlin street address. Use a street name and house number in Berlin.
        </p>
      ) : null}
      {result.kind === 'outside' ? (
        <p className="empty">{result.label} is outside Berlin. Only Berlin flats can be added.</p>
      ) : null}
      {result.kind === 'ready' ? <FlatPreview draft={result.draft} onSave={onSave} /> : null}
    </div>
  )
}

function FlatPreview({
  draft,
  onSave,
}: {
  draft: ResolveOk['draft']
  onSave: () => void
}) {
  return (
    <article className="detail">
      <header className="page-head">
        <div>
          <p className="kicker">
            {draft.district || 'Berlin'} · {draft.bezirk}
          </p>
          <h2>{draft.address}</h2>
          <p className="lede">
            €{draft.rentWarm} warm · {draft.rooms} rooms · {draft.sqm} m²
          </p>
          <div className="place-actions">
            <button className="btn primary" type="button" onClick={onSave}>
              Use this flat
            </button>
            <Link className="btn" to="/">
              Back to shortlist
            </Link>
          </div>
        </div>
      </header>
    </article>
  )
}

'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearch } from '@/components/mietmatch/nav'
import { useLocale } from '../context/LocaleContext'
import { useSession } from '../context/session'
import { resolveAddress, type ResolveOk } from '../lib/places'

type Result =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ready'; draft: ResolveOk['draft'] }
  | { kind: 'outside'; label: string }
  | { kind: 'missing' }

export function AddressPage() {
  const { flat, setFlat } = useSession()
  const { t } = useLocale()
  const { q } = useSearch({ from: '/_app/address' })
  const navigate = useNavigate()
  const query = q?.trim() ?? ''
  const [draft, setDraft] = useState(query || flat?.address || '')
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
      setError(t('address.error.empty'))
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
      <header className="page-head address-head">
        <p className="kicker">{t('address.kicker')}</p>
        <h1>{t('address.title')}</h1>
        <p className="lede">{t('address.lede')}</p>
      </header>

      <form className="panel address-box" onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="lookup-address">{t('address.label')}</label>
          <textarea
            id="lookup-address"
            name="address"
            rows={2}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={t('address.placeholder')}
          />
        </div>
        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="address-actions">
          <button className="btn slim primary" type="submit">
            {t('address.lookup')}
          </button>
        </div>
      </form>

      {result.kind === 'loading' ? <p className="address-status">{t('address.loading')}</p> : null}
      {result.kind === 'missing' ? <p className="address-status bad">{t('address.missing')}</p> : null}
      {result.kind === 'outside' ? (
        <p className="address-status bad">{t('address.outside', { label: result.label })}</p>
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
  const { t } = useLocale()
  return (
    <article className="address-preview">
      <p className="kicker">
        {draft.district || 'Berlin'} · {draft.bezirk}
      </p>
      <h2>{draft.address}</h2>
      <ul className="address-facts">
        <li>
          <span>{t('address.fact.rent')}</span>
          <strong>€{draft.rentWarm}</strong>
        </li>
        <li>
          <span>{t('address.fact.rooms')}</span>
          <strong>{draft.rooms}</strong>
        </li>
        <li>
          <span>{t('address.fact.size')}</span>
          <strong>{draft.sqm} m²</strong>
        </li>
      </ul>
      <div className="address-actions">
        <button className="btn slim primary" type="button" onClick={onSave}>
          {t('address.use')}
        </button>
        <Link className="btn slim ghost" to="/">
          {t('address.back')}
        </Link>
      </div>
    </article>
  )
}

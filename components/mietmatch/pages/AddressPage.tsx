'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Link, useNavigate } from '@/components/mietmatch/nav'
import { useLocale } from '../context/LocaleContext'
import { useSession } from '../context/session'
import { buildFlatDraft, isPlaceholderFlat } from '../lib/flat-setup'

export function AddressPage() {
  const { flat, setFlat } = useSession()
  const { t } = useLocale()
  const navigate = useNavigate()
  const router = useRouter()
  const existing = flat && !isPlaceholderFlat(flat) ? flat : null
  const [address, setAddress] = useState(existing?.address ?? '')
  const [rooms, setRooms] = useState(existing && existing.rooms > 0 ? String(existing.rooms) : '')
  const [sqm, setSqm] = useState(existing && existing.sqm > 0 ? String(existing.sqm) : '')
  const [rentWarm, setRentWarm] = useState(existing && existing.rentWarm > 0 ? String(existing.rentWarm) : '')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const result = await buildFlatDraft({
        address,
        rooms: Number(rooms),
        sqm: Number(sqm),
        rentWarm: Number(rentWarm),
      })
      if (!result.ok) {
        if (result.reason === 'outside') {
          setError(t('address.outside', { label: result.label ?? address }))
        } else if (result.reason === 'fields') {
          setError(t('address.error.fields'))
        } else {
          setError(t('address.error.empty'))
        }
        return
      }
      await setFlat(result.draft)
      router.refresh()
      void navigate({ to: '/' })
    } catch {
      setError(t('address.error.save'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="address-page">
      <header className="page-head address-head">
        <p className="kicker">{t('address.kicker')}</p>
        <h1>{t('address.title')}</h1>
        <p className="lede">{t('address.lede')}</p>
      </header>

      <form className="panel address-box address-setup" onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="flat-address">{t('address.label')}</label>
          <textarea
            id="flat-address"
            name="address"
            rows={2}
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder={t('address.placeholder')}
            autoComplete="street-address"
            required
          />
        </div>

        <div className="address-setup-grid">
          <div className="field">
            <label htmlFor="flat-rooms">{t('address.fact.rooms')}</label>
            <input
              id="flat-rooms"
              name="rooms"
              type="number"
              inputMode="decimal"
              min={1}
              step={0.5}
              value={rooms}
              onChange={(event) => setRooms(event.target.value)}
              placeholder="2"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="flat-sqm">{t('address.fact.size')}</label>
            <input
              id="flat-sqm"
              name="sqm"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={sqm}
              onChange={(event) => setSqm(event.target.value)}
              placeholder="65"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="flat-rent">{t('address.fact.rent')}</label>
            <input
              id="flat-rent"
              name="rent"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={rentWarm}
              onChange={(event) => setRentWarm(event.target.value)}
              placeholder="1450"
              required
            />
          </div>
        </div>

        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="address-actions">
          <button className="btn slim primary" type="submit" disabled={saving}>
            {saving ? t('address.saving') : t('address.setup')}
          </button>
          {existing ? (
            <Link className="btn slim ghost" to="/">
              {t('address.back')}
            </Link>
          ) : null}
        </div>
      </form>
    </div>
  )
}

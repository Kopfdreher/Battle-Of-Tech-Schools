import { DISTRICTS, type District, type LandlordFlat, type Listing } from '../types'
import { geocodeAddress, isBerlin } from './lookup'
import { emptyBerlinFacts, type ResolveFail, type ResolveOk, type ResolveResult } from './flat-setup'

export type { ResolveFail, ResolveOk, ResolveResult }
export { emptyBerlinFacts, isPlaceholderFlat, buildFlatDraft } from './flat-setup'

export function asDistrict(value: string): District {
  const needle = value.toLowerCase()
  return DISTRICTS.find((district) => needle.includes(district.toLowerCase())) ?? 'Mitte'
}

export function toListing(flat: LandlordFlat): Listing {
  return {
    id: flat.id,
    subject: flat.address,
    fromName: '',
    fromEmail: '',
    receivedDaysAgo: 0,
    body: flat.sourceNote,
    address: flat.address,
    district: asDistrict(flat.district),
    bezirk: flat.bezirk,
    rentWarm: flat.rentWarm,
    rooms: flat.rooms,
    sqm: flat.sqm,
    floor: '',
    availableFrom: '',
    visitInDays: 0,
    visitTime: '12:00',
    balcony: false,
    pets: false,
    wbs: false,
    lat: flat.lat,
    lng: flat.lng,
    berlin: flat.berlin,
  }
}

export function compactAddress(value: string) {
  return value
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .replace(/straße/g, 'str')
    .replace(/strasse/g, 'str')
    .replace(/[^a-z0-9]/g, '')
}

export function sameAddress(left: string, right: string) {
  const a = compactAddress(left)
  const b = compactAddress(right)
  return a.length >= 4 && (a === b || a.includes(b) || b.includes(a))
}

/** @deprecated Prefer buildFlatDraft — sample listing lookup filled placeholder rent/rooms. */
export async function resolveAddress(query: string): Promise<ResolveResult> {
  const trimmed = query.trim()
  if (!trimmed) return { ok: false, reason: 'missing' }

  const hit = await geocodeAddress(trimmed)
  if (!hit) {
    if (!/berlin/i.test(trimmed)) return { ok: false, reason: 'missing' }
    const district = asDistrict(trimmed)
    return {
      ok: true,
      draft: {
        address: trimmed,
        district,
        bezirk: district,
        lat: 52.52,
        lng: 13.405,
        rentWarm: 0,
        rooms: 0,
        sqm: 0,
        berlin: emptyBerlinFacts(),
        sourceNote: trimmed,
      },
    }
  }
  if (!isBerlin(hit, trimmed)) return { ok: false, reason: 'outside', label: hit.label }

  const district = hit.district || asDistrict(hit.label)
  return {
    ok: true,
    draft: {
      address: hit.label || trimmed,
      district,
      bezirk: district,
      lat: hit.lat,
      lng: hit.lng,
      rentWarm: 0,
      rooms: 0,
      sqm: 0,
      berlin: emptyBerlinFacts(),
      sourceNote: hit.label || trimmed,
    },
  }
}

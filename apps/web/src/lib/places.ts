import { DISTRICTS, type District, type Listing, type SavedPlace } from '../types.ts'
import {
  findListingByAddress,
  geocodeAddress,
  isBerlin,
  nearestListing,
} from './lookup.ts'

export type ResolveOk = { ok: true; draft: Omit<SavedPlace, 'id' | 'addedAt'> }
export type ResolveFail = { ok: false; reason: 'missing' | 'outside'; label?: string }
export type ResolveResult = ResolveOk | ResolveFail

export function asDistrict(value: string): District {
  const needle = value.toLowerCase()
  return DISTRICTS.find((district) => needle.includes(district.toLowerCase())) ?? 'Mitte'
}

export function toListing(place: SavedPlace): Listing {
  return {
    id: place.id,
    subject: place.address,
    fromName: '',
    fromEmail: '',
    receivedDaysAgo: 0,
    body: place.sourceNote,
    address: place.address,
    district: asDistrict(place.district),
    bezirk: place.bezirk,
    rentWarm: 0,
    rooms: 0,
    sqm: 0,
    floor: '',
    availableFrom: '',
    visitInDays: 0,
    visitTime: '12:00',
    balcony: false,
    pets: false,
    wbs: false,
    lat: place.lat,
    lng: place.lng,
    berlin: place.berlin,
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

export async function resolveAddress(query: string): Promise<ResolveResult> {
  const trimmed = query.trim()
  if (!trimmed) return { ok: false, reason: 'missing' }

  const matched = findListingByAddress(trimmed)
  if (matched) {
    return {
      ok: true,
      draft: {
        address: matched.address,
        district: matched.district,
        bezirk: matched.bezirk,
        lat: matched.lat,
        lng: matched.lng,
        berlin: matched.berlin,
        sourceNote: 'Berlin open-data preview for this street profile.',
      },
    }
  }

  const hit = await geocodeAddress(trimmed)
  if (!hit) return { ok: false, reason: 'missing' }
  if (!isBerlin(hit, trimmed)) return { ok: false, reason: 'outside', label: hit.label }

  const nearest = nearestListing(hit.lat, hit.lng)
  return {
    ok: true,
    draft: {
      address: hit.label,
      district: hit.district || nearest.listing.district,
      bezirk: nearest.listing.bezirk,
      lat: hit.lat,
      lng: hit.lng,
      berlin: nearest.listing.berlin,
      sourceNote: `Preview score from the nearest sample street, ${nearest.listing.address}, about ${nearest.meters} m away.`,
    },
  }
}

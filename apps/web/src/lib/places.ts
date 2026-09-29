import { DISTRICTS, type District, type LandlordFlat, type Listing } from '../types.ts'
import {
  findListingByAddress,
  geocodeAddress,
  isBerlin,
  nearestListing,
} from './lookup.ts'

export type ResolveOk = { ok: true; draft: Omit<LandlordFlat, 'id' | 'addedAt'> }
export type ResolveFail = { ok: false; reason: 'missing' | 'outside'; label?: string }
export type ResolveResult = ResolveOk | ResolveFail

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
        rentWarm: matched.rentWarm,
        rooms: matched.rooms,
        sqm: matched.sqm,
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
      rentWarm: nearest.listing.rentWarm,
      rooms: nearest.listing.rooms,
      sqm: nearest.listing.sqm,
      berlin: nearest.listing.berlin,
      sourceNote: `Preview score from the nearest sample street, ${nearest.listing.address}, about ${nearest.meters} m away.`,
    },
  }
}

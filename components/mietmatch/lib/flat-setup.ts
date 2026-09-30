import { DISTRICTS, type BerlinFacts, type District, type LandlordFlat } from '../types'
import { geocodeAddress, isBerlin } from './lookup'

export type ResolveOk = { ok: true; draft: Omit<LandlordFlat, 'id' | 'addedAt'> }
export type ResolveFail = { ok: false; reason: 'missing' | 'outside' | 'fields'; label?: string }
export type ResolveResult = ResolveOk | ResolveFail

function asDistrict(value: string): District {
  const needle = value.toLowerCase()
  return DISTRICTS.find((district) => needle.includes(district.toLowerCase())) ?? 'Mitte'
}

export function emptyBerlinFacts(): BerlinFacts {
  return {
    nightNoiseDb: 0,
    noiseSource: 'Not stored for this listing',
    aircraft: 'none',
    playground: { name: 'Not stored', meters: 0 },
    kita: { name: 'Not stored', meters: 0 },
    transit: { name: 'Not stored', line: '', minutes: 0 },
    park: { name: 'Not stored', meters: 0 },
    school: { name: 'Not stored', meters: 0 },
    education: { kita: 'Not stored', school: 'Not stored', meters: 0 },
    nightlife: { name: 'Not stored', meters: 0, scene: 'calm' },
    accessibility: { label: 'Not stored', meters: 0, score: 0 },
    parking: { name: 'Not stored', meters: 0 },
    supermarket: { name: 'Not stored', meters: 0 },
    milieuschutz: false,
    note: 'Street facts are not stored yet.',
  }
}

/** Sample / seed flats left over from older demo flows — never show these as the landlord flat. */
export function isPlaceholderFlat(flat: Pick<LandlordFlat, 'id' | 'address' | 'sourceNote'>): boolean {
  if (flat.id.startsWith('demo-flat-')) return true
  const note = flat.sourceNote ?? ''
  if (note.startsWith('Preview score from the nearest sample')) return true
  if (note.toLowerCase().includes('open-data preview')) return true
  const seeds = ['weserstrasse 48', 'oderberger strasse 12']
  const address = flat.address
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .replace(/straße/g, 'strasse')
  return seeds.some((seed) => address.includes(seed))
}

export async function buildFlatDraft(input: {
  address: string
  rooms: number
  sqm: number
  rentWarm: number
}): Promise<ResolveResult> {
  const trimmed = input.address.trim()
  if (!trimmed) return { ok: false, reason: 'missing' }
  if (!(input.rooms > 0) || !(input.sqm > 0) || !(input.rentWarm > 0)) {
    return { ok: false, reason: 'fields' }
  }

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
        rentWarm: input.rentWarm,
        rooms: input.rooms,
        sqm: input.sqm,
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
      rentWarm: input.rentWarm,
      rooms: input.rooms,
      sqm: input.sqm,
      berlin: emptyBerlinFacts(),
      sourceNote: hit.label || trimmed,
    },
  }
}

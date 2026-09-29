import { LISTINGS } from '../data/listings'
import type { Listing } from '../types'

export type GeoHit = {
  label: string
  lat: number
  lng: number
  city: string
  district: string
}

function compact(value: string) {
  return value
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .replace(/straße/g, 'str')
    .replace(/strasse/g, 'str')
    .replace(/[^a-z0-9]/g, '')
}

export function findListingByAddress(query: string) {
  const needle = compact(query)
  if (needle.length < 4) return null

  let best: { listing: Listing; score: number } | null = null
  for (const listing of LISTINGS) {
    const address = compact(listing.address)
    const street = address.replace(/\d+$/g, '')
    let score = 0
    if (needle.includes(address) || address.includes(needle)) score = 100
    else if (street.length > 5 && needle.includes(street)) score = 70
    if (!best || score > best.score) best = { listing, score }
  }

  if (!best || best.score < 70) return null
  return best.listing
}

function distanceMeters(fromLat: number, fromLng: number, toLat: number, toLng: number) {
  const earth = 6371000
  const latDelta = ((toLat - fromLat) * Math.PI) / 180
  const lngDelta = ((toLng - fromLng) * Math.PI) / 180
  const from = (fromLat * Math.PI) / 180
  const to = (toLat * Math.PI) / 180
  const step =
    Math.sin(latDelta / 2) ** 2 + Math.cos(from) * Math.cos(to) * Math.sin(lngDelta / 2) ** 2
  return Math.round(2 * earth * Math.asin(Math.sqrt(step)))
}

export function nearestListing(lat: number, lng: number) {
  let best = LISTINGS[0]
  let bestDistance = distanceMeters(lat, lng, best.lat, best.lng)
  for (const listing of LISTINGS.slice(1)) {
    const distance = distanceMeters(lat, lng, listing.lat, listing.lng)
    if (distance < bestDistance) {
      best = listing
      bestDistance = distance
    }
  }
  return { listing: best, meters: bestDistance }
}

export function isBerlin(hit: GeoHit, query: string) {
  return `${hit.city} ${hit.label} ${query}`.toLowerCase().includes('berlin')
}

function hasStreetAddress(properties: {
  street?: string
  housenumber?: string
  name?: string
}) {
  const street = properties.street || properties.name
  return Boolean(street && properties.housenumber)
}

export async function geocodeAddress(query: string): Promise<GeoHit | null> {
  const url = new URL('https://photon.komoot.io/api/')
  url.searchParams.set('q', query)
  url.searchParams.set('limit', '5')
  url.searchParams.set('lat', '52.52')
  url.searchParams.set('lon', '13.405')
  url.searchParams.set('lang', 'en')

  const response = await fetch(url)
  if (!response.ok) return null
  const data = (await response.json()) as {
    features?: {
      geometry?: { coordinates?: [number, number] }
      properties?: {
        name?: string
        street?: string
        housenumber?: string
        city?: string
        district?: string
        state?: string
        country?: string
      }
    }[]
  }

  const feature = data.features?.find((item) => {
    const properties = item.properties
    if (!properties || !hasStreetAddress(properties)) return false
    const blob = `${properties.city ?? ''} ${properties.state ?? ''} ${properties.country ?? ''}`
    return /berlin/i.test(blob)
  })

  if (!feature?.geometry?.coordinates) return null
  const [lng, lat] = feature.geometry.coordinates
  const properties = feature.properties ?? {}
  const streetLine = [properties.street || properties.name, properties.housenumber].filter(Boolean).join(' ')
  const label = [streetLine, properties.district, properties.city || properties.state].filter(Boolean).join(', ')
  return {
    label: label || query,
    lat,
    lng,
    city: properties.city || properties.state || '',
    district: properties.district || '',
  }
}

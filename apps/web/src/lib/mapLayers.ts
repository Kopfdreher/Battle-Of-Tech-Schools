import type { Listing } from '../types.ts'

export type MapLayerId =
  | 'noise'
  | 'education'
  | 'commute'
  | 'playground'
  | 'nightlife'
  | 'accessibility'
  | 'parking'
  | 'supermarket'

export const MAP_LAYERS: {
  id: MapLayerId
  label: string
  detail: string
  color: string
}[] = [
  { id: 'noise', label: 'Noise', detail: 'Night street noise', color: '#c4512c' },
  { id: 'education', label: 'Kita / schools', detail: 'Nearest daycare or school', color: '#215c45' },
  { id: 'commute', label: 'Commute', detail: 'Nearest U- or S-Bahn', color: '#2f4f7a' },
  { id: 'playground', label: 'Spielplatz', detail: 'Nearest playground', color: '#2f6f4e' },
  { id: 'nightlife', label: 'Bars / cafés / clubs', detail: 'Nearby nightlife', color: '#8e3b5c' },
  { id: 'accessibility', label: 'Accessibility', detail: 'Step-free access', color: '#5b4b8a' },
  { id: 'parking', label: 'Parking', detail: 'Nearest parking lot', color: '#6d4c2f' },
  { id: 'supermarket', label: 'Supermarket', detail: 'Nearest groceries', color: '#3d7a4a' },
]

export const ALL_LAYER_IDS = MAP_LAYERS.map((layer) => layer.id)

export function offsetLatLng(lat: number, lng: number, metersEast: number, metersNorth: number) {
  const latShift = metersNorth / 111_320
  const lngShift = metersEast / (111_320 * Math.cos((lat * Math.PI) / 180))
  return { lat: lat + latShift, lng: lng + lngShift }
}

export function layerPoints(listing: Listing, layer: MapLayerId) {
  const { berlin, lat, lng } = listing
  switch (layer) {
    case 'noise':
      return [
        {
          lat,
          lng,
          label: `${berlin.nightNoiseDb} dB`,
          detail: berlin.noiseSource,
          kind: 'noise' as const,
          radius: Math.max(40, berlin.nightNoiseDb),
        },
      ]
    case 'education':
      return [
        {
          ...offsetLatLng(lat, lng, berlin.education.meters * 0.4, 40),
          label: berlin.education.kita,
          detail: `${berlin.education.meters} m · also ${berlin.education.school}`,
          kind: 'point' as const,
        },
      ]
    case 'commute':
      return [
        {
          ...offsetLatLng(lat, lng, -berlin.transit.minutes * 45, -20),
          label: berlin.transit.name,
          detail: `${berlin.transit.line} · ${berlin.transit.minutes} min`,
          kind: 'point' as const,
        },
      ]
    case 'playground':
      return [
        {
          ...offsetLatLng(lat, lng, 0, berlin.playground.meters * 0.7),
          label: berlin.playground.name,
          detail: `${berlin.playground.meters} m`,
          kind: 'point' as const,
        },
      ]
    case 'nightlife':
      return [
        {
          ...offsetLatLng(lat, lng, berlin.nightlife.meters * 0.35, -berlin.nightlife.meters * 0.2),
          label: berlin.nightlife.name,
          detail: `${berlin.nightlife.meters} m · ${berlin.nightlife.scene}`,
          kind: 'point' as const,
        },
      ]
    case 'accessibility':
      return [
        {
          ...offsetLatLng(lat, lng, -80, berlin.accessibility.meters * 0.3),
          label: berlin.accessibility.label,
          detail: `Score ${berlin.accessibility.score}`,
          kind: 'point' as const,
        },
      ]
    case 'parking':
      return [
        {
          ...offsetLatLng(lat, lng, berlin.parking.meters * 0.35, berlin.parking.meters * 0.15),
          label: berlin.parking.name,
          detail: `${berlin.parking.meters} m`,
          kind: 'point' as const,
        },
      ]
    case 'supermarket':
      return [
        {
          ...offsetLatLng(lat, lng, -berlin.supermarket.meters * 0.3, berlin.supermarket.meters * 0.25),
          label: berlin.supermarket.name,
          detail: `${berlin.supermarket.meters} m`,
          kind: 'point' as const,
        },
      ]
  }
}

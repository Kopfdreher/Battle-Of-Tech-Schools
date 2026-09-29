import type { Aircraft } from '../types'

export function noiseLabel(db: number) {
  if (db <= 45) return 'Quiet'
  if (db <= 50) return 'Calm'
  if (db <= 55) return 'Noticeable'
  if (db <= 60) return 'Busy'
  return 'Loud'
}

export function aircraftLabel(level: Aircraft) {
  if (level === 'none') return 'None mapped'
  if (level === 'low') return 'Low'
  return 'Moderate'
}

export function initials(name: string) {
  const letters = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
  return letters || '?'
}

export function greeting(name: string) {
  const hour = Number(
    new Intl.DateTimeFormat('en-GB', {
      hour: 'numeric',
      hourCycle: 'h23',
      timeZone: 'Europe/Berlin',
    }).format(new Date()),
  )
  const part = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const first = name.trim().split(/\s+/)[0] || name
  return `${part}, ${first}`
}

export function visitHint(offsetDays: number) {
  if (offsetDays === 0) return 'Today'
  if (offsetDays === 1) return 'Tomorrow'
  if (offsetDays > 1 && offsetDays < 7) return `In ${offsetDays} days`
  if (offsetDays < 0) return 'Passed'
  return ''
}

export function berlinDateTime(offsetDays: number, time: string) {
  const [hours, minutes] = time.split(':').map(Number)
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
  const [year, month, day] = today.split('-').map(Number)
  const noon = new Date(Date.UTC(year, month - 1, day + offsetDays, 12, 0))
  const zone = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Berlin',
    timeZoneName: 'shortOffset',
  })
    .formatToParts(noon)
    .find((part) => part.type === 'timeZoneName')?.value
  const match = zone?.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/)
  const sign = match?.[1] === '-' ? -1 : 1
  const offsetMinutes = sign * (Number(match?.[2] ?? 1) * 60 + Number(match?.[3] ?? 0))
  return new Date(Date.UTC(year, month - 1, day + offsetDays, hours, minutes) - offsetMinutes * 60 * 1000)
}

export function formatWhen(date: Date) {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Berlin',
  }).format(date)
}

export function formatDay(date: Date) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Europe/Berlin',
  }).format(date)
}

export function osmEmbed(lat: number, lng: number) {
  const minLng = (lng - 0.012).toFixed(5)
  const minLat = (lat - 0.007).toFixed(5)
  const maxLng = (lng + 0.012).toFixed(5)
  const maxLat = (lat + 0.007).toFixed(5)
  return `https://www.openstreetmap.org/export/embed.html?bbox=${minLng}%2C${minLat}%2C${maxLng}%2C${maxLat}&layer=mapnik&marker=${lat}%2C${lng}`
}

export function osmLink(lat: number, lng: number) {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`
}

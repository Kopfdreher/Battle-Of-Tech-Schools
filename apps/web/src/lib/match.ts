import type { Listing, Requirements } from '../types.ts'
import { hasCriterion } from '../data/requirements.ts'

export type Check = {
  id: string
  label: string
  ok: boolean
  percent: number
  detail: string
  reason: string
}

export type Verdict = {
  passes: boolean
  score: number
  matchRate: number
  checks: Check[]
  failures: Check[]
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value))
}

function roundPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function maxMatch(value: number, limit: number) {
  if (limit <= 0) return value <= 0 ? 100 : 0
  if (value <= limit) return roundPercent(70 + 30 * clamp01(1 - value / limit))
  return roundPercent(69 * clamp01(limit / value))
}

function minMatch(value: number, limit: number) {
  if (limit <= 0) return 100
  if (value >= limit) return roundPercent(70 + 30 * Math.min(1, (value - limit) / Math.max(limit, 1)))
  return roundPercent(69 * clamp01(value / limit))
}

function boolMatch(ok: boolean) {
  return ok ? 100 : 0
}

export function evaluate(listing: Listing, req: Requirements): Verdict {
  const checks: Check[] = []

  if (hasCriterion(req, 'noise')) {
    checks.push({
      id: 'noise',
      label: 'Noise',
      ok: listing.berlin.nightNoiseDb <= req.maxNightNoise,
      percent: maxMatch(listing.berlin.nightNoiseDb, req.maxNightNoise),
      detail: `${listing.berlin.nightNoiseDb} dB · limit ${req.maxNightNoise} dB`,
      reason:
        listing.berlin.nightNoiseDb <= req.maxNightNoise
          ? `Night noise stays under ${req.maxNightNoise} dB`
          : `Night noise is above ${req.maxNightNoise} dB`,
    })
  }

  if (hasCriterion(req, 'education')) {
    checks.push({
      id: 'education',
      label: 'Kita / schools',
      ok: listing.berlin.education.meters <= req.maxEducationMeters,
      percent: maxMatch(listing.berlin.education.meters, req.maxEducationMeters),
      detail: `${listing.berlin.education.meters} m to ${listing.berlin.education.kita}`,
      reason:
        listing.berlin.education.meters <= req.maxEducationMeters
          ? `Kita or school within ${req.maxEducationMeters} m`
          : `Kita or school farther than ${req.maxEducationMeters} m`,
    })
  }

  if (hasCriterion(req, 'commute')) {
    checks.push({
      id: 'commute',
      label: 'Commute',
      ok: listing.berlin.transit.minutes <= req.maxCommuteMinutes,
      percent: maxMatch(listing.berlin.transit.minutes, req.maxCommuteMinutes),
      detail: `${listing.berlin.transit.minutes} min to ${listing.berlin.transit.name}`,
      reason:
        listing.berlin.transit.minutes <= req.maxCommuteMinutes
          ? `Commute walk under ${req.maxCommuteMinutes} min`
          : `Commute walk over ${req.maxCommuteMinutes} min`,
    })
  }

  if (hasCriterion(req, 'playground')) {
    checks.push({
      id: 'playground',
      label: 'Spielplatz',
      ok: listing.berlin.playground.meters <= req.maxPlaygroundMeters,
      percent: maxMatch(listing.berlin.playground.meters, req.maxPlaygroundMeters),
      detail: `${listing.berlin.playground.meters} m to ${listing.berlin.playground.name}`,
      reason:
        listing.berlin.playground.meters <= req.maxPlaygroundMeters
          ? `Spielplatz within ${req.maxPlaygroundMeters} m`
          : `Spielplatz farther than ${req.maxPlaygroundMeters} m`,
    })
  }

  if (hasCriterion(req, 'nightlife')) {
    const calmOk = !req.preferCalmNightlife || listing.berlin.nightlife.scene !== 'busy'
    const distanceOk = listing.berlin.nightlife.meters <= req.maxNightlifeMeters
    const ok = distanceOk && calmOk
    const distancePercent = maxMatch(listing.berlin.nightlife.meters, req.maxNightlifeMeters)
    const percent = req.preferCalmNightlife
      ? roundPercent(distancePercent * 0.7 + boolMatch(calmOk) * 0.3)
      : distancePercent
    checks.push({
      id: 'nightlife',
      label: 'Bars / cafés / clubs',
      ok,
      percent,
      detail: `${listing.berlin.nightlife.name} · ${listing.berlin.nightlife.meters} m · ${listing.berlin.nightlife.scene}`,
      reason: !distanceOk
        ? `Nearest café or bar is farther than ${req.maxNightlifeMeters} m`
        : !calmOk
          ? 'Nightlife nearby is busier than you want'
          : `Café or bar within ${req.maxNightlifeMeters} m`,
    })
  }

  if (hasCriterion(req, 'accessibility')) {
    checks.push({
      id: 'accessibility',
      label: 'Accessibility',
      ok: listing.berlin.accessibility.score >= req.minAccessibilityScore,
      percent: minMatch(listing.berlin.accessibility.score, req.minAccessibilityScore),
      detail: `Score ${listing.berlin.accessibility.score} · ${listing.berlin.accessibility.label}`,
      reason:
        listing.berlin.accessibility.score >= req.minAccessibilityScore
          ? `Accessibility score meets ${req.minAccessibilityScore}`
          : `Accessibility score is under ${req.minAccessibilityScore}`,
    })
  }

  if (hasCriterion(req, 'parking')) {
    checks.push({
      id: 'parking',
      label: 'Parking lots',
      ok: listing.berlin.parking.meters <= req.maxParkingMeters,
      percent: maxMatch(listing.berlin.parking.meters, req.maxParkingMeters),
      detail: `${listing.berlin.parking.meters} m to ${listing.berlin.parking.name}`,
      reason:
        listing.berlin.parking.meters <= req.maxParkingMeters
          ? `Parking within ${req.maxParkingMeters} m`
          : `Parking farther than ${req.maxParkingMeters} m`,
    })
  }

  if (hasCriterion(req, 'supermarket')) {
    checks.push({
      id: 'supermarket',
      label: 'Supermarket',
      ok: listing.berlin.supermarket.meters <= req.maxSupermarketMeters,
      percent: maxMatch(listing.berlin.supermarket.meters, req.maxSupermarketMeters),
      detail: `${listing.berlin.supermarket.meters} m to ${listing.berlin.supermarket.name}`,
      reason:
        listing.berlin.supermarket.meters <= req.maxSupermarketMeters
          ? `Supermarket within ${req.maxSupermarketMeters} m`
          : `Supermarket farther than ${req.maxSupermarketMeters} m`,
    })
  }

  const failures = checks.filter((check) => !check.ok)
  const matchRate =
    checks.length === 0
      ? 100
      : roundPercent(checks.reduce((sum, check) => sum + check.percent, 0) / checks.length)

  return {
    passes: failures.length === 0,
    score: matchRate,
    matchRate,
    checks,
    failures,
  }
}

/** Green when the overall liveability score is strong; red when it is weak. */
export const STRONG_MATCH_RATE = 70

export type MatchTone = 'good' | 'bad'

export function matchTone(verdict: Pick<Verdict, 'matchRate'>): MatchTone {
  return verdict.matchRate >= STRONG_MATCH_RATE ? 'good' : 'bad'
}

export function matchesQuery(listing: Listing, query: string) {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  return [listing.address, listing.district, listing.bezirk].join(' ').toLowerCase().includes(needle)
}

export function compareListings(
  sort: 'fit',
  left: { listing: Listing; score: number; matchRate?: number },
  right: { listing: Listing; score: number; matchRate?: number },
) {
  void sort
  return (right.matchRate ?? right.score) - (left.matchRate ?? left.score)
}

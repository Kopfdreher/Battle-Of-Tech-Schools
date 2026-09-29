import { CRITERION_IDS, type CriterionId, type Requirements } from '../types.ts'
import type { MapLayerId } from '../lib/mapLayers.ts'

export const DEFAULT_SELECTED: CriterionId[] = [
  'noise',
  'education',
  'commute',
  'playground',
  'supermarket',
]

export const CRITERIA_SUGGESTIONS: {
  id: CriterionId
  label: string
  short: string
  mapLayer?: MapLayerId
}[] = [
  { id: 'noise', label: 'Noise', short: 'Night street noise', mapLayer: 'noise' },
  { id: 'education', label: 'Kita / schools', short: 'Walk to Kita or school', mapLayer: 'education' },
  { id: 'commute', label: 'Commute', short: 'Walk to U- or S-Bahn', mapLayer: 'commute' },
  { id: 'playground', label: 'Spielplatz', short: 'Walk to a playground', mapLayer: 'playground' },
  { id: 'nightlife', label: 'Bars / cafés / clubs', short: 'Nearby nightlife', mapLayer: 'nightlife' },
  { id: 'accessibility', label: 'Accessibility', short: 'Step-free access score', mapLayer: 'accessibility' },
  { id: 'parking', label: 'Parking lots', short: 'Walk to parking', mapLayer: 'parking' },
  { id: 'supermarket', label: 'Supermarket', short: 'Walk to groceries', mapLayer: 'supermarket' },
]

export const defaultRequirements: Requirements = {
  selected: [...DEFAULT_SELECTED],
  maxNightNoise: 55,
  maxEducationMeters: 450,
  maxCommuteMinutes: 12,
  maxPlaygroundMeters: 350,
  maxNightlifeMeters: 250,
  preferCalmNightlife: false,
  minAccessibilityScore: 60,
  maxParkingMeters: 350,
  maxSupermarketMeters: 300,
}

export const PRESETS: {
  id: string
  label: string
  requirements: Requirements
}[] = [
  {
    id: 'everyday',
    label: 'Everyday',
    requirements: defaultRequirements,
  },
  {
    id: 'quiet',
    label: 'Quiet',
    requirements: {
      ...defaultRequirements,
      selected: ['noise', 'nightlife', 'commute', 'supermarket'],
      maxNightNoise: 48,
      preferCalmNightlife: true,
      maxNightlifeMeters: 400,
    },
  },
  {
    id: 'family',
    label: 'Family',
    requirements: {
      ...defaultRequirements,
      selected: ['noise', 'education', 'playground', 'supermarket', 'commute'],
      maxEducationMeters: 300,
      maxPlaygroundMeters: 200,
      maxNightNoise: 52,
    },
  },
]

export function isCriterionId(value: string): value is CriterionId {
  return (CRITERION_IDS as readonly string[]).includes(value)
}

function numberOr(value: unknown, fallback: number, min: number, max: number) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return Math.min(max, Math.max(min, value))
}

export function sanitizeRequirements(value: unknown): Requirements {
  const raw = typeof value === 'object' && value ? (value as Partial<Requirements>) : {}
  const selected = Array.isArray(raw.selected)
    ? raw.selected.filter((item): item is CriterionId => typeof item === 'string' && isCriterionId(item))
    : [...DEFAULT_SELECTED]

  return {
    selected: selected.length > 0 ? selected : [...DEFAULT_SELECTED],
    maxNightNoise: numberOr(raw.maxNightNoise, defaultRequirements.maxNightNoise, 40, 75),
    maxEducationMeters: numberOr(raw.maxEducationMeters, defaultRequirements.maxEducationMeters, 50, 1500),
    maxCommuteMinutes: numberOr(raw.maxCommuteMinutes, defaultRequirements.maxCommuteMinutes, 2, 25),
    maxPlaygroundMeters: numberOr(raw.maxPlaygroundMeters, defaultRequirements.maxPlaygroundMeters, 50, 1000),
    maxNightlifeMeters: numberOr(raw.maxNightlifeMeters, defaultRequirements.maxNightlifeMeters, 50, 800),
    preferCalmNightlife:
      typeof raw.preferCalmNightlife === 'boolean'
        ? raw.preferCalmNightlife
        : defaultRequirements.preferCalmNightlife,
    minAccessibilityScore: numberOr(
      raw.minAccessibilityScore,
      defaultRequirements.minAccessibilityScore,
      0,
      100,
    ),
    maxParkingMeters: numberOr(raw.maxParkingMeters, defaultRequirements.maxParkingMeters, 50, 1000),
    maxSupermarketMeters: numberOr(
      raw.maxSupermarketMeters,
      defaultRequirements.maxSupermarketMeters,
      50,
      1000,
    ),
  }
}

export function sameRequirements(left: Requirements, right: Requirements) {
  return JSON.stringify(left) === JSON.stringify(right)
}

export function hasCriterion(requirements: Requirements, id: CriterionId) {
  return requirements.selected.includes(id)
}

export function toggleCriterion(requirements: Requirements, id: CriterionId): Requirements {
  const on = requirements.selected.includes(id)
  const selected = on ? requirements.selected.filter((item) => item !== id) : [...requirements.selected, id]
  return { ...requirements, selected }
}

export function mapLayersForRequirements(requirements: Requirements): MapLayerId[] {
  const layers = new Set<MapLayerId>()
  for (const suggestion of CRITERIA_SUGGESTIONS) {
    if (suggestion.mapLayer && requirements.selected.includes(suggestion.id)) {
      layers.add(suggestion.mapLayer)
    }
  }
  return [...layers]
}

export function selectedCriteriaLabels(requirements: Requirements) {
  return CRITERIA_SUGGESTIONS.filter((item) => requirements.selected.includes(item.id))
}

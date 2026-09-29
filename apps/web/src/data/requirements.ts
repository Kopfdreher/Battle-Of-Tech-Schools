import { CRITERION_IDS, type CriterionId, type Requirements } from '../types.ts'

export const DEFAULT_SELECTED: CriterionId[] = [
  'affordability',
  'contract',
  'household',
  'arrearsLetter',
  'documents',
]

export const CRITERIA_SUGGESTIONS: {
  id: CriterionId
  label: string
  short: string
}[] = [
  { id: 'affordability', label: 'Affordability', short: 'Income relative to warm rent' },
  { id: 'contract', label: 'Employment contract', short: 'Prefer a permanent contract' },
  { id: 'household', label: 'Household fit', short: 'People vs number of rooms' },
  { id: 'arrearsLetter', label: 'No rent arrears', short: 'Mietschuldenfreiheitsbescheinigung' },
  { id: 'smoking', label: 'No smoking', short: 'Hard no if the applicant smokes' },
  { id: 'documents', label: 'Document checklist', short: 'Income and employment proof' },
  { id: 'schufa', label: 'SCHUFA', short: 'Optional credit check on file' },
  { id: 'employed', label: 'Employed applicant', short: 'Prefer employed over freelance/student' },
  { id: 'compactHousehold', label: 'Solo or couple', short: 'Prefer 1–2 person households' },
  { id: 'fullEvidence', label: 'Full evidence pack', short: 'Arrears letter, docs, and SCHUFA' },
]

export const defaultRequirements: Requirements = {
  selected: [...DEFAULT_SELECTED],
  minIncomeMultiple: 3,
  requirePermanentContract: true,
  maxHouseholdOverRooms: 0,
  requireArrearsLetter: true,
  smokingHardNo: true,
  requireIncomeProof: true,
  requireEmploymentProof: true,
  preferSchufa: false,
}

export const PRESETS: {
  id: string
  label: string
  requirements: Requirements
}[] = [
  {
    id: 'balanced',
    label: 'Balanced',
    requirements: defaultRequirements,
  },
  {
    id: 'strict',
    label: 'Strict',
    requirements: {
      ...defaultRequirements,
      selected: ['affordability', 'contract', 'household', 'arrearsLetter', 'smoking', 'documents', 'schufa'],
      minIncomeMultiple: 3.5,
      requirePermanentContract: true,
      preferSchufa: true,
    },
  },
  {
    id: 'flexible',
    label: 'Flexible',
    requirements: {
      ...defaultRequirements,
      selected: ['affordability', 'household', 'arrearsLetter', 'documents'],
      minIncomeMultiple: 2.5,
      requirePermanentContract: false,
      smokingHardNo: false,
      preferSchufa: false,
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
    minIncomeMultiple: numberOr(raw.minIncomeMultiple, defaultRequirements.minIncomeMultiple, 1, 6),
    requirePermanentContract:
      typeof raw.requirePermanentContract === 'boolean'
        ? raw.requirePermanentContract
        : defaultRequirements.requirePermanentContract,
    maxHouseholdOverRooms: numberOr(
      raw.maxHouseholdOverRooms,
      defaultRequirements.maxHouseholdOverRooms,
      0,
      3,
    ),
    requireArrearsLetter:
      typeof raw.requireArrearsLetter === 'boolean'
        ? raw.requireArrearsLetter
        : defaultRequirements.requireArrearsLetter,
    smokingHardNo:
      typeof raw.smokingHardNo === 'boolean' ? raw.smokingHardNo : defaultRequirements.smokingHardNo,
    requireIncomeProof:
      typeof raw.requireIncomeProof === 'boolean'
        ? raw.requireIncomeProof
        : defaultRequirements.requireIncomeProof,
    requireEmploymentProof:
      typeof raw.requireEmploymentProof === 'boolean'
        ? raw.requireEmploymentProof
        : defaultRequirements.requireEmploymentProof,
    preferSchufa: typeof raw.preferSchufa === 'boolean' ? raw.preferSchufa : defaultRequirements.preferSchufa,
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

export function reorderCriteria(
  requirements: Requirements,
  fromIndex: number,
  toIndex: number,
): Requirements {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= requirements.selected.length ||
    toIndex >= requirements.selected.length
  ) {
    return requirements
  }
  const selected = [...requirements.selected]
  const [moved] = selected.splice(fromIndex, 1)
  selected.splice(toIndex, 0, moved)
  return { ...requirements, selected }
}

export function criterionMeta(id: CriterionId) {
  return CRITERIA_SUGGESTIONS.find((item) => item.id === id) ?? { id, label: id, short: '' }
}

export function selectedCriteriaLabels(requirements: Requirements) {
  return requirements.selected.map((id) => criterionMeta(id))
}

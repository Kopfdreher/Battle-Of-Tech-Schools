export const DISTRICTS = [
  'Mitte',
  'Prenzlauer Berg',
  'Friedrichshain',
  'Kreuzberg',
  'Neukölln',
  'Wedding',
  'Schöneberg',
  'Charlottenburg',
  'Tempelhof',
  'Lichtenberg',
] as const

export type District = (typeof DISTRICTS)[number]

export type Aircraft = 'none' | 'low' | 'moderate'
export type NightlifeScene = 'calm' | 'mixed' | 'busy'
export type ContractType = 'permanent' | 'fixed' | 'freelance' | 'student' | 'other'
export type EmploymentType = 'employed' | 'self-employed' | 'student' | 'other'

/** What landlords weigh when shortlisting applicants. */
export const CRITERION_IDS = [
  'affordability',
  'contract',
  'household',
  'arrearsLetter',
  'smoking',
  'documents',
  'schufa',
  'employed',
  'compactHousehold',
  'fullEvidence',
] as const

export type CriterionId = (typeof CRITERION_IDS)[number]

export type Requirements = {
  selected: CriterionId[]
  /** Minimum net household income as a multiple of warm rent (e.g. 3). */
  minIncomeMultiple: number
  requirePermanentContract: boolean
  /** Household size must be ≤ rooms + this buffer (usually 0 or 1). */
  maxHouseholdOverRooms: number
  requireArrearsLetter: boolean
  smokingHardNo: boolean
  requireIncomeProof: boolean
  requireEmploymentProof: boolean
  preferSchufa: boolean
}

export type User = {
  id: string
  name: string
  email: string
}

export type MailboxProvider = 'gmail' | 'outlook'

export type MailboxConnection = {
  provider: MailboxProvider
  email: string
  connectedAt: string
}

export type PlaceRef = {
  name: string
  meters: number
}

export type BerlinFacts = {
  nightNoiseDb: number
  noiseSource: string
  aircraft: Aircraft
  playground: PlaceRef
  kita: PlaceRef
  transit: { name: string; line: string; minutes: number }
  park: PlaceRef
  school: PlaceRef
  education: { kita: string; school: string; meters: number }
  nightlife: { name: string; meters: number; scene: NightlifeScene }
  accessibility: { label: string; meters: number; score: number }
  parking: PlaceRef
  supermarket: PlaceRef
  milieuschutz: boolean
  note: string
}

/** The landlord's Berlin flat — street context stays here, not on applicants. */
export type LandlordFlat = {
  id: string
  address: string
  district: string
  bezirk: string
  lat: number
  lng: number
  rentWarm: number
  rooms: number
  sqm: number
  addedAt: string
  berlin: BerlinFacts
  sourceNote: string
}

/**
 * Structured applicant fields used for scoring.
 * Free-text messages are stored for display only and never feed the match score.
 */
export type Applicant = {
  id: string
  displayName: string
  /** Contact email — used for duplicate detection, not for scoring. */
  email: string
  netIncomeMonthly: number
  householdSize: number
  contractType: ContractType
  employmentType: EmploymentType
  hasArrearsLetter: boolean
  hasIncomeProof: boolean
  hasEmploymentProof: boolean
  hasSchufa: boolean
  smokes: boolean
  /** Redacted application note — never used in evaluate(). */
  messagePreview: string
  appliedAt: string
  /** Same fingerprint = likely duplicate application. */
  fingerprint: string
}

/** Sample street profiles used to preview Berlin open-data scores for a flat. */
export type Listing = {
  id: string
  subject: string
  fromName: string
  fromEmail: string
  receivedDaysAgo: number
  body: string
  address: string
  district: District
  bezirk: string
  rentWarm: number
  rooms: number
  sqm: number
  floor: string
  availableFrom: string
  visitInDays: number
  visitTime: string
  balcony: boolean
  pets: boolean
  wbs: boolean
  lat: number
  lng: number
  berlin: BerlinFacts
}

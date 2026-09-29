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

export const CRITERION_IDS = [
  'noise',
  'education',
  'commute',
  'playground',
  'nightlife',
  'accessibility',
  'parking',
  'supermarket',
] as const

export type CriterionId = (typeof CRITERION_IDS)[number]

export type Requirements = {
  selected: CriterionId[]
  maxNightNoise: number
  maxEducationMeters: number
  maxCommuteMinutes: number
  maxPlaygroundMeters: number
  maxNightlifeMeters: number
  preferCalmNightlife: boolean
  minAccessibilityScore: number
  maxParkingMeters: number
  maxSupermarketMeters: number
}

export type User = {
  id: string
  name: string
  email: string
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

/** A Berlin address the user pasted or typed onto Kiezboard. */
export type SavedPlace = {
  id: string
  address: string
  district: string
  bezirk: string
  lat: number
  lng: number
  addedAt: string
  berlin: BerlinFacts
  sourceNote: string
}

/** Sample street profiles used to preview Berlin open-data scores. */
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

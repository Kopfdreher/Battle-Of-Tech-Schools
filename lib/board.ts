import type { Applicant, BerlinFacts, LandlordFlat } from '@/components/mietmatch/types'
import { getPrisma } from '@/lib/db'

export type BoardSet = {
  flat: LandlordFlat
  applicants: Applicant[]
}

export type Board = {
  sets: BoardSet[]
}

const quietBerlin: BerlinFacts = {
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
  note: 'Street facts are not in the database yet.',
}

const districts = [
  'Prenzlauer Berg',
  'Friedrichshain',
  'Kreuzberg',
  'Neukölln',
  'Charlottenburg',
  'Schöneberg',
  'Wedding',
  'Mitte',
  'Tempelhof',
  'Lichtenberg',
]

function districtOf(title: string, address: string) {
  const text = `${title} ${address}`
  return districts.find((name) => text.includes(name)) ?? 'Berlin'
}

function preview(message: string) {
  const clean = message.replace(/\s+/g, ' ').trim()
  if (clean.length <= 180) return clean
  return `${clean.slice(0, 177)}…`
}

export async function loadBoard(): Promise<Board | null> {
  if (!process.env.DATABASE_URL) return null

  try {
    const db = getPrisma()
    const listings = await db.listing.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        applications: { orderBy: { createdAt: 'desc' } },
      },
    })
    if (listings.length === 0) return null

    return {
      sets: listings.map((listing) => ({
        flat: {
          id: listing.id,
          address: listing.address,
          district: districtOf(listing.title, listing.address),
          bezirk: districtOf(listing.title, listing.address),
          lat: 52.52,
          lng: 13.405,
          rentWarm: Number(listing.rentAmount),
          rooms: listing.rooms,
          sqm: 0,
          addedAt: listing.createdAt.toISOString(),
          berlin: quietBerlin,
          sourceNote: listing.title,
        },
        applicants: listing.applications.map((application) => ({
          id: application.id,
          displayName: application.applicantName,
          email: '',
          netIncomeMonthly: Number(application.income),
          householdSize: application.householdSize,
          contractType: application.hasPermanentContract ? 'permanent' : 'other',
          employmentType: application.hasPermanentContract ? 'employed' : 'other',
          hasArrearsLetter: application.hasMietschuldenfrei,
          hasIncomeProof: false,
          hasEmploymentProof: false,
          hasSchufa: application.hasSchufa,
          smokes: false,
          messagePreview: preview(application.rawMessage),
          appliedAt: application.createdAt.toISOString(),
          fingerprint: application.id,
        })),
      })),
    }
  } catch {
    return null
  }
}

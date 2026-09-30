import type { Applicant, BerlinFacts, LandlordFlat, ContractType, EmploymentType } from '@/components/mietmatch/types'
import { isPlaceholderFlat } from '@/components/mietmatch/lib/flat-setup'
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

export async function loadBoard(userId?: string): Promise<Board | null> {
  if (!process.env.DATABASE_URL) return null
  if (!userId) return null

  try {
    const db = getPrisma()
    const listings = await db.listing.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
    const realListings = listings.filter(
      (listing) =>
        !isPlaceholderFlat({
          id: listing.id,
          address: listing.address,
          sourceNote: listing.title,
        }),
    )
    if (realListings.length === 0) return null

    const applications = await db.application.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return {
      sets: realListings.map((listing) => ({
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
        applicants: applications.map((application) => ({
          id: application.id,
          displayName: application.displayName,
          email: application.email ?? '',
          rawEmail: application.email ?? '',
          netIncomeMonthly: Number(application.netIncomeMonthly),
          householdSize: application.householdSize,
          contractType: (application.contractType as ContractType) ?? 'other',
          employmentType: (application.employmentType as EmploymentType) ?? 'other',
          hasArrearsLetter: application.hasArrearsLetter,
          hasIncomeProof: application.hasIncomeProof ?? false,
          hasEmploymentProof: application.hasEmploymentProof ?? false,
          hasSchufa: application.hasSchufa,
          smokes: application.smokes ?? false,
          messagePreview: preview(application.messagePreview),
          appliedAt: application.appliedAt?.toISOString() ?? application.createdAt.toISOString(),
          fingerprint: application.fingerprint ?? application.id,
        })),
      })),
    }
  } catch {
    return null
  }
}

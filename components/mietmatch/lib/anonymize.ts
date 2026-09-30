/** Mask contact details; names stay real and are only blurred in the UI. */
export function maskEmail(email: string) {
  const value = email.trim()
  if (!value || !value.includes('@')) return '••••@••••'
  const [local, domain] = value.split('@')
  const localMask = local.length <= 1 ? '*' : `${local[0]}•••`
  const parts = domain.split('.')
  const domainMask = parts
    .map((part, index) => (index === parts.length - 1 ? part : `${part[0] ?? '*'}•••`))
    .join('.')
  return `${localMask}@${domainMask}`
}

/** Old code-style aliases like "Applicant K7M2" / "Bewerber K7M2". */
export function isCodedAlias(name: string) {
  return /^(applicant|bewerber)\s+[A-Z0-9]{3,8}$/i.test(name.trim())
}

const FIRST_NAMES = [
  'Anna',
  'Jonas',
  'Leyla',
  'Samir',
  'Nina',
  'Erik',
  'Ayla',
  'Tomas',
  'Priya',
  'Felix',
  'Hanna',
  'Omar',
  'Clara',
  'Luis',
  'Sofia',
  'Max',
  'Leon',
  'Emma',
  'Mia',
  'Paul',
]

const LAST_NAMES = [
  'Berger',
  'Klein',
  'Demir',
  'Okonkwo',
  'Hofmann',
  'Richter',
  'Ellison',
  'Vogt',
  'Lindqvist',
  'Alvarez',
  'Shah',
  'Braun',
  'Weber',
  'Silva',
  'Novak',
  'Müller',
  'Schmidt',
  'Fischer',
  'Meyer',
  'Wagner',
]

function hashSeed(seed: string) {
  let hash = 2166136261
  const source = seed.trim() || 'applicant'
  for (let i = 0; i < source.length; i += 1) {
    hash ^= source.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

/** Stable realistic name for migrating old coded aliases. */
export function realisticNameFromSeed(seed: string) {
  const n = hashSeed(seed)
  const first = FIRST_NAMES[n % FIRST_NAMES.length]
  const last = LAST_NAMES[Math.floor(n / FIRST_NAMES.length) % LAST_NAMES.length]
  return `${first} ${last}`
}

/**
 * Ensure the UI always gets a real-looking name — never "Applicant ABCD".
 * Prefer an explicit real name; otherwise map old codes to a stable name.
 */
export function resolveDisplayName(
  displayName: string,
  seed?: string,
  preferred?: string | null,
) {
  const preferredName = preferred?.trim()
  if (preferredName && !isCodedAlias(preferredName)) return preferredName
  const current = displayName.trim()
  if (current && !isCodedAlias(current)) return current
  return realisticNameFromSeed(seed || current || 'applicant')
}

/** Keep the real display name; mask email. Free-text previews are cleared. Preserves unmasked rawEmail. */
export function anonymizeApplicantRecord<
  T extends {
    id?: string
    fingerprint?: string
    displayName: string
    email?: string
    rawEmail?: string
    messagePreview?: string
  },
>(item: T): T {
  const seed = item.fingerprint || item.id || item.email || item.displayName || 'applicant'
  const rawEmail =
    item.rawEmail ||
    (item.email && !item.email.includes('•••') && item.email.includes('@')
      ? item.email
      : undefined)

  return {
    ...item,
    displayName: resolveDisplayName(item.displayName, seed),
    email: item.email ? maskEmail(item.email) : item.email,
    rawEmail,
    messagePreview: '',
  }
}

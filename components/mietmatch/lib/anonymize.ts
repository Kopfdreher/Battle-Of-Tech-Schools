/** Mask contact details; names stay real and are blurred in the UI. */
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

const SAFE_PREVIEW = '[Application on file — personal details hidden.]'

/** Old code-style aliases like "Applicant K7M2" / "Bewerber K7M2". */
export function isCodedAlias(name: string) {
  return /^(applicant|bewerber)\s+[A-Z0-9]{3,6}$/i.test(name.trim())
}

/** Keep the real display name; mask email and free-text preview. */
export function anonymizeApplicantRecord<
  T extends {
    id?: string
    fingerprint?: string
    displayName: string
    email?: string
    messagePreview?: string
  },
>(item: T): T {
  return {
    ...item,
    email: item.email ? maskEmail(item.email) : item.email,
    messagePreview: SAFE_PREVIEW,
  }
}

/** @deprecated Prefer BlurredName in UI. Kept for older call sites. */
export function applicantCode(seed: string) {
  const source = seed.trim() || 'applicant'
  let hash = 2166136261
  for (let i = 0; i < source.length; i += 1) {
    hash ^= source.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let n = hash >>> 0
  let out = ''
  for (let i = 0; i < 4; i += 1) {
    out += alphabet[n % alphabet.length]
    n = Math.floor(n / alphabet.length)
  }
  return out
}

/** @deprecated Names are no longer replaced with codes. */
export function anonymizedDisplayName(seed: string) {
  return seed
}

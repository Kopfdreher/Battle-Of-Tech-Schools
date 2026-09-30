/** Stable short code from an applicant id / fingerprint (no real name). */
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

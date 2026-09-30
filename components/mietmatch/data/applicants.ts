/** Stable id for de-duplicating applicants across imports. */
export function applicantFingerprint(email: string, displayName: string) {
  return `${email.trim().toLowerCase()}::${displayName.trim().toLowerCase().replace(/\s+/g, ' ')}`
}

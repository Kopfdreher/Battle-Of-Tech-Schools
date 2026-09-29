export const sessionKey = 'kiezbrief.session'
export const usersKey = 'kiezbrief.users'

export function requirementsKey(userId: string) {
  return `kiezbrief.landlord.requirements.${userId}`
}

export function flatKey(userId: string) {
  return `kiezbrief.landlord.flat.${userId}`
}

export function applicantsKey(userId: string) {
  return `kiezbrief.landlord.applicants.${userId}`
}

export function mailboxKey(userId: string) {
  return `kiezbrief.landlord.mailbox.${userId}`
}

export function invitedKey(userId: string) {
  return `kiezbrief.landlord.invited.${userId}`
}

export function invitationsKey(userId: string) {
  return `kiezbrief.landlord.invitations.${userId}`
}

export function marksKey(userId: string) {
  return `kiezbrief.landlord.marks.${userId}`
}

export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Private mode or a full disk should not block the screen.
  }
}

export function removeKey(key: string) {
  try {
    localStorage.removeItem(key)
  } catch {
    // Ignore storage failures.
  }
}

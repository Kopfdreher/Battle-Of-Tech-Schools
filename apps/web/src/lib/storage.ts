export const sessionKey = 'kiezbrief.session'
export const usersKey = 'kiezbrief.users'

export function requirementsKey(userId: string) {
  return `kiezbrief.requirements.${userId}`
}

export function placesKey(userId: string) {
  return `kiezbrief.places.${userId}`
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

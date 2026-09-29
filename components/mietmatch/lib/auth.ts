import type { User } from '../types'
import { readJson, usersKey, writeJson } from './storage'

type StoredUser = User & { passwordHash: string }

function isStoredUser(value: unknown): value is StoredUser {
  if (!value || typeof value !== 'object') return false
  const user = value as StoredUser
  return (
    typeof user.id === 'string' &&
    typeof user.name === 'string' &&
    typeof user.email === 'string' &&
    typeof user.passwordHash === 'string'
  )
}

function readUsers() {
  return readJson<unknown[]>(usersKey, []).filter(isStoredUser)
}

export async function hashPassword(email: string, password: string) {
  const data = new TextEncoder().encode(`${email}::${password}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function register(name: string, email: string, password: string): Promise<User> {
  const users = readUsers()
  const normalized = email.trim().toLowerCase()
  if (users.some((user) => user.email === normalized)) {
    throw new Error('An account with that email already exists.')
  }
  const stored: StoredUser = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: normalized,
    passwordHash: await hashPassword(normalized, password),
  }
  writeJson(usersKey, [...users, stored])
  return { id: stored.id, name: stored.name, email: stored.email }
}

export async function authenticate(email: string, password: string): Promise<User> {
  const normalized = email.trim().toLowerCase()
  const user = readUsers().find((item) => item.email === normalized)
  const hash = await hashPassword(normalized, password)
  if (!user || user.passwordHash !== hash) {
    throw new Error('That email and password do not match.')
  }
  return { id: user.id, name: user.name, email: user.email }
}

export function findUser(id: string): User | null {
  const user = readUsers().find((item) => item.id === id)
  if (!user) return null
  return { id: user.id, name: user.name, email: user.email }
}

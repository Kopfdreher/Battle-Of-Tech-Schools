import { createFileRoute, redirect } from '@tanstack/react-router'
import { findUser } from '../lib/auth.ts'
import { readJson, sessionKey } from '../lib/storage.ts'

export const Route = createFileRoute('/$')({
  beforeLoad: () => {
    const userId = readJson<string | null>(sessionKey, null)
    const user = userId ? findUser(userId) : null
    throw redirect({ to: user ? '/' : '/login' })
  },
})

import { createFileRoute, redirect } from '@tanstack/react-router'
import { SignupPage } from '../pages/SignupPage.tsx'
import { findUser } from '../lib/auth.ts'
import { readJson, sessionKey } from '../lib/storage.ts'

export const Route = createFileRoute('/signup')({
  beforeLoad: () => {
    const userId = readJson<string | null>(sessionKey, null)
    const user = userId ? findUser(userId) : null
    if (user) throw redirect({ to: '/' })
  },
  component: SignupPage,
})

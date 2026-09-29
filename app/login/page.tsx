'use client'

import { GuestOnly } from '@/components/mietmatch/components/Guards'
import { LoginPage } from '@/components/mietmatch/pages/LoginPage'

export default function Page() {
  return (
    <GuestOnly>
      <LoginPage />
    </GuestOnly>
  )
}

'use client'

import { GuestOnly } from '@/components/mietmatch/components/Guards'
import { SignupPage } from '@/components/mietmatch/pages/SignupPage'

export default function Page() {
  return (
    <GuestOnly>
      <SignupPage />
    </GuestOnly>
  )
}

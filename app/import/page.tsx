'use client'

import { SeedButton } from '@/components/seed-button'
import { Frame } from '@/components/mietmatch/frame'
import { ImportPage } from '@/components/mietmatch/pages/ImportPage'

export default function Page() {
  return (
    <Frame>
      <SeedButton />
      <ImportPage />
    </Frame>
  )
}

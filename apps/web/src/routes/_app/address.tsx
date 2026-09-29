import { createFileRoute } from '@tanstack/react-router'
import { AddressPage } from '../../pages/AddressPage.tsx'

export const Route = createFileRoute('/_app/address')({
  validateSearch: (search: Record<string, unknown>): { q?: string } => ({
    q: typeof search.q === 'string' ? search.q : undefined,
  }),
  component: AddressPage,
})

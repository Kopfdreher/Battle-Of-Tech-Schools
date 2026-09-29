import { createFileRoute } from '@tanstack/react-router'
import { ListingPage } from '../../pages/ListingPage.tsx'

export const Route = createFileRoute('/_app/listings/$id')({
  component: ListingPage,
})

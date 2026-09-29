import { createFileRoute } from '@tanstack/react-router'
import { ImportPage } from '../../pages/ImportPage.tsx'

export const Route = createFileRoute('/_app/import')({
  component: ImportPage,
})

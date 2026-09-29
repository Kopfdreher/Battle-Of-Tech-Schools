import { createFileRoute } from '@tanstack/react-router'
import { RequirementsPage } from '../../pages/RequirementsPage.tsx'

export const Route = createFileRoute('/_app/requirements')({
  component: RequirementsPage,
})

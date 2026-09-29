import { createFileRoute } from '@tanstack/react-router'
import { AppointmentsPage } from '../../pages/AppointmentsPage.tsx'

export const Route = createFileRoute('/_app/appointments')({
  component: AppointmentsPage,
})

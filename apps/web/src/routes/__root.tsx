import { Outlet, createRootRoute } from '@tanstack/react-router'
import { SessionProvider } from '../context/SessionContext.tsx'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <SessionProvider>
      <Outlet />
    </SessionProvider>
  )
}

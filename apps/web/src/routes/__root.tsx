import { Outlet, createRootRoute } from '@tanstack/react-router'
import { LocaleProvider } from '../context/LocaleContext.tsx'
import { SessionProvider } from '../context/SessionContext.tsx'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <LocaleProvider>
      <SessionProvider>
        <Outlet />
      </SessionProvider>
    </LocaleProvider>
  )
}

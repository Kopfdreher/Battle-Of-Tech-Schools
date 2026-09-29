'use client'

import NextLink from 'next/link'
import { useParams as useNextParams, usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, type ReactNode } from 'react'

type Target = {
  to: string
  search?: Record<string, string | undefined>
  params?: { id?: string }
}

function hrefOf(target: string | Target) {
  if (typeof target === 'string') return target
  let path = target.to
  if (target.params?.id) path = path.replace('$id', target.params.id)
  if (target.search) {
    const query = new URLSearchParams()
    for (const [key, value] of Object.entries(target.search)) {
      if (value) query.set(key, value)
    }
    const text = query.toString()
    if (text) path += `?${text}`
  }
  return path
}

export function Link({
  to,
  params,
  className,
  children,
}: {
  to: string
  params?: { id?: string }
  className?: string
  children?: ReactNode
}) {
  return (
    <NextLink className={className} href={hrefOf({ to, params })}>
      {children}
    </NextLink>
  )
}

export function useNavigate() {
  const router = useRouter()
  return (target: string | Target) => {
    router.push(hrefOf(target))
  }
}

export function useParams(_opts?: { from?: string }) {
  const params = useNextParams()
  const id = params.id
  return { id: typeof id === 'string' ? id : '' }
}

export function useSearch(_opts?: { from?: string }) {
  const params = useSearchParams()
  return { q: params.get('q') ?? undefined }
}

export function useRouterState({
  select,
}: {
  select: (state: { location: { pathname: string } }) => string
}) {
  const pathname = usePathname()
  return select({ location: { pathname } })
}

export function Navigate({ to }: { to: string }) {
  const router = useRouter()
  useEffect(() => {
    router.replace(to)
  }, [router, to])
  return null
}

export function Outlet() {
  return null
}

import { useEffect, useId, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useSession } from '../context/session.ts'
import { initials } from '../lib/format.ts'

export function ProfileMenu({ floating = false }: { floating?: boolean }) {
  const { user, logout } = useSession()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return
    function onPointer(event: MouseEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!user) return null

  return (
    <div className={floating ? 'profile floating' : 'profile'} ref={root}>
      {open ? (
        <div className="profile-menu" id={menuId} role="menu">
          <div className="profile-meta">
            <strong>{user.name}</strong>
            <small>{user.email}</small>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              logout()
              setOpen(false)
              void navigate({ to: '/login' })
            }}
          >
            Log out
          </button>
        </div>
      ) : null}
      <button
        type="button"
        className={open ? 'profile-trigger open' : 'profile-trigger'}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label="Open profile menu"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="avatar" aria-hidden="true">
          {initials(user.name)}
        </span>
        {floating ? null : (
          <span className="profile-copy">
            <strong>{user.name}</strong>
            <small>{user.email}</small>
          </span>
        )}
      </button>
    </div>
  )
}

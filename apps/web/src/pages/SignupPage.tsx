import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { AuthLayout } from '../components/AuthLayout.tsx'
import { useSession } from '../context/session.ts'

export function SignupPage() {
  const { signup } = useSession()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    if (name.trim().length < 2) {
      setError('Add the name you want on the account.')
      return
    }
    if (!email.includes('@')) {
      setError('Enter a valid email address.')
      return
    }
    if (password.length < 8) {
      setError('Use a password of at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Those passwords do not match.')
      return
    }
    setPending(true)
    try {
      await signup(name, email, password)
      void navigate({ to: '/' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the account.')
    } finally {
      setPending(false)
    }
  }

  return (
    <AuthLayout>
      <p className="kicker">Create account</p>
      <h2>Check the street, not the rent</h2>
      <p className="lede">
        After this, paste or type any Berlin address on Kiezboard. We score the street around it — not rent or room
        count.
      </p>
      <form className="form" onSubmit={onSubmit} noValidate>
        <div className="field">
          <label htmlFor="name">Name</label>
          <input
            id="name"
            name="name"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="signup-email">Email</label>
          <input
            id="signup-email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="signup-password">Password</label>
          <input
            id="signup-password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <p className="hint">At least 8 characters. Stored only as a hash in this browser.</p>
        </div>
        <div className="field">
          <label htmlFor="confirm">Confirm password</label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            required
          />
        </div>
        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}
        <button className="btn primary full" type="submit" disabled={pending}>
          {pending ? 'Creating…' : 'Create account'}
        </button>
      </form>
      <p className="switch">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </AuthLayout>
  )
}

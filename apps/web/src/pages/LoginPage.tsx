import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { AuthLayout } from '../components/AuthLayout.tsx'
import { useSession } from '../context/session.ts'

export function LoginPage() {
  const { login } = useSession()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    if (!email.includes('@') || password.length < 8) {
      setError('Use the email and password from your account. Passwords are at least 8 characters.')
      return
    }
    setPending(true)
    try {
      await login(email, password)
      void navigate({ to: '/' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not log in.')
    } finally {
      setPending(false)
    }
  }

  return (
    <AuthLayout>
      <p className="kicker">Log in</p>
      <h2>Welcome back</h2>
      <p className="lede">Then look up a Berlin address and score the street around it.</p>
      <form className="form" onSubmit={onSubmit} noValidate>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>
        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}
        <button className="btn primary full" type="submit" disabled={pending}>
          {pending ? 'Checking…' : 'Log in'}
        </button>
      </form>
      <p className="switch">
        New here? <Link to="/signup">Create an account</Link>
      </p>
    </AuthLayout>
  )
}

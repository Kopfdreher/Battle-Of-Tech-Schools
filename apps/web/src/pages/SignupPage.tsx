import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { AuthLayout } from '../components/AuthLayout.tsx'
import { useLocale } from '../context/LocaleContext.tsx'
import { useSession } from '../context/session.ts'

export function SignupPage() {
  const { signup } = useSession()
  const { t } = useLocale()
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
      setError(t('signup.error.name'))
      return
    }
    if (!email.includes('@')) {
      setError(t('signup.error.email'))
      return
    }
    if (password.length < 8) {
      setError(t('signup.error.password'))
      return
    }
    if (password !== confirm) {
      setError(t('signup.error.match'))
      return
    }
    setPending(true)
    try {
      await signup(name, email, password)
      void navigate({ to: '/' })
    } catch (err) {
      setError(err instanceof Error ? err.message : t('signup.error.generic'))
    } finally {
      setPending(false)
    }
  }

  return (
    <AuthLayout>
      <p className="kicker">{t('signup.kicker')}</p>
      <h2>{t('signup.title')}</h2>
      <p className="lede">{t('signup.lede')}</p>
      <form className="form" onSubmit={onSubmit} noValidate>
        <div className="field">
          <label htmlFor="name">{t('signup.name')}</label>
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
          <label htmlFor="signup-email">{t('signup.email')}</label>
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
          <label htmlFor="signup-password">{t('signup.password')}</label>
          <input
            id="signup-password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <p className="hint">{t('signup.passwordHint')}</p>
        </div>
        <div className="field">
          <label htmlFor="confirm">{t('signup.confirm')}</label>
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
          {pending ? t('signup.pending') : t('signup.submit')}
        </button>
      </form>
      <p className="switch">
        {t('signup.switch')} <Link to="/login">{t('signup.login')}</Link>
      </p>
    </AuthLayout>
  )
}

'use client'

import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from '@/components/mietmatch/nav'
import { AuthLayout } from '../components/AuthLayout'
import { useLocale } from '../context/LocaleContext'
import { useSession } from '../context/session'

export function LoginPage() {
  const { login } = useSession()
  const { t } = useLocale()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    if (!email.includes('@') || password.length < 8) {
      setError(t('login.error.validation'))
      return
    }
    setPending(true)
    try {
      await login(email, password)
      void navigate({ to: '/' })
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login.error.generic'))
    } finally {
      setPending(false)
    }
  }

  return (
    <AuthLayout>
      <p className="kicker">{t('login.kicker')}</p>
      <h2>{t('login.title')}</h2>
      <p className="lede">{t('login.lede')}</p>
      <form className="form" method="post" onSubmit={onSubmit} noValidate>
        <div className="field">
          <label htmlFor="email">{t('login.email')}</label>
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
          <label htmlFor="password">{t('login.password')}</label>
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
          {pending ? t('login.pending') : t('login.submit')}
        </button>
      </form>
      <p className="switch">
        {t('login.switch')} <Link to="/signup">{t('login.create')}</Link>
      </p>
    </AuthLayout>
  )
}

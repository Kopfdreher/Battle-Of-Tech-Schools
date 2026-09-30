'use client'

import { useId, useRef, useState } from 'react'
import { Navigate, useNavigate } from '@/components/mietmatch/nav'
import { Brand } from '../components/Brand'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { useLocale } from '../context/LocaleContext'
import { useSession } from '../context/session'
import { CRITERIA_SUGGESTIONS, DEFAULT_SELECTED } from '../data/requirements'
import { buildDemoCsv, CSV_TEMPLATE, parseApplicantCsv } from '../lib/csv'
import type { CriterionId, MailboxProvider } from '../types'

type Step = 'fit' | 'email' | 'csv'

const ONBOARD_CRITERIA = CRITERIA_SUGGESTIONS.filter((item) =>
  [
    'affordability',
    'contract',
    'household',
    'arrearsLetter',
    'documents',
    'schufa',
    'smoking',
    'employed',
  ].includes(item.id),
)

export function OnboardingPage() {
  const {
    user,
    ready,
    onboardingDone,
    requirements,
    updateRequirements,
    connectMailbox,
    importApplicants,
    completeOnboarding,
  } = useSession()
  const { t } = useLocale()
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('fit')
  const [selected, setSelected] = useState<CriterionId[]>(() =>
    requirements.selected.length > 0 ? [...requirements.selected] : [...DEFAULT_SELECTED],
  )
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const fileId = useId()
  const fileRef = useRef<HTMLInputElement>(null)

  if (!ready) return null
  if (!user) return <Navigate to="/login" />
  if (onboardingDone) return <Navigate to="/" />

  const stepIndex = step === 'fit' ? 1 : step === 'email' ? 2 : 3

  function finish() {
    completeOnboarding()
    void navigate({ to: '/' })
  }

  function saveFitAndContinue() {
    if (selected.length === 0) {
      setError(t('onboarding.fit.error'))
      return
    }
    setError(null)
    updateRequirements({ ...requirements, selected: [...selected] })
    setStep('email')
  }

  function toggleCriterion(id: CriterionId) {
    setError(null)
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  function moveCriterion(id: CriterionId, direction: -1 | 1) {
    setSelected((current) => {
      const index = current.indexOf(id)
      const nextIndex = index + direction
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current
      const next = [...current]
      const [item] = next.splice(index, 1)
      next.splice(nextIndex, 0, item)
      return next
    })
  }

  function allowMailbox(provider: MailboxProvider) {
    connectMailbox(provider)
    finish()
  }

  function onFile(file: File | null) {
    if (!file) return
    setError(null)
    setMessage(null)
    const reader = new FileReader()
    reader.onload = () => {
      const parsed = parseApplicantCsv(String(reader.result ?? ''))
      if (parsed.drafts.length === 0) {
        setError(parsed.errors[0] ?? t('onboarding.csv.error'))
        return
      }
      const count = importApplicants(parsed.drafts, 'replace')
      setMessage(t('onboarding.csv.imported', { count }))
      window.setTimeout(finish, 500)
    }
    reader.onerror = () => setError(t('onboarding.csv.readError'))
    reader.readAsText(file)
  }

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'besichtigo-applicants.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  function downloadSample() {
    const blob = new Blob([buildDemoCsv()], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'besichtigo-sample-applicants.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="wizard">
      <header className="wizard-top">
        <Brand />
        <div className="wizard-top-right">
          <p className="wizard-hello">{t('onboarding.hello', { name: user.name })}</p>
          <LanguageSwitcher compact />
        </div>
      </header>

      <div className="wizard-progress wizard-progress-3" aria-label={t('onboarding.progressLabel')}>
        <div className={stepIndex >= 1 ? 'wizard-step on' : 'wizard-step'}>
          <span>1</span>
          <small>{t('onboarding.progress.fit')}</small>
        </div>
        <div className="wizard-rail" aria-hidden="true">
          <i style={{ width: stepIndex >= 2 ? '100%' : '0%' }} />
        </div>
        <div className={stepIndex >= 2 ? 'wizard-step on' : 'wizard-step'}>
          <span>2</span>
          <small>{t('onboarding.progress.email')}</small>
        </div>
        <div className="wizard-rail" aria-hidden="true">
          <i style={{ width: stepIndex >= 3 ? '100%' : '0%' }} />
        </div>
        <div className={stepIndex >= 3 ? 'wizard-step on' : 'wizard-step'}>
          <span>3</span>
          <small>{t('onboarding.progress.csv')}</small>
        </div>
      </div>

      <main className={step === 'fit' ? 'wizard-stage wizard-stage-fit' : 'wizard-stage'} key={step}>
        {step === 'fit' ? (
          <section className="wizard-panel wizard-panel-fit">
            <p className="kicker">{t('onboarding.fit.kicker')}</p>
            <h1>{t('onboarding.fit.title')}</h1>
            <p className="lede">{t('onboarding.fit.lede')}</p>
            <ul className="wizard-fit-list" aria-label={t('onboarding.fit.pickLabel')}>
              {[
                ...selected,
                ...ONBOARD_CRITERIA.map((item) => item.id).filter((id) => !selected.includes(id)),
              ].map((id) => {
                const on = selected.includes(id)
                const index = selected.indexOf(id)
                return (
                  <li key={id} className={on ? 'on' : undefined}>
                    <button
                      type="button"
                      className="wizard-fit-toggle"
                      aria-pressed={on}
                      onClick={() => toggleCriterion(id)}
                    >
                      <span className="wizard-fit-num" aria-hidden="true">
                        {on ? index + 1 : ''}
                      </span>
                      <span>{t(`criterion.${id}`)}</span>
                    </button>
                    {on ? (
                      <div className="wizard-fit-move">
                        <button
                          type="button"
                          className="btn ghost"
                          disabled={index === 0}
                          aria-label={t('onboarding.fit.moveUp')}
                          onClick={() => moveCriterion(id, -1)}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className="btn ghost"
                          disabled={index === selected.length - 1}
                          aria-label={t('onboarding.fit.moveDown')}
                          onClick={() => moveCriterion(id, 1)}
                        >
                          ↓
                        </button>
                      </div>
                    ) : null}
                  </li>
                )
              })}
            </ul>
            {error ? (
              <p className="error" role="alert">
                {error}
              </p>
            ) : null}
          </section>
        ) : step === 'email' ? (
          <section className="wizard-panel">
            <p className="kicker">{t('onboarding.email.kicker')}</p>
            <h1>{t('onboarding.email.title')}</h1>
            <p className="lede">{t('onboarding.email.lede')}</p>
            <ul className="wizard-points">
              <li>
                <span>1</span>
                <p>{t('onboarding.email.point1')}</p>
              </li>
              <li>
                <span>2</span>
                <p>{t('onboarding.email.point2')}</p>
              </li>
              <li>
                <span>3</span>
                <p>{t('onboarding.email.point3')}</p>
              </li>
              <li>
                <span>4</span>
                <p>{t('onboarding.email.point4')}</p>
              </li>
            </ul>
          </section>
        ) : (
          <section className="wizard-panel">
            <p className="kicker">{t('onboarding.csv.kicker')}</p>
            <h1>{t('onboarding.csv.title')}</h1>
            <p className="lede">{t('onboarding.csv.lede')}</p>
            <input
              id={fileId}
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              hidden
              onChange={(event) => {
                onFile(event.target.files?.[0] ?? null)
                event.target.value = ''
              }}
            />
            <div className="wizard-file-row">
              <button type="button" className="btn primary" onClick={() => fileRef.current?.click()}>
                {t('onboarding.csv.upload')}
              </button>
              <button type="button" className="btn" onClick={downloadTemplate}>
                {t('onboarding.csv.template')}
              </button>
              <button type="button" className="btn" onClick={downloadSample}>
                {t('onboarding.csv.sample')}
              </button>
            </div>
            {error ? (
              <p className="error" role="alert">
                {error}
              </p>
            ) : null}
            {message ? <p className="hint import-ok">{message}</p> : null}
          </section>
        )}
      </main>

      <footer className="wizard-foot">
        {step === 'fit' ? (
          <button type="button" className="btn primary" onClick={saveFitAndContinue}>
            {t('onboarding.fit.continue')}
          </button>
        ) : step === 'email' ? (
          <>
            <button type="button" className="btn ghost" onClick={() => setStep('fit')}>
              {t('onboarding.back')}
            </button>
            <button type="button" className="btn primary" onClick={() => allowMailbox('gmail')}>
              {t('onboarding.email.gmail')}
            </button>
            <button type="button" className="btn" onClick={() => allowMailbox('outlook')}>
              {t('onboarding.email.outlook')}
            </button>
            <button
              type="button"
              className="btn ghost"
              onClick={() => {
                setError(null)
                setMessage(null)
                setStep('csv')
              }}
            >
              {t('onboarding.email.csv')}
            </button>
          </>
        ) : (
          <>
            <button type="button" className="btn ghost" onClick={() => setStep('email')}>
              {t('onboarding.back')}
            </button>
            <button type="button" className="btn primary" onClick={() => fileRef.current?.click()}>
              {t('onboarding.csv.upload')}
            </button>
            <button type="button" className="btn ghost" onClick={finish}>
              {t('onboarding.csv.skip')}
            </button>
          </>
        )}
      </footer>
    </div>
  )
}

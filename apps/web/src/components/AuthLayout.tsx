import type { ReactNode } from 'react'
import { useLocale } from '../context/LocaleContext.tsx'
import { Brand } from './Brand.tsx'
import { LanguageSwitcher } from './LanguageSwitcher.tsx'

export function AuthLayout({ children }: { children: ReactNode }) {
  const { t } = useLocale()
  return (
    <div className="auth">
      <section className="auth-story">
        <div className="auth-story-top">
          <p className="auth-audience">{t('auth.audience')}</p>
          <LanguageSwitcher compact />
        </div>
        <div className="auth-story-body">
          <Brand />
          <h1>{t('auth.title')}</h1>
          <p className="lede">{t('auth.lede')}</p>
          <ol className="points">
            <li>
              <span>1</span>
              <p>{t('auth.step1')}</p>
            </li>
            <li>
              <span>2</span>
              <p>{t('auth.step2')}</p>
            </li>
            <li>
              <span>3</span>
              <p>{t('auth.step3')}</p>
            </li>
          </ol>
          <p className="auth-foot">{t('auth.foot')}</p>
        </div>
      </section>
      <section className="auth-panel">
        <div className="auth-card panel">{children}</div>
      </section>
    </div>
  )
}

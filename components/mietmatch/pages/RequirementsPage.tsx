'use client'

import { RequirementsEditor } from '../components/RequirementsEditor'
import { useLocale } from '../context/LocaleContext'

export function RequirementsPage() {
  const { t } = useLocale()
  return (
    <div className="requirements">
      <header className="page-head requirements-head">
        <p className="kicker">{t('requirements.kicker')}</p>
        <h1>{t('requirements.title')}</h1>
        <p className="lede">{t('requirements.lede')}</p>
      </header>
      <RequirementsEditor />
    </div>
  )
}

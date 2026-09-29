import { RequirementsEditor } from '../components/RequirementsEditor.tsx'
import { useLocale } from '../context/LocaleContext.tsx'

export function RequirementsPage() {
  const { t } = useLocale()
  return (
    <div className="requirements">
      <header className="page-head">
        <div>
          <p className="kicker">{t('requirements.kicker')}</p>
          <h1>{t('requirements.title')}</h1>
          <p className="lede">{t('requirements.lede')}</p>
        </div>
      </header>
      <RequirementsEditor />
    </div>
  )
}

'use client'

import { useLocale } from '../context/LocaleContext'
import { useSession } from '../context/session'

/** Toggle to show real names or blur them for privacy. */
export function NameVisibilityToggle({ className = '' }: { className?: string }) {
  const { namesVisible, setNamesVisible } = useSession()
  const { t } = useLocale()

  return (
    <button
      type="button"
      className={['name-visibility-toggle', namesVisible ? 'on' : '', className]
        .filter(Boolean)
        .join(' ')}
      aria-pressed={namesVisible}
      onClick={() => setNamesVisible(!namesVisible)}
      title={namesVisible ? t('privacy.namesHide') : t('privacy.namesShow')}
    >
      <span className="toggle-track" aria-hidden="true">
        <span className="toggle-thumb" />
      </span>
      <span>{namesVisible ? t('privacy.namesOn') : t('privacy.namesOff')}</span>
    </button>
  )
}

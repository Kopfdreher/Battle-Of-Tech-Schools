import { useLocale } from '../context/LocaleContext.tsx'
import type { Locale } from '../i18n/messages.ts'

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t, locales } = useLocale()

  return (
    <div className={compact ? 'lang-switch compact' : 'lang-switch'} role="group" aria-label={t('nav.language')}>
      {locales.map((item) => (
        <button
          key={item.id}
          type="button"
          className={locale === item.id ? 'lang-btn on' : 'lang-btn'}
          aria-pressed={locale === item.id}
          onClick={() => setLocale(item.id as Locale)}
        >
          {item.id.toUpperCase()}
        </button>
      ))}
    </div>
  )
}

import { useLocale } from '../context/LocaleContext.tsx'

export function Brand() {
  const { t } = useLocale()
  return (
    <div className="brand">
      <span className="mark" aria-hidden="true">
        <svg viewBox="0 0 32 32" width="22" height="22">
          <path
            d="M6 14.5 16 6l10 8.5V26H6V14.5Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path d="M13 26v-7h6v7" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      </span>
      <span className="brand-text">
        <strong>BesichtiGo</strong>
        <small>{t('brand.tagline')}</small>
      </span>
    </div>
  )
}

import { Link } from '@tanstack/react-router'
import { ImportApplicants } from '../components/ImportApplicants.tsx'
import { useLocale } from '../context/LocaleContext.tsx'
import { useSession } from '../context/session.ts'

export function ImportPage() {
  const { flat, applicants } = useSession()
  const { t } = useLocale()

  return (
    <div className="import-page">
      <header className="page-head">
        <p className="kicker">{t('import.kicker')}</p>
        <h1>{t('import.title')}</h1>
        <p className="lede">{t('import.lede')}</p>
      </header>

      <section className="panel flat-summary">
        <div>
          <p className="kicker">{t('import.context')}</p>
          {flat ? (
            <>
              <h2>{flat.address}</h2>
              <p className="lede">
                {t('import.stats', {
                  rent: flat.rentWarm,
                  rooms: flat.rooms,
                  count: applicants.length,
                })}
              </p>
            </>
          ) : (
            <>
              <h2>{t('import.noFlat')}</h2>
              <p className="lede">{t('import.noFlatLede')}</p>
            </>
          )}
        </div>
        <div className="place-actions">
          {flat ? (
            <Link className="btn primary" to="/">
              {t('import.openShortlist')}
            </Link>
          ) : (
            <Link className="btn primary" to="/address">
              {t('import.addFlatFirst')}
            </Link>
          )}
        </div>
      </section>

      <ImportApplicants />
    </div>
  )
}

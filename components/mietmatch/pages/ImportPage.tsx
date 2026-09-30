'use client'

import { Link } from '@/components/mietmatch/nav'
import { ImportApplicants } from '../components/ImportApplicants'
import { useLocale } from '../context/LocaleContext'
import { useSession } from '../context/session'

export function ImportPage() {
  const { flat, applicants } = useSession()
  const { t } = useLocale()

  return (
    <div className="import-page">
      <header className="import-head">
        <div className="import-head-copy">
          <p className="kicker">{t('import.kicker')}</p>
          <h1>{t('import.title')}</h1>
        </div>
        <div className="import-head-meta">
          {flat ? (
            <p className="import-flat-chip">
              {flat.address} · €{flat.rentWarm} · {applicants.length}
            </p>
          ) : (
            <p className="hint">{t('import.noFlat')}</p>
          )}
          {flat ? (
            <Link className="btn slim primary" to="/">
              {t('import.openShortlist')}
            </Link>
          ) : (
            <Link className="btn slim primary" to="/address">
              {t('import.addFlatFirst')}
            </Link>
          )}
        </div>
      </header>

      <ImportApplicants />
    </div>
  )
}

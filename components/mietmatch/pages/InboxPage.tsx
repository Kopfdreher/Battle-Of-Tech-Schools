'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Link } from '@/components/mietmatch/nav'
import { syncApplicationsAction } from '@/app/actions/n8n'
import { ApplicantRow, type ListGroup } from '../components/ApplicantRow'
import { CriteriaBoard } from '../components/CriteriaBoard'
import { InvitePanel } from '../components/InvitePanel'
import { NameVisibilityToggle } from '../components/NameVisibilityToggle'
import { useLocale } from '../context/LocaleContext'
import { useSession } from '../context/session'
import { parseApplicantCsv } from '../lib/csv'
import { compareApplicants, evaluateApplicant, matchTone } from '../lib/match'

type MatchFilter = 'all' | 'strong' | 'weak' | 'duplicates'

export function InboxPage() {
  const { user, requirements, flat, applicants, marks, removeApplicant, importApplicants } =
    useSession()
  const { t } = useLocale()
  const csvInputId = useId()
  const csvInputRef = useRef<HTMLInputElement>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [listGroup, setListGroup] = useState<ListGroup>('all')
  const [filter, setFilter] = useState<MatchFilter>('all')
  const [minPercent, setMinPercent] = useState(0)
  const router = useRouter()
  const syncAttempted = useRef(false)

  useEffect(() => {
    if (user && flat && !syncAttempted.current) {
      syncAttempted.current = true
      syncApplicationsAction(flat.id, user.email).then(() => {
        setTimeout(() => {
          router.refresh()
        }, 5000)
      })
    }
  }, [user, flat, router])
  const [csvMessage, setCsvMessage] = useState<string | null>(null)
  const [csvError, setCsvError] = useState<string | null>(null)

  const ranked = useMemo(() => {
    if (!flat) return []
    const list = applicants
      .map((applicant) => ({
        applicant,
        verdict: evaluateApplicant(applicant, flat, requirements, applicants),
      }))
      .sort(compareApplicants)

    return list.map((row, index) => ({
      ...row,
      number: index + 1,
    }))
  }, [applicants, flat, requirements])

  const likedCount = useMemo(
    () => ranked.filter((row) => marks[row.applicant.id] === 'like').length,
    [ranked, marks],
  )

  const rows = useMemo(() => {
    if (listGroup === 'like') return ranked.filter((row) => marks[row.applicant.id] === 'like')
    return ranked
  }, [ranked, marks, listGroup])

  const goodCount = useMemo(
    () => ranked.filter((row) => matchTone(row.verdict) === 'good').length,
    [ranked],
  )

  function onCsvFile(file: File | null) {
    if (!file) return
    setCsvError(null)
    setCsvMessage(null)
    const reader = new FileReader()
    reader.onload = async () => {
      const parsed = parseApplicantCsv(String(reader.result ?? ''))
      if (parsed.drafts.length === 0) {
        setCsvError(parsed.errors[0] ?? t('import.csv.error'))
        return
      }
      const count = await importApplicants(parsed.drafts, applicants.length > 0 ? 'append' : 'replace')
      setCsvMessage(t('import.csv.imported', { count, skipped: parsed.errors.length }))
      router.refresh()
    }
    reader.onerror = () => setCsvError(t('import.csv.readError'))
    reader.readAsText(file)
  }

  return (
    <div className="dashboard">
      {!flat ? (
        <section className="panel address-box inbox-start">
          <p className="kicker">{t('inbox.flat')}</p>
          <h2>{t('inbox.setupFlat')}</h2>
          <p className="lede">{t('inbox.needFlat')}</p>
          <div className="place-actions">
            <Link className="btn slim primary" to="/address">
              {t('inbox.setupFlat')}
            </Link>
          </div>
        </section>
      ) : (
        <>
          <header className="board-toolbar" aria-label="Listing and actions">
            <div className="board-toolbar-flat">
              <span className="board-toolbar-mark" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path
                    d="M12 21s-7-5.2-7-10.2A7 7 0 0 1 12 3a7 7 0 0 1 7 7.8C19 15.8 12 21 12 21Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                  <circle cx="12" cy="10" r="2.2" fill="currentColor" />
                </svg>
              </span>
              <div className="board-toolbar-copy">
                <p className="kicker">{t('inbox.flat')}</p>
                <strong>{flat.address}</strong>
                <span>
                  €{flat.rentWarm} warm · {flat.rooms} rooms{flat.sqm ? ` · ${flat.sqm} m²` : ''} ·{' '}
                  {flat.district}
                </span>
              </div>
              <Link className="text-button" to="/address">
                {t('inbox.change')}
              </Link>
            </div>
            <div className="board-toolbar-actions">
              <input
                ref={csvInputRef}
                id={csvInputId}
                className="sr-only"
                type="file"
                accept=".csv,text/csv"
                onChange={(event) => {
                  onCsvFile(event.target.files?.[0] ?? null)
                  event.target.value = ''
                }}
              />
              <button
                type="button"
                className="btn box-btn primary"
                onClick={() => csvInputRef.current?.click()}
              >
                {t('inbox.uploadCsv')}
              </button>
              <Link className="btn box-btn primary" to="/import">
                {t('inbox.getApplicants')}
              </Link>
            </div>
          </header>
          {csvError ? (
            <p className="error" role="alert">
              {csvError}
            </p>
          ) : null}
          {csvMessage ? <p className="hint import-ok">{csvMessage}</p> : null}

          <div className="shortlist-grid">
            <CriteriaBoard />

            <section className="shortlist-panel" aria-label="Applicants">
              <div className="invite-side-head">
                <div className="invite-side-head-copy">
                  <h2>
                    {listGroup === 'like' ? t('inbox.list.liked') : t('inbox.list.all')}
                  </h2>
                  <span>
                    {listGroup === 'all'
                      ? applicants.length === 0
                        ? t('inbox.zero')
                        : t('inbox.showing', {
                            shown: rows.length,
                            total: applicants.length,
                            green: goodCount,
                          })
                      : t('inbox.inList', { count: rows.length })}
                  </span>
                </div>
                {applicants.length > 0 ? <NameVisibilityToggle /> : null}
              </div>

              {applicants.length > 0 ? (
                <div className="list-tabs" role="tablist" aria-label={t('inbox.list.all')}>
                  {(
                    [
                      ['all', t('inbox.tab.all', { count: ranked.length })],
                      ['like', t('inbox.tab.liked', { count: likedCount })],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      aria-selected={listGroup === id}
                      className={listGroup === id ? 'list-tab on' : 'list-tab'}
                      onClick={() => {
                        setListGroup(id)
                        setSelectedId(null)
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              ) : null}

              {applicants.length === 0 ? (
                <p className="empty">
                  {t('inbox.empty.none')}{' '}
                  <Link to="/import">{t('inbox.empty.import')}</Link> {t('inbox.empty.importHint')}
                </p>
              ) : requirements.selected.length === 0 ? (
                <p className="empty">{t('inbox.empty.criteria')}</p>
              ) : rows.length === 0 ? (
                <p className="empty">
                  {listGroup === 'like' ? t('inbox.empty.liked') : t('inbox.empty.none')}
                </p>
              ) : (
                <div className="invite-list shortlist-rows">
                  {rows.map((row) => (
                    <ApplicantRow
                      key={row.applicant.id}
                      applicant={row.applicant}
                      verdict={row.verdict}
                      open={selectedId === row.applicant.id}
                      listGroup={listGroup}
                      onToggle={() =>
                        setSelectedId((current) => (current === row.applicant.id ? null : row.applicant.id))
                      }
                      onRemoveFromBoard={() => {
                        removeApplicant(row.applicant.id)
                        if (selectedId === row.applicant.id) setSelectedId(null)
                      }}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>

          <InvitePanel
            flat={flat}
            ranked={ranked}
            landlordName={user?.name ?? 'Landlord'}
            group={listGroup}
          />
        </>
      )}
    </div>
  )
}

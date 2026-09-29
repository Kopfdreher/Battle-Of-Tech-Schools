'use client'

import { useEffect, useMemo, useState } from 'react'
import { Link } from '@/components/mietmatch/nav'
import { ApplicantRow, type ListGroup } from '../components/ApplicantRow'
import { CriteriaBoard } from '../components/CriteriaBoard'
import { InvitePanel } from '../components/InvitePanel'
import { useLocale } from '../context/LocaleContext'
import { useSession } from '../context/session'
import { compareApplicants, evaluateApplicant, matchTone } from '../lib/match'

type MatchFilter = 'all' | 'strong' | 'weak' | 'duplicates'

export function InboxPage() {
  const { user, requirements, flat, applicants, marks, removeApplicant, loadDemoBoard } = useSession()
  const { t } = useLocale()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [listGroup, setListGroup] = useState<ListGroup>('all')
  const [filter, setFilter] = useState<MatchFilter>('all')
  const [minPercent, setMinPercent] = useState(0)

  useEffect(() => {
	loadDemoBoard()
  }, [])

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
  const unsureCount = useMemo(
    () => ranked.filter((row) => marks[row.applicant.id] === 'unsure').length,
    [ranked, marks],
  )

  const groupRows = useMemo(() => {
    if (listGroup === 'like') return ranked.filter((row) => marks[row.applicant.id] === 'like')
    if (listGroup === 'unsure') return ranked.filter((row) => marks[row.applicant.id] === 'unsure')
    return ranked
  }, [ranked, marks, listGroup])

  const rows = useMemo(() => {
    const fingerprints = new Map<string, number>()
    for (const row of ranked) {
      fingerprints.set(row.applicant.fingerprint, (fingerprints.get(row.applicant.fingerprint) ?? 0) + 1)
    }

    return groupRows
      .map((row) => ({
        ...row,
        isDuplicate: (fingerprints.get(row.applicant.fingerprint) ?? 0) > 1,
      }))
      .filter((row) => {
        if (listGroup !== 'all') return true
        if (row.verdict.matchRate < minPercent) return false
        if (filter === 'strong') return matchTone(row.verdict) === 'good'
        if (filter === 'weak') return matchTone(row.verdict) === 'bad'
        if (filter === 'duplicates') return row.isDuplicate
        return true
      })
  }, [ranked, groupRows, filter, minPercent, listGroup])

  const goodCount = useMemo(
    () => ranked.filter((row) => matchTone(row.verdict) === 'good').length,
    [ranked],
  )

  return (
    <div className="dashboard">
      {!flat ? (
        <>
          <header className="dash-head dash-head-compact">
            <div className="place-actions dash-head-actions">
              <Link className="btn box-btn" to="/import">
                {t('inbox.getApplicants')}
              </Link>
              <button type="button" className="btn box-btn" onClick={loadDemoBoard}>
                {t('inbox.reloadDemo')}
              </button>
            </div>
          </header>
          <section className="panel address-box">
            <p className="kicker">{t('inbox.tryKicker')}</p>
            <h2>{t('inbox.tryTitle')}</h2>
            <p className="lede">{t('inbox.tryLede')}</p>
            <div className="place-actions">
              <button type="button" className="btn primary" onClick={loadDemoBoard}>
                {t('inbox.loadDemo')}
              </button>
              <Link className="btn" to="/address">
                {t('inbox.addFlat')}
              </Link>
            </div>
          </section>
        </>
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
                  €{flat.rentWarm} warm · {flat.rooms} rooms{flat.sqm ? ` · ${flat.sqm} m²` : ''} · {flat.district}
                </span>
              </div>
              <Link className="text-button" to="/address">
                {t('inbox.change')}
              </Link>
            </div>
            <div className="board-toolbar-actions">
              <Link className="btn box-btn" to="/import">
                {t('inbox.getApplicants')}
              </Link>
            </div>
          </header>

          <div className="shortlist-grid">
            <CriteriaBoard />

            <section className="shortlist-panel" aria-label="Applicants">
              <div className="invite-side-head">
                <h2>
                  {listGroup === 'like'
                    ? t('inbox.list.liked')
                    : listGroup === 'unsure'
                      ? t('inbox.list.unsure')
                      : t('inbox.list.all')}
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

              {applicants.length > 0 ? (
                <div className="list-tabs" role="tablist" aria-label={t('inbox.list.all')}>
                  {(
                    [
                      ['all', t('inbox.tab.all', { count: ranked.length })],
                      ['like', t('inbox.tab.liked', { count: likedCount })],
                      ['unsure', t('inbox.tab.unsure', { count: unsureCount })],
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

              {applicants.length > 0 && listGroup === 'all' ? (
                <div className="filter-bar shortlist-filters" aria-label={t('inbox.list.all')}>
                  <div className="filter-row">
                    {(
                      [
                        ['all', t('inbox.filter.all')],
                        ['strong', t('inbox.filter.strong')],
                        ['weak', t('inbox.filter.weak')],
                        ['duplicates', t('inbox.filter.duplicates')],
                      ] as const
                    ).map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        className={filter === id ? 'filter-chip on' : 'filter-chip'}
                        onClick={() => setFilter(id)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <label className="tuner">
                    <span>
                      {t('inbox.minMatch')}
                      <strong>{minPercent}%</strong>
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={minPercent}
                      onChange={(event) => setMinPercent(Number(event.target.value))}
                    />
                  </label>
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
                  {listGroup === 'like'
                    ? t('inbox.empty.liked')
                    : listGroup === 'unsure'
                      ? t('inbox.empty.unsure')
                      : t('inbox.empty.filter')}
                </p>
              ) : (
                <div className="invite-list shortlist-rows">
                  {rows.map((row) => (
                    <ApplicantRow
                      key={row.applicant.id}
                      number={row.number}
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

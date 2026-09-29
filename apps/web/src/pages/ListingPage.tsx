import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { useSession } from '../context/session.ts'
import { evaluateApplicant, matchTone } from '../lib/match.ts'

export function ListingPage() {
  const { id } = useParams({ from: '/_app/applicants/$id' })
  const navigate = useNavigate()
  const { flat, applicants, requirements, removeApplicant, marks, setApplicantMark } = useSession()
  const applicant = applicants.find((item) => item.id === id)

  if (!flat) {
    return (
      <div>
        <Link className="back" to="/">
          Back to shortlist
        </Link>
        <p className="empty">Add your flat first, then open an applicant.</p>
      </div>
    )
  }

  if (!applicant) {
    return (
      <div>
        <Link className="back" to="/">
          Back to shortlist
        </Link>
        <p className="empty">That applicant is not on the board.</p>
      </div>
    )
  }

  const verdict = evaluateApplicant(applicant, flat, requirements, applicants)
  const tone = matchTone(verdict)
  const mark = marks[applicant.id] ?? null
  const docs = [
    { label: 'No-arrears letter', ok: applicant.hasArrearsLetter },
    { label: 'Income proof', ok: applicant.hasIncomeProof },
    { label: 'Employment proof', ok: applicant.hasEmploymentProof },
    { label: 'SCHUFA', ok: applicant.hasSchufa },
  ]

  return (
    <article className="detail">
      <Link className="back" to="/">
        Back to shortlist
      </Link>
      <header className="page-head">
        <div>
          <p className="kicker">
            {tone === 'good' ? 'Strong match' : 'Weak match'} · {verdict.matchRate}%
          </p>
          <h1>{applicant.displayName}</h1>
          <p className="lede">
            €{applicant.netIncomeMonthly} net / month · {applicant.householdSize} in household ·{' '}
            {applicant.contractType} contract
          </p>
          <p className="hint">
            For flat {flat.address} (€{flat.rentWarm} warm · {flat.rooms} rooms). Free-text messages are not used in
            the score.
          </p>
        </div>
      </header>

      {verdict.flags.length > 0 ? (
        <section className="panel">
          <p className="kicker">Flags</p>
          <ul className="flag-list">
            {verdict.flags.map((flag) => (
              <li key={flag}>{flag}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="detail-grid">
        <section className="panel">
          <p className="kicker">Structured fields</p>
          <h2>What we score</h2>
          <dl className="mail-dl">
            <dt>Income</dt>
            <dd>€{applicant.netIncomeMonthly} net</dd>
            <dt>Household</dt>
            <dd>{applicant.householdSize}</dd>
            <dt>Contract</dt>
            <dd>{applicant.contractType}</dd>
            <dt>Employment</dt>
            <dd>{applicant.employmentType}</dd>
            <dt>Smokes</dt>
            <dd>{applicant.smokes ? 'Yes' : 'No'}</dd>
          </dl>
          <p className="invite-mail">{applicant.messagePreview}</p>
        </section>
        <section className="panel">
          <p className="kicker">Documents</p>
          <h2>Checklist</h2>
          <ul className="checklist">
            {docs.map((doc) => (
              <li key={doc.label} className={doc.ok ? 'ok' : 'bad'}>
                <span className="pill">{doc.ok ? 'Yes' : 'No'}</span>
                <div>
                  <strong>{doc.label}</strong>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="panel checklist-wrap">
        <h2>Against your requirements</h2>
        <ul className="checklist">
          {verdict.checks.map((check) => (
            <li key={check.id} className={check.ok ? 'ok' : 'bad'}>
              <span className="pill">{check.ok ? 'Fits' : 'Held'}</span>
              <div>
                <strong>{check.label}</strong>
                <p>{check.detail}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="place-actions mark-actions">
          <button
            type="button"
            className={mark === 'like' ? 'btn primary' : 'btn'}
            onClick={() => setApplicantMark(applicant.id, mark === 'like' ? null : 'like')}
          >
            {mark === 'like' ? 'Liked' : 'Mark as like'}
          </button>
          <button
            type="button"
            className={mark === 'unsure' ? 'btn primary' : 'btn'}
            onClick={() => setApplicantMark(applicant.id, mark === 'unsure' ? null : 'unsure')}
          >
            {mark === 'unsure' ? 'Not sure' : 'Mark as not sure'}
          </button>
          <button
            type="button"
            className="btn ghost"
            onClick={() => {
              removeApplicant(applicant.id)
              void navigate({ to: '/' })
            }}
          >
            Remove applicant
          </button>
        </div>
      </section>
    </article>
  )
}

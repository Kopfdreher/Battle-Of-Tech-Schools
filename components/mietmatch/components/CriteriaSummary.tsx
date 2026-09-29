'use client'

import { Link } from '@/components/mietmatch/nav'
import { selectedCriteriaLabels } from '../data/requirements'
import { useSession } from '../context/session'

export function CriteriaSummary() {
  const { requirements } = useSession()
  const selected = selectedCriteriaLabels(requirements)

  return (
    <section className="criteria-bar" aria-label="Required criteria">
      <div className="criteria-bar-head">
        <p className="kicker">Landlord criteria</p>
        <Link className="text-button" to="/requirements">
          Edit
        </Link>
      </div>
      {selected.length === 0 ? (
        <p className="hint">None selected yet.</p>
      ) : (
        <ul className="criteria-chips">
          {selected.map((item) => (
            <li key={item.id}>{item.label}</li>
          ))}
        </ul>
      )}
    </section>
  )
}

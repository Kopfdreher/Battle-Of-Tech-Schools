import { RequirementsEditor } from '../components/RequirementsEditor.tsx'

export function RequirementsPage() {
  return (
    <div className="requirements">
      <header className="page-head">
        <div>
          <p className="kicker">Berlin environment</p>
          <h1>Required criteria</h1>
          <p className="lede">
            Choose the surroundings that matter: noise, Kita and schools, commute, Spielplatz, nightlife, accessibility,
            parking, and supermarket.
          </p>
        </div>
      </header>
      <RequirementsEditor />
    </div>
  )
}

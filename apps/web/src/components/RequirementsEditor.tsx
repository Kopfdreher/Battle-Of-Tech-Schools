import { type CriterionId, type Requirements } from '../types.ts'
import {
  CRITERIA_SUGGESTIONS,
  PRESETS,
  defaultRequirements,
  sameRequirements,
  toggleCriterion,
} from '../data/requirements.ts'
import { useLocale } from '../context/LocaleContext.tsx'
import { useSession } from '../context/session.ts'

type SliderKey = 'minIncomeMultiple' | 'maxHouseholdOverRooms'

const tuners: {
  key: SliderKey
  criterion: CriterionId
  label: string
  min: number
  max: number
  step: number
  format: (value: number) => string
}[] = [
  {
    key: 'minIncomeMultiple',
    criterion: 'affordability',
    label: 'Min income ÷ warm rent',
    min: 1,
    max: 6,
    step: 0.1,
    format: (value) => `${value.toFixed(1)}×`,
  },
  {
    key: 'maxHouseholdOverRooms',
    criterion: 'household',
    label: 'Extra people over room count',
    min: 0,
    max: 3,
    step: 1,
    format: (value) => (value === 0 ? 'Exact fit' : `+${value}`),
  },
]

const toggles: {
  key: keyof Pick<
    Requirements,
    | 'requirePermanentContract'
    | 'requireArrearsLetter'
    | 'smokingHardNo'
    | 'requireIncomeProof'
    | 'requireEmploymentProof'
    | 'preferSchufa'
  >
  criterion: CriterionId
  label: string
}[] = [
  { key: 'requirePermanentContract', criterion: 'contract', label: 'Require permanent contract' },
  { key: 'requireArrearsLetter', criterion: 'arrearsLetter', label: 'Require no-arrears letter' },
  { key: 'smokingHardNo', criterion: 'smoking', label: 'Smoking is a hard no' },
  { key: 'requireIncomeProof', criterion: 'documents', label: 'Require income proof' },
  { key: 'requireEmploymentProof', criterion: 'documents', label: 'Require employment proof' },
  { key: 'preferSchufa', criterion: 'schufa', label: 'Prefer SCHUFA on file' },
]

export function RequirementsEditor() {
  const { requirements, updateRequirements, flat, applicants } = useSession()
  const { t } = useLocale()

  function patch(partial: Partial<Requirements>) {
    updateRequirements({ ...requirements, ...partial })
  }

  return (
    <div className="req-editor">
      <section className="panel">
        <p className="kicker">Presets</p>
        <div className="preset-row">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={
                sameRequirements(requirements, preset.requirements) ? 'btn primary' : 'btn'
              }
              onClick={() => updateRequirements(preset.requirements)}
            >
              {preset.label}
            </button>
          ))}
          <button type="button" className="btn ghost" onClick={() => updateRequirements(defaultRequirements)}>
            Reset
          </button>
        </div>
      </section>

      <section className="panel">
        <p className="kicker">Required criteria</p>
        <h2>What you weigh for this flat</h2>
        <p className="hint">
          Scoring uses structured fields only. Free-text messages are never part of the match — that keeps screening
          fairer under German anti-discrimination rules.
        </p>
        <ul className="criteria-pick">
          {CRITERIA_SUGGESTIONS.map((item) => {
            const on = requirements.selected.includes(item.id)
            return (
              <li key={item.id}>
                <button
                  type="button"
                  className={on ? 'choice on' : 'choice'}
                  onClick={() => updateRequirements(toggleCriterion(requirements, item.id))}
                >
                  <strong>{t(`criterion.${item.id}`)}</strong>
                  <span>{t(`criterion.short.${item.id}`)}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="panel">
        <p className="kicker">Limits</p>
        <h2>Tune the thresholds</h2>
        {flat ? (
          <p className="hint">
            Against {flat.address}: €{flat.rentWarm} warm · {flat.rooms} rooms · {applicants.length} applicants on
            the board.
          </p>
        ) : (
          <p className="hint">Add your flat first so affordability and household fit use the real rent and rooms.</p>
        )}
        <div className="tuner-list">
          {tuners.map((tuner) => {
            if (!requirements.selected.includes(tuner.criterion)) return null
            const value = requirements[tuner.key]
            return (
              <label key={tuner.key} className="tuner">
                <span>
                  {tuner.label}
                  <strong>{tuner.format(value)}</strong>
                </span>
                <input
                  type="range"
                  min={tuner.min}
                  max={tuner.max}
                  step={tuner.step}
                  value={value}
                  onChange={(event) => patch({ [tuner.key]: Number(event.target.value) })}
                />
              </label>
            )
          })}
          {toggles.map((toggle) => {
            if (!requirements.selected.includes(toggle.criterion)) return null
            return (
              <label key={toggle.key} className="check-row">
                <input
                  type="checkbox"
                  checked={requirements[toggle.key]}
                  onChange={(event) => patch({ [toggle.key]: event.target.checked })}
                />
                <span>{toggle.label}</span>
              </label>
            )
          })}
        </div>
      </section>
    </div>
  )
}

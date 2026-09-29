import { type CriterionId, type Requirements } from '../types.ts'
import {
  CRITERIA_SUGGESTIONS,
  PRESETS,
  defaultRequirements,
  sameRequirements,
  toggleCriterion,
} from '../data/requirements.ts'
import { LISTINGS } from '../data/listings.ts'
import { useSession } from '../context/session.ts'
import { evaluate } from '../lib/match.ts'

type SliderKey = Exclude<keyof Requirements, 'selected' | 'preferCalmNightlife'>

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
    key: 'maxNightNoise',
    criterion: 'noise',
    label: 'Max night noise',
    min: 40,
    max: 75,
    step: 1,
    format: (value) => `${value} dB`,
  },
  {
    key: 'maxEducationMeters',
    criterion: 'education',
    label: 'Max walk to Kita / school',
    min: 50,
    max: 1500,
    step: 10,
    format: (value) => `${value} m`,
  },
  {
    key: 'maxCommuteMinutes',
    criterion: 'commute',
    label: 'Max commute walk',
    min: 2,
    max: 25,
    step: 1,
    format: (value) => `${value} min`,
  },
  {
    key: 'maxPlaygroundMeters',
    criterion: 'playground',
    label: 'Max walk to Spielplatz',
    min: 50,
    max: 1000,
    step: 10,
    format: (value) => `${value} m`,
  },
  {
    key: 'maxNightlifeMeters',
    criterion: 'nightlife',
    label: 'Max walk to café / bar',
    min: 50,
    max: 800,
    step: 10,
    format: (value) => `${value} m`,
  },
  {
    key: 'minAccessibilityScore',
    criterion: 'accessibility',
    label: 'Min accessibility score',
    min: 0,
    max: 100,
    step: 1,
    format: (value) => `${value}`,
  },
  {
    key: 'maxParkingMeters',
    criterion: 'parking',
    label: 'Max walk to parking',
    min: 50,
    max: 1000,
    step: 10,
    format: (value) => `${value} m`,
  },
  {
    key: 'maxSupermarketMeters',
    criterion: 'supermarket',
    label: 'Max walk to supermarket',
    min: 50,
    max: 1000,
    step: 10,
    format: (value) => `${value} m`,
  },
]

export function RequirementsEditor() {
  const { requirements, updateRequirements } = useSession()
  const matched = LISTINGS.filter((listing) => evaluate(listing, requirements).passes).length
  const active = PRESETS.find((preset) => sameRequirements(preset.requirements, requirements))
  const selected = new Set(requirements.selected)
  const activeTuners = tuners.filter((tuner) => selected.has(tuner.criterion))

  function patch(next: Partial<Requirements>) {
    updateRequirements({ ...requirements, ...next })
  }

  return (
    <section className="req-simple" aria-label="Required criteria">
      <div className="req-top">
        <div>
          <p className="req-count">
            <strong>{matched}</strong>
            <span>of {LISTINGS.length} places</span>
          </p>
          <p className="hint">Pick what matters around the flat. Limits appear only for what you select.</p>
        </div>
        <div className="req-packs" role="group" aria-label="Suggestion packs">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={active?.id === preset.id ? 'pack on' : 'pack'}
              aria-pressed={active?.id === preset.id}
              onClick={() => updateRequirements(preset.requirements)}
            >
              {preset.label}
            </button>
          ))}
          <button type="button" className="pack" onClick={() => updateRequirements(defaultRequirements)}>
            Reset
          </button>
        </div>
      </div>

      <div className="req-pills" role="group" aria-label="Criteria">
        {CRITERIA_SUGGESTIONS.map((item) => {
          const on = selected.has(item.id)
          return (
            <button
              key={item.id}
              type="button"
              className={on ? 'req-pill on' : 'req-pill'}
              aria-pressed={on}
              onClick={() => updateRequirements(toggleCriterion(requirements, item.id))}
            >
              <span className="req-pill-label">{item.label}</span>
              <span className="req-pill-short">{item.short}</span>
            </button>
          )
        })}
      </div>

      {activeTuners.length > 0 ? (
        <div className="req-tune">
          {activeTuners.map((tuner) => (
            <label className="req-slider" key={tuner.key}>
              <span className="req-slider-top">
                <span>{tuner.label}</span>
                <strong>{tuner.format(requirements[tuner.key] as number)}</strong>
              </span>
              <input
                type="range"
                min={tuner.min}
                max={tuner.max}
                step={tuner.step}
                value={requirements[tuner.key] as number}
                aria-label={tuner.label}
                onChange={(event) => patch({ [tuner.key]: Number(event.target.value) })}
              />
            </label>
          ))}
          {selected.has('nightlife') ? (
            <label className="req-check">
              <input
                type="checkbox"
                checked={requirements.preferCalmNightlife}
                onChange={(event) => patch({ preferCalmNightlife: event.target.checked })}
              />
              <span>Prefer calmer nightlife streets</span>
            </label>
          ) : null}
        </div>
      ) : (
        <p className="empty soft">Select at least one criterion above.</p>
      )}
    </section>
  )
}

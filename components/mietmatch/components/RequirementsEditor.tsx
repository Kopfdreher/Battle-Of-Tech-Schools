'use client'

import { Link } from '@/components/mietmatch/nav'
import { PRESETS, defaultRequirements, sameRequirements } from '../data/requirements'
import { useLocale } from '../context/LocaleContext'
import { useSession } from '../context/session'
import type { CriterionId, Requirements } from '../types'

const FIXED: CriterionId[] = ['employed', 'compactHousehold', 'fullEvidence']

export function RequirementsEditor() {
  const { requirements, updateRequirements, flat } = useSession()
  const { t } = useLocale()
  const selected = requirements.selected
  const fixed = selected.filter((id) => FIXED.includes(id))

  function patch(partial: Partial<Requirements>) {
    updateRequirements({ ...requirements, ...partial })
  }

  const incomeNeed = flat ? Math.round(flat.rentWarm * requirements.minIncomeMultiple) : null
  const householdCap = flat ? Math.floor(flat.rooms + requirements.maxHouseholdOverRooms) : null

  return (
    <div className="req-editor">
      <section className="panel req-limits">
        <div className="req-limits-head">
          <div>
            <p className="kicker">{t('requirements.onShortlist')}</p>
            <h2>{t('requirements.limitsTitle')}</h2>
          </div>
          <Link className="text-button" to="/">
            {t('requirements.editList')}
          </Link>
        </div>

        {selected.length === 0 ? (
          <p className="hint">{t('requirements.empty')}</p>
        ) : (
          <ol className="req-active">
            {selected.map((id, index) => (
              <li key={id}>
                <span className="criteria-rank">{index + 1}</span>
                {t(`criterion.${id}`)}
              </li>
            ))}
          </ol>
        )}

        <div className="req-presets">
          <p className="kicker">{t('requirements.presets')}</p>
          <div className="filter-row">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={
                  sameRequirements(requirements, preset.requirements) ? 'filter-chip on' : 'filter-chip'
                }
                onClick={() => updateRequirements(preset.requirements)}
              >
                {t(`requirements.preset.${preset.id}`)}
              </button>
            ))}
            <button
              type="button"
              className="filter-chip"
              onClick={() => updateRequirements(defaultRequirements)}
            >
              {t('requirements.reset')}
            </button>
          </div>
          <p className="hint">{t('requirements.presetHint')}</p>
        </div>

        <div className="req-rule-list">
          {selected.map((id, index) => {
            const rank = index + 1
            if (id === 'affordability') {
              return (
                <article className="req-rule" key={id}>
                  <div className="req-rule-top">
                    <strong>
                      <span className="criteria-rank">{rank}</span>
                      {t('criterion.affordability')}
                    </strong>
                    <span>{requirements.minIncomeMultiple.toFixed(1)}×</span>
                  </div>
                  <label className="tuner">
                    <span>{t('requirements.income')}</span>
                    <input
                      type="range"
                      min={1}
                      max={6}
                      step={0.1}
                      value={requirements.minIncomeMultiple}
                      onChange={(event) => patch({ minIncomeMultiple: Number(event.target.value) })}
                    />
                  </label>
                  <p className="hint">
                    {flat && incomeNeed !== null
                      ? t('requirements.incomeNeed', { rent: flat.rentWarm, need: incomeNeed })
                      : t('requirements.noFlat')}
                  </p>
                </article>
              )
            }
            if (id === 'household') {
              return (
                <article className="req-rule" key={id}>
                  <div className="req-rule-top">
                    <strong>
                      <span className="criteria-rank">{rank}</span>
                      {t('criterion.household')}
                    </strong>
                    <span>
                      {requirements.maxHouseholdOverRooms === 0
                        ? t('requirements.exact')
                        : `+${requirements.maxHouseholdOverRooms}`}
                    </span>
                  </div>
                  <label className="tuner">
                    <span>{t('requirements.household')}</span>
                    <input
                      type="range"
                      min={0}
                      max={3}
                      step={1}
                      value={requirements.maxHouseholdOverRooms}
                      onChange={(event) => patch({ maxHouseholdOverRooms: Number(event.target.value) })}
                    />
                  </label>
                  <p className="hint">
                    {flat && householdCap !== null
                      ? t('requirements.householdHint', { rooms: flat.rooms, people: householdCap })
                      : t('requirements.noFlat')}
                  </p>
                </article>
              )
            }
            if (id === 'contract') {
              return (
                <ToggleRule
                  key={id}
                  rank={rank}
                  title={t('criterion.contract')}
                  label={t('requirements.toggle.contract')}
                  checked={requirements.requirePermanentContract}
                  onChange={(checked) => patch({ requirePermanentContract: checked })}
                />
              )
            }
            if (id === 'arrearsLetter') {
              return (
                <ToggleRule
                  key={id}
                  rank={rank}
                  title={t('criterion.arrearsLetter')}
                  label={t('requirements.toggle.arrears')}
                  checked={requirements.requireArrearsLetter}
                  onChange={(checked) => patch({ requireArrearsLetter: checked })}
                />
              )
            }
            if (id === 'smoking') {
              return (
                <ToggleRule
                  key={id}
                  rank={rank}
                  title={t('criterion.smoking')}
                  label={t('requirements.toggle.smoking')}
                  checked={requirements.smokingHardNo}
                  onChange={(checked) => patch({ smokingHardNo: checked })}
                />
              )
            }
            if (id === 'documents') {
              return (
                <article className="req-rule" key={id}>
                  <div className="req-rule-top">
                    <strong>
                      <span className="criteria-rank">{rank}</span>
                      {t('criterion.documents')}
                    </strong>
                  </div>
                  <label className="check-row">
                    <input
                      type="checkbox"
                      checked={requirements.requireIncomeProof}
                      onChange={(event) => patch({ requireIncomeProof: event.target.checked })}
                    />
                    <span>{t('requirements.toggle.incomeProof')}</span>
                  </label>
                  <label className="check-row">
                    <input
                      type="checkbox"
                      checked={requirements.requireEmploymentProof}
                      onChange={(event) => patch({ requireEmploymentProof: event.target.checked })}
                    />
                    <span>{t('requirements.toggle.employmentProof')}</span>
                  </label>
                </article>
              )
            }
            if (id === 'schufa') {
              return (
                <ToggleRule
                  key={id}
                  rank={rank}
                  title={t('criterion.schufa')}
                  label={t('requirements.toggle.schufa')}
                  checked={requirements.preferSchufa}
                  onChange={(checked) => patch({ preferSchufa: checked })}
                />
              )
            }
            return null
          })}
        </div>

        {fixed.length > 0 ? (
          <p className="hint">
            {t('requirements.fixed', {
              names: fixed.map((id) => t(`criterion.${id}`)).join(', '),
            })}
          </p>
        ) : null}
      </section>
    </div>
  )
}

function ToggleRule({
  rank,
  title,
  label,
  checked,
  onChange,
}: {
  rank: number
  title: string
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <article className="req-rule">
      <div className="req-rule-top">
        <strong>
          <span className="criteria-rank">{rank}</span>
          {title}
        </strong>
      </div>
      <label className="check-row">
        <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
        <span>{label}</span>
      </label>
    </article>
  )
}

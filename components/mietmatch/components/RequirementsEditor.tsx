'use client'

import { useRef, useState, type DragEvent } from 'react'
import {
  CRITERIA_SUGGESTIONS,
  reorderCriteria,
  toggleCriterion,
} from '../data/requirements'
import { useLocale } from '../context/LocaleContext'
import { useSession } from '../context/session'
import type { CriterionId, Requirements } from '../types'

/** Criteria with no extra limit controls. */
const NO_LIMIT_UI: CriterionId[] = ['employed', 'compactHousehold', 'fullEvidence', 'documents']

/** Stable pair order so limit cards and switch cards sit side by side. */
const TUNE_ORDER: CriterionId[] = [
  'affordability',
  'household',
  'contract',
  'arrearsLetter',
  'smoking',
  'schufa',
]

function orderedTunable(selected: CriterionId[]) {
  const tunable = selected.filter((id) => !NO_LIMIT_UI.includes(id))
  const ranked = TUNE_ORDER.filter((id) => tunable.includes(id))
  const rest = tunable.filter((id) => !TUNE_ORDER.includes(id))
  return [...ranked, ...rest]
}

function DragHandle() {
  return (
    <span className="drag-handle" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  )
}

export function RequirementsEditor() {
  const { requirements, updateRequirements, flat } = useSession()
  const { t } = useLocale()
  const selected = requirements.selected
  const available = CRITERIA_SUGGESTIONS.filter((item) => !selected.includes(item.id))
  const tunable = orderedTunable(selected)
  const [draggingId, setDraggingId] = useState<CriterionId | null>(null)
  const [overId, setOverId] = useState<CriterionId | null>(null)
  const dragFrom = useRef<number | null>(null)

  function patch(partial: Partial<Requirements>) {
    updateRequirements({ ...requirements, ...partial })
  }

  function labelFor(id: CriterionId) {
    return t(`criterion.${id}`)
  }

  function onDragStart(event: DragEvent, id: CriterionId, index: number) {
    dragFrom.current = index
    setDraggingId(id)
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', id)
  }

  function onDragOver(event: DragEvent, id: CriterionId) {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    if (overId !== id) setOverId(id)
  }

  function onDrop(event: DragEvent, toId: CriterionId) {
    event.preventDefault()
    const fromIndex = dragFrom.current
    const toIndex = selected.indexOf(toId)
    if (fromIndex !== null && toIndex >= 0) {
      updateRequirements(reorderCriteria(requirements, fromIndex, toIndex))
    }
    dragFrom.current = null
    setDraggingId(null)
    setOverId(null)
  }

  function onDragEnd() {
    dragFrom.current = null
    setDraggingId(null)
    setOverId(null)
  }

  const incomeNeed = flat ? Math.round(flat.rentWarm * requirements.minIncomeMultiple) : null
  const householdCap = flat ? Math.floor(flat.rooms + requirements.maxHouseholdOverRooms) : null

  return (
    <div className="req-editor">
      <div className="req-manage">
        <section className="req-manage-panel" aria-label={t('requirements.yourList')}>
          <div className="req-manage-head">
            <div>
              <p className="kicker">{t('requirements.yourList')}</p>
              <h2>{t('requirements.selectedCount', { count: selected.length })}</h2>
            </div>
            {flat ? (
              <p className="req-flat-chip">
                {flat.address} · €{flat.rentWarm}
              </p>
            ) : null}
          </div>

          {selected.length === 0 ? (
            <p className="hint">{t('requirements.empty')}</p>
          ) : (
            <ol className="req-pick-list">
              {selected.map((id, index) => {
                const label = labelFor(id)
                return (
                  <li
                    key={id}
                    className={[
                      'req-pick-item',
                      draggingId === id ? 'dragging' : '',
                      overId === id && draggingId !== id ? 'drag-over' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onDragOver={(event) => onDragOver(event, id)}
                    onDrop={(event) => onDrop(event, id)}
                  >
                    <button
                      type="button"
                      className="drag-grip"
                      draggable
                      onDragStart={(event) => onDragStart(event, id, index)}
                      onDragEnd={onDragEnd}
                      aria-label={t('criteria.drag', { label })}
                    >
                      <DragHandle />
                    </button>
                    <div className="req-pick-copy">
                      <strong>{label}</strong>
                      <span>{t(`criterion.short.${id}`)}</span>
                    </div>
                    <button
                      type="button"
                      className="btn slim ghost"
                      onClick={() => updateRequirements(toggleCriterion(requirements, id))}
                      aria-label={t('criteria.remove', { label })}
                    >
                      {t('requirements.remove')}
                    </button>
                  </li>
                )
              })}
            </ol>
          )}
        </section>

        <section className="req-manage-panel" aria-label={t('requirements.addMore')}>
          <div className="req-manage-head">
            <div>
              <p className="kicker">{t('requirements.addMore')}</p>
              <h2>{t('requirements.availableCount', { count: available.length })}</h2>
            </div>
          </div>

          {available.length === 0 ? (
            <p className="hint">{t('criteria.allAdded')}</p>
          ) : (
            <ul className="req-available-list">
              {available.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className="req-available-card"
                    onClick={() => updateRequirements(toggleCriterion(requirements, item.id))}
                  >
                    <strong>
                      <span className="plus-mini" aria-hidden="true">
                        +
                      </span>
                      {labelFor(item.id)}
                    </strong>
                    <span>{t(`criterion.short.${item.id}`)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {tunable.length > 0 ? (
        <section className="req-tune" aria-label={t('requirements.tuneTitle')}>
          <div className="req-tune-head">
            <p className="kicker">{t('requirements.tuneTitle')}</p>
            <h2>{t('requirements.tuneLede')}</h2>
          </div>
          <div className="req-rule-grid">
            {tunable.map((id) => {
              if (id === 'affordability') {
                return (
                  <article className="req-card" key={id}>
                    <div className="req-card-top">
                      <div className="req-card-copy">
                        <p className="kicker">{t('criterion.affordability')}</p>
                        <h3>{t('requirements.income')}</h3>
                      </div>
                      <span className="req-value">{requirements.minIncomeMultiple.toFixed(1)}×</span>
                    </div>
                    <label className="tuner">
                      <span className="sr-only">{t('requirements.income')}</span>
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
                  <article className="req-card" key={id}>
                    <div className="req-card-top">
                      <div className="req-card-copy">
                        <p className="kicker">{t('criterion.household')}</p>
                        <h3>{t('requirements.household')}</h3>
                      </div>
                      <span className="req-value">
                        {requirements.maxHouseholdOverRooms === 0
                          ? t('requirements.exact')
                          : `+${requirements.maxHouseholdOverRooms}`}
                      </span>
                    </div>
                    <label className="tuner">
                      <span className="sr-only">{t('requirements.household')}</span>
                      <input
                        type="range"
                        min={0}
                        max={3}
                        step={1}
                        value={requirements.maxHouseholdOverRooms}
                        onChange={(event) =>
                          patch({ maxHouseholdOverRooms: Number(event.target.value) })
                        }
                      />
                    </label>
                    <p className="hint">
                      {flat && householdCap !== null
                        ? t('requirements.householdHint', {
                            rooms: flat.rooms,
                            people: householdCap,
                          })
                        : t('requirements.noFlat')}
                    </p>
                  </article>
                )
              }
              if (id === 'contract') {
                return (
                  <SwitchCard
                    key={id}
                    title={t('criterion.contract')}
                    label={t('requirements.toggle.contract')}
                    checked={requirements.requirePermanentContract}
                    onChange={(checked) => patch({ requirePermanentContract: checked })}
                  />
                )
              }
              if (id === 'arrearsLetter') {
                return (
                  <SwitchCard
                    key={id}
                    title={t('criterion.arrearsLetter')}
                    label={t('requirements.toggle.arrears')}
                    checked={requirements.requireArrearsLetter}
                    onChange={(checked) => patch({ requireArrearsLetter: checked })}
                  />
                )
              }
              if (id === 'smoking') {
                return (
                  <SwitchCard
                    key={id}
                    title={t('criterion.smoking')}
                    label={t('requirements.toggle.smoking')}
                    checked={requirements.smokingHardNo}
                    onChange={(checked) => patch({ smokingHardNo: checked })}
                  />
                )
              }
              if (id === 'schufa') {
                return (
                  <SwitchCard
                    key={id}
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
        </section>
      ) : null}
    </div>
  )
}

function SwitchCard({
  title,
  label,
  checked,
  onChange,
}: {
  title: string
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <article className={checked ? 'req-card switch on' : 'req-card switch'}>
      <div className="req-card-top">
        <div className="req-card-copy">
          <p className="kicker">{title}</p>
          <h3>{label}</h3>
        </div>
        <button
          type="button"
          className={checked ? 'req-switch on' : 'req-switch'}
          role="switch"
          aria-checked={checked}
          aria-label={label}
          onClick={() => onChange(!checked)}
        >
          <span className="req-switch-knob" />
        </button>
      </div>
      <div className="req-card-spacer" aria-hidden="true" />
      <p className="hint req-card-hint-space" aria-hidden="true">
        &nbsp;
      </p>
    </article>
  )
}

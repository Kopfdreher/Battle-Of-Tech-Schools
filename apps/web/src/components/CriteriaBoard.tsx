import { useRef, useState, type DragEvent } from 'react'
import { Link } from '@tanstack/react-router'
import {
  CRITERIA_SUGGESTIONS,
  reorderCriteria,
  toggleCriterion,
} from '../data/requirements.ts'
import { useLocale } from '../context/LocaleContext.tsx'
import { useSession } from '../context/session.ts'
import type { CriterionId } from '../types.ts'

function DragHandle() {
  return (
    <span className="drag-handle" aria-hidden="true" title="Drag to reorder">
      <span />
      <span />
      <span />
    </span>
  )
}

function PlusIcon() {
  return (
    <svg className="plus-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        d="M12 5v14M5 12h14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function CriteriaBoard() {
  const { requirements, updateRequirements } = useSession()
  const { t } = useLocale()
  const [draggingId, setDraggingId] = useState<CriterionId | null>(null)
  const [overId, setOverId] = useState<CriterionId | null>(null)
  const [suggestOpen, setSuggestOpen] = useState(false)
  const dragFrom = useRef<number | null>(null)

  const selected = requirements.selected
  const available = CRITERIA_SUGGESTIONS.filter((item) => !selected.includes(item.id))
  const suggestions = available.slice(0, 4)

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

  function addCriterion(id: CriterionId) {
    updateRequirements(toggleCriterion(requirements, id))
    const remaining = available.filter((item) => item.id !== id).length
    if (remaining === 0) setSuggestOpen(false)
  }

  return (
    <aside className="criteria-board panel" aria-label={t('criteria.kicker')}>
      <div className="criteria-board-head">
        <div>
          <p className="kicker">{t('criteria.kicker')}</p>
          <h2>{t('criteria.title')}</h2>
        </div>
        <Link className="text-button" to="/requirements">
          {t('criteria.tune')}
        </Link>
      </div>

      {selected.length === 0 ? (
        <p className="empty">{t('criteria.empty')}</p>
      ) : (
        <ol className="criteria-drag-list">
          {selected.map((id, index) => {
            const label = labelFor(id)
            return (
              <li
                key={id}
                className={[
                  'criteria-drag-item',
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
                <div className="criteria-drag-copy">
                  <strong>
                    <span className="criteria-rank">{index + 1}</span>
                    {label}
                  </strong>
                </div>
                <button
                  type="button"
                  className="criteria-x"
                  onClick={() => updateRequirements(toggleCriterion(requirements, id))}
                  aria-label={t('criteria.remove', { label })}
                  title={t('criteria.remove', { label })}
                >
                  <span aria-hidden="true">×</span>
                </button>
              </li>
            )
          })}
        </ol>
      )}

      <div className="criteria-add">
        <div className="criteria-add-row">
          <p className="kicker">{t('criteria.add')}</p>
          {available.length > 0 ? (
            <button
              type="button"
              className={suggestOpen ? 'plus-btn open' : 'plus-btn'}
              aria-expanded={suggestOpen}
              aria-controls="criteria-suggestions"
              onClick={() => setSuggestOpen((open) => !open)}
              title={suggestOpen ? t('criteria.suggestHide') : t('criteria.suggestShow')}
            >
              <PlusIcon />
              <span className="sr-only">
                {suggestOpen ? t('criteria.suggestHide') : t('criteria.suggestShow')}
              </span>
            </button>
          ) : (
            <p className="hint">{t('criteria.allAdded')}</p>
          )}
        </div>

        {suggestOpen && suggestions.length > 0 ? (
          <div id="criteria-suggestions" className="criteria-suggest" role="region" aria-label={t('criteria.suggest')}>
            <p className="hint">{t('criteria.suggest')}</p>
            <ul className="criteria-suggest-list">
              {suggestions.map((item) => (
                <li key={item.id}>
                  <button type="button" className="criteria-suggest-card" onClick={() => addCriterion(item.id)}>
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
            {available.length > suggestions.length ? (
              <p className="hint">{t('criteria.more', { count: available.length - suggestions.length })}</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </aside>
  )
}

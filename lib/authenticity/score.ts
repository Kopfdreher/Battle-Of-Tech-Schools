/**
 * Match % is criteria-only. Document authenticity is shown separately (verify badge).
 */
export function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, value))
}

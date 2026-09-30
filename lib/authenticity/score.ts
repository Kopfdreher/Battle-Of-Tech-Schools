/**
 * Blend criteria match with document authenticity into one display percentage.
 * Match remains the primary signal; trust can raise or lower the shown score.
 */
export function combinedMatchPercent(matchRate: number, trustIndex: number) {
  const match = clamp(matchRate)
  const trust = clamp(trustIndex)
  return Math.round(match * 0.7 + trust * 0.3)
}

function clamp(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, value))
}

/**
 * @typedef {import('../types.js').SkillStatus} SkillStatus
 */

/**
 * Computes how many skill points a node consumes.
 *
 * Rules:
 * - Only `unlocked` and `completed` skills count as spent.
 * - `cost` defaults to `0` when missing/invalid.
 * - `level` defaults to `1` when missing/invalid.
 *
 * @param {{ status?: SkillStatus, cost?: number, level?: number } | undefined} data
 * @returns {number}
 */
export function getSkillPointsForNodeData(data) {
  const status = data?.status
  if (status !== 'unlocked' && status !== 'completed') return 0

  return getSkillPointsRequiredForNodeData(data)
}

/**
 * Computes how many skill points are required to unlock a node.
 *
 * Rules:
 * - `cost` defaults to `0` when missing/invalid.
 * - `level` defaults to `1` when missing/invalid.
 *
 * @param {{ cost?: number, level?: number } | undefined} data
 * @returns {number}
 */
export function getSkillPointsRequiredForNodeData(data) {
  const cost = typeof data?.cost === 'number' && Number.isFinite(data.cost) ? data.cost : 0
  const level = typeof data?.level === 'number' && Number.isFinite(data.level) ? data.level : 1

  const normalizedCost = cost >= 0 ? cost : 0
  const normalizedLevel = level > 0 ? level : 1

  return normalizedCost * normalizedLevel
}

/**
 * @param {{ data?: { status?: SkillStatus, cost?: number, level?: number } }[]} nodes
 * @returns {number}
 */
export function getSkillPointsSpent(nodes) {
  let total = 0
  for (const node of nodes) {
    total += getSkillPointsForNodeData(node?.data)
  }
  return total
}

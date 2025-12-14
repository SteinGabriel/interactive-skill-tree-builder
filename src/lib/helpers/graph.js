/**
 * @typedef {import('../types.js').SkillStatus} SkillStatus
 */

/**
 * Returns the unique prerequisite node ids for `nodeId` (based on inbound edges).
 * Assumes edge direction is `prerequisite (source) -> dependent (target)`.
 * @param {{ source: string, target: string }[]} edges
 * @param {string} nodeId
 * @returns {string[]}
 */
export function getInboundPrereqIds(edges, nodeId) {
  /** @type {string[]} */
  const prereqIds = []
  /** @type {Set<string>} */
  const seen = new Set()

  for (const edge of edges) {
    if (edge.target !== nodeId) continue
    if (seen.has(edge.source)) continue
    seen.add(edge.source)
    prereqIds.push(edge.source)
  }

  return prereqIds
}

/**
 * @param {{ id: string, data: { status: SkillStatus } }[]} nodes
 * @returns {Map<string, { id: string, data: { status: SkillStatus } }>}
 */
export function indexNodesById(nodes) {
  /** @type {Map<string, { id: string, data: { status: SkillStatus } }>} */
  const nodesById = new Map()
  for (const node of nodes) nodesById.set(node.id, node)
  return nodesById
}

/**
 * A node is unlockable if all of its prerequisites are `completed`.
 * Nodes with zero prerequisites are unlockable.
 * Missing prerequisite nodes are treated as not unlockable.
 * @param {{ nodesById: Map<string, { id: string, data: { status: SkillStatus } }>, edges: { source: string, target: string }[], nodeId: string }} args
 * @returns {boolean}
 */
export function isNodeUnlockable({ nodesById, edges, nodeId }) {
  const prereqIds = getInboundPrereqIds(edges, nodeId)
  if (prereqIds.length === 0) return true

  for (const prereqId of prereqIds) {
    const prereqNode = nodesById.get(prereqId)
    if (!prereqNode) return false
    if (prereqNode.data.status !== 'completed') return false
  }

  return true
}

/**
 * Derives `unlockable` status based on prerequisites.
 *
 * Rules:
 * - Converts `locked -> unlockable` when unlockable.
 * - Converts `unlockable -> locked` when no longer unlockable.
 * - Never modifies `unlocked` or `completed`.
 *
 * @param {{ id: string, data: { status: SkillStatus } }[]} nodes
 * @param {{ source: string, target: string }[]} edges
 * @returns {{ id: string, data: { status: SkillStatus } }[]}
 */
export function deriveNodeStatuses(nodes, edges) {
  const nodesById = indexNodesById(nodes)

  return nodes.map((node) => {
    if (node.data.status === 'unlocked' || node.data.status === 'completed') {
      return node
    }

    const unlockable = isNodeUnlockable({ nodesById, edges, nodeId: node.id })
    const nextStatus = unlockable ? 'unlockable' : 'locked'
    if (node.data.status === nextStatus) return node

    return {
      ...node,
      data: {
        ...node.data,
        status: nextStatus,
      },
    }
  })
}

/**
 * @typedef {'self_loop' | 'duplicate'} EdgeInvalidReason
 */

/**
 * Validates edge creation:
 * - no self loops
 * - no duplicate edges (same source + target)
 *
 * Cycle detection intentionally omitted for now.
 *
 * @param {{ source: string, target: string, edges: { source: string, target: string }[] }} args
 * @returns {{ ok: true } | { ok: false, reason: EdgeInvalidReason }}
 */
export function validateEdgeCreation({ source, target, edges }) {
  if (source === target) return { ok: false, reason: 'self_loop' }

  const isDuplicate = edges.some((edge) => edge.source === source && edge.target === target)
  if (isDuplicate) return { ok: false, reason: 'duplicate' }

  return { ok: true }
}

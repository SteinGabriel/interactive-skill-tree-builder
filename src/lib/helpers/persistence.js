/**
 * @typedef {import('../types.js').PersistedTreeState} PersistedTreeState
 * @typedef {import('../types.js').PersistedNode} PersistedNode
 * @typedef {import('../types.js').PersistedEdge} PersistedEdge
 */

export const SKILL_TREE_STORAGE_KEY = 'skill-tree-builder'

/**
 * @returns {PersistedTreeState}
 */
export function createEmptyPersistedTreeState() {
  return {
    nodes: [],
    edges: [],
  }
}

/**
 * @param {unknown} status
 * @returns {'locked' | 'unlocked' | 'completed'}
 */
function coercePersistedStatus(status) {
  if (status === 'unlocked' || status === 'completed') return status
  return 'locked'
}

/**
 * @param {unknown} node
 * @returns {PersistedNode | null}
 */
function coerceNode(node) {
  if (!node || typeof node !== 'object') return null

  const { id, position, data } = node
  if (typeof id !== 'string' || id.trim() === '') return null

  const { x, y } =
    position && typeof position === 'object' ? position : { x: undefined, y: undefined }
  const safeX = Number.isFinite(x) ? x : 0
  const safeY = Number.isFinite(y) ? y : 0

  if (!data || typeof data !== 'object') return null

  const { title, description, cost, level, status } = data
  if (typeof title !== 'string' || title.trim() === '') return null

  const safeDescription = typeof description === 'string' ? description : undefined
  const safeCost = Number.isFinite(cost) ? cost : undefined
  const safeLevel = Number.isFinite(level) ? level : undefined
  const safeStatus = coercePersistedStatus(status)

  return {
    id,
    position: { x: safeX, y: safeY },
    data: {
      title,
      description: safeDescription,
      cost: safeCost,
      level: safeLevel,
      status: safeStatus,
    },
  }
}

/**
 * @param {unknown} value
 * @returns {PersistedEdge | null}
 */
function coerceEdge(value) {
  if (!value || typeof value !== 'object') return null

  // @ts-ignore - JS project; runtime validation only.
  const source = value.source
  // @ts-ignore - JS project; runtime validation only.
  const target = value.target
  if (typeof source !== 'string' || typeof target !== 'string') return null
  if (source.trim() === '' || target.trim() === '') return null

  // @ts-ignore - JS project; runtime validation only.
  const id =
    typeof value.id === 'string' && value.id.trim() !== '' ? value.id : `${source}->${target}`

  return { id, source, target }
}

/**
 * @param {unknown} value
 * @returns {PersistedTreeState}
 */
function coerceTreeState(value) {
  if (!value || typeof value !== 'object') {
    throw new Error('Invalid persisted state shape')
  }

  // @ts-ignore - JS project; runtime validation only.
  const rawNodes = Array.isArray(value.nodes) ? value.nodes : []
  // @ts-ignore - JS project; runtime validation only.
  const rawEdges = Array.isArray(value.edges) ? value.edges : []

  const nodes = []
  for (const rawNode of rawNodes) {
    const node = coerceNode(rawNode)
    if (node) nodes.push(node)
  }

  const edges = []
  for (const rawEdge of rawEdges) {
    const edge = coerceEdge(rawEdge)
    if (edge) edges.push(edge)
  }

  return { nodes, edges }
}

/**
 * @param {PersistedTreeState | { nodes: PersistedNode[], edges: PersistedEdge[] }} state
 * @returns {string}
 */
export function serialize(state) {
  const nodes = Array.isArray(state.nodes) ? state.nodes : []
  const edges = Array.isArray(state.edges) ? state.edges : []

  const persisted = {
    nodes: nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        status: coercePersistedStatus(node.data.status),
      },
    })),
    edges: edges.map((edge) => ({
      id:
        typeof edge.id === 'string' && edge.id.trim() !== ''
          ? edge.id
          : `${edge.source}->${edge.target}`,
      source: edge.source,
      target: edge.target,
    })),
  }

  return JSON.stringify(persisted)
}

/**
 * @param {string} serialized
 * @returns {PersistedTreeState}
 */
export function deserialize(serialized) {
  if (typeof serialized !== 'string') {
    throw new Error('Serialized state must be a string')
  }

  /** @type {unknown} */
  let parsed
  try {
    parsed = JSON.parse(serialized)
  } catch (_error) {
    throw new Error('Invalid JSON')
  }

  return coerceTreeState(parsed)
}

/**
 * @param {string} [key]
 * @returns {PersistedTreeState}
 */
export function loadFromLocalStorage(key = SKILL_TREE_STORAGE_KEY) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return createEmptyPersistedTreeState()
    }

    const stored = window.localStorage.getItem(key)
    if (!stored) return createEmptyPersistedTreeState()

    return deserialize(stored)
  } catch (_error) {
    return createEmptyPersistedTreeState()
  }
}

/**
 * @param {PersistedTreeState | { nodes: PersistedNode[], edges: PersistedEdge[] }} state
 * @param {string} [key]
 * @returns {boolean}
 */
export function saveToLocalStorage(state, key = SKILL_TREE_STORAGE_KEY) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false
    window.localStorage.setItem(key, serialize(state))
    return true
  } catch (_error) {
    return false
  }
}

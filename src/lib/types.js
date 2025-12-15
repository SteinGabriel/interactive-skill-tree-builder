/**
 * @typedef {'locked' | 'unlockable' | 'unlocked' | 'completed'} SkillStatus
 */

/**
 * Status values that should be persisted. `unlockable` is derived from prerequisites.
 * @typedef {'locked' | 'unlocked' | 'completed'} PersistedSkillStatus
 */

/**
 * @typedef {Object} SkillNodeData
 * @property {string} title
 * @property {string} [description]
 * @property {number} [cost]
 * @property {number} [level]
 * @property {SkillStatus} status
 */

/**
 * @typedef {Object} PersistedSkillNodeData
 * @property {string} title
 * @property {string} [description]
 * @property {number} [cost]
 * @property {number} [level]
 * @property {PersistedSkillStatus} status
 */

/**
 * @typedef {Object} PersistedNode
 * @property {string} id
 * @property {{ x: number, y: number }} position
 * @property {PersistedSkillNodeData} data
 */

/**
 * @typedef {Object} PersistedEdge
 * @property {string} id
 * @property {string} source
 * @property {string} target
 */

/**
 * @typedef {Object} PersistedTreeState
 * @property {number} skillPointsTotal
 * @property {PersistedNode[]} nodes
 * @property {PersistedEdge[]} edges
 */

export {}

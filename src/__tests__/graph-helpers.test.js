import {
  deriveNodeStatuses,
  getInboundPrereqIds,
  indexNodesById,
  isNodeUnlockable,
  validateEdgeCreation,
} from '@/lib/helpers/graph.js'

function node(id, status) {
  return { id, data: { status, title: id } }
}

describe('graph helpers', () => {
  describe('getInboundPrereqIds', () => {
    test('returns unique inbound prerequisites for a node', () => {
      const edges = [
        { source: 'A', target: 'B' },
        { source: 'A', target: 'B' },
        { source: 'C', target: 'B' },
        { source: 'A', target: 'D' },
      ]

      expect(getInboundPrereqIds(edges, 'B')).toEqual(['A', 'C'])
      expect(getInboundPrereqIds(edges, 'D')).toEqual(['A'])
      expect(getInboundPrereqIds(edges, 'A')).toEqual([])
    })
  })

  describe('isNodeUnlockable', () => {
    test('is unlockable when there are no prerequisites', () => {
      const nodes = [node('A', 'locked')]
      const nodesById = indexNodesById(nodes)

      expect(isNodeUnlockable({ nodesById, edges: [], nodeId: 'A' })).toBe(true)
    })

    test('is unlockable only when all prerequisites are completed', () => {
      const nodes = [node('A', 'completed'), node('B', 'locked'), node('C', 'unlocked')]
      const nodesById = indexNodesById(nodes)
      const edges = [
        { source: 'A', target: 'B' },
        { source: 'C', target: 'B' },
      ]

      expect(isNodeUnlockable({ nodesById, edges, nodeId: 'B' })).toBe(false)

      const nodes2 = [node('A', 'completed'), node('B', 'locked'), node('C', 'completed')]
      const nodesById2 = indexNodesById(nodes2)
      expect(isNodeUnlockable({ nodesById: nodesById2, edges, nodeId: 'B' })).toBe(true)
    })

    test('treats missing prerequisite nodes as not unlockable', () => {
      const nodes = [node('B', 'locked')]
      const nodesById = indexNodesById(nodes)
      const edges = [{ source: 'MISSING', target: 'B' }]

      expect(isNodeUnlockable({ nodesById, edges, nodeId: 'B' })).toBe(false)
    })
  })

  describe('deriveNodeStatuses', () => {
    test('derives unlockable for locked nodes with zero prerequisites', () => {
      const nodes = [node('A', 'locked'), node('B', 'unlocked')]
      const next = deriveNodeStatuses(nodes, [])

      expect(next.find((n) => n.id === 'A').data.status).toBe('unlockable')
      expect(next.find((n) => n.id === 'B').data.status).toBe('unlocked')
    })

    test('sets unlockable -> locked when an incomplete prerequisite is added', () => {
      const nodes = [node('A', 'locked'), node('B', 'unlockable')]
      const edges = [{ source: 'A', target: 'B' }]
      const next = deriveNodeStatuses(nodes, edges)

      expect(next.find((n) => n.id === 'B').data.status).toBe('locked')
    })

    test('sets locked -> unlockable when all prerequisites become completed', () => {
      const nodes = [node('A', 'completed'), node('B', 'locked')]
      const edges = [{ source: 'A', target: 'B' }]
      const next = deriveNodeStatuses(nodes, edges)

      expect(next.find((n) => n.id === 'B').data.status).toBe('unlockable')
    })

    test('does not overwrite explicit unlocked/completed statuses', () => {
      const nodes = [
        node('A', 'locked'),
        node('B', 'unlocked'),
        node('C', 'completed'),
      ]
      const edges = [
        { source: 'A', target: 'B' },
        { source: 'A', target: 'C' },
      ]

      const next = deriveNodeStatuses(nodes, edges)
      expect(next.find((n) => n.id === 'B').data.status).toBe('unlocked')
      expect(next.find((n) => n.id === 'C').data.status).toBe('completed')
    })
  })

  describe('validateEdgeCreation', () => {
    test('rejects self loops', () => {
      expect(
        validateEdgeCreation({ source: 'A', target: 'A', edges: [] }),
      ).toEqual({ ok: false, reason: 'self_loop' })
    })

    test('rejects duplicate edges', () => {
      const edges = [{ source: 'A', target: 'B' }]
      expect(
        validateEdgeCreation({ source: 'A', target: 'B', edges }),
      ).toEqual({ ok: false, reason: 'duplicate' })
    })

    test('rejects direct 2-node cycles (A -> B -> A)', () => {
      const edges = [{ source: 'A', target: 'B' }]
      expect(
        validateEdgeCreation({ source: 'B', target: 'A', edges }),
      ).toEqual({ ok: false, reason: 'direct_cycle' })
    })

    test('accepts a valid edge', () => {
      const edges = [{ source: 'A', target: 'B' }]
      expect(
        validateEdgeCreation({ source: 'B', target: 'C', edges }),
      ).toEqual({ ok: true })
    })
  })
})

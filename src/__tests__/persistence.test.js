import {
  createEmptyPersistedTreeState,
  deserialize,
  loadFromLocalStorage,
  saveToLocalStorage,
  serialize,
} from '@/lib/helpers/persistence.js'

describe('persistence helpers', () => {
  test('round-trips serialize/deserialize and strips derived unlockable', () => {
    const state = {
      nodes: [
        {
          id: 'A',
          position: { x: 1, y: 2 },
          data: { title: 'A', status: 'unlockable' },
        },
        {
          id: 'B',
          position: { x: 3, y: 4 },
          data: { title: 'B', description: 'desc', cost: 5, level: 2, status: 'completed' },
        },
      ],
      edges: [{ id: 'A->B', source: 'A', target: 'B' }],
    }

    const roundTripped = deserialize(serialize(state))
    expect(roundTripped.nodes).toHaveLength(2)
    expect(roundTripped.nodes[0].data.status).toBe('locked')
    expect(roundTripped.nodes[1].data.status).toBe('completed')
    expect(roundTripped.edges).toEqual([{ id: 'A->B', source: 'A', target: 'B' }])
  })

  test('deserialize throws on invalid JSON', () => {
    expect(() => deserialize('{not json')).toThrow('Invalid JSON')
  })

  test('loadFromLocalStorage returns empty state when missing', () => {
    window.localStorage.removeItem('test-key')
    expect(loadFromLocalStorage('test-key')).toEqual(createEmptyPersistedTreeState())
  })

  test('deserialize tolerates partial/invalid data by dropping bad entries', () => {
    const serialized = JSON.stringify({
      nodes: [
        { id: 'A', position: { x: 0, y: 0 }, data: { title: 'A', status: 'unlocked' } },
        { id: '', position: { x: 0, y: 0 }, data: { title: 'bad', status: 'locked' } },
        { id: 'B', position: {}, data: { title: 'B', status: 'nope' } },
        { id: 'C', data: { title: 'C', status: 'locked' } },
      ],
      edges: [
        { source: 'A', target: 'B' },
        { id: '', source: ' ', target: 'B' },
        { id: 'x', source: 'A', target: 123 },
      ],
    })

    const state = deserialize(serialized)
    expect(state.nodes.map((n) => n.id)).toEqual(['A', 'B', 'C'])
    expect(state.nodes.find((n) => n.id === 'B').position).toEqual({ x: 0, y: 0 })
    expect(state.nodes.find((n) => n.id === 'B').data.status).toBe('locked')
    expect(state.edges).toEqual([{ id: 'A->B', source: 'A', target: 'B' }])
  })

  test('saveToLocalStorage returns true on success', () => {
    const state = createEmptyPersistedTreeState()
    expect(saveToLocalStorage(state, 'test-save')).toBe(true)
    expect(JSON.parse(window.localStorage.getItem('test-save'))).toEqual(state)
  })
})

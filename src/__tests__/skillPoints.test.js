import {
  getSkillPointsForNodeData,
  getSkillPointsRequiredForNodeData,
  getSkillPointsSpent,
} from '@/lib/helpers/skillPoints.js'

describe('skill points helpers', () => {
  test('counts points only for unlocked/completed nodes', () => {
    const nodes = [
      { data: { status: 'unlockable', cost: 2, level: 1 } },
      { data: { status: 'locked', cost: 2, level: 1 } },
      { data: { status: 'unlocked', cost: 2, level: 1 } },
      { data: { status: 'completed', cost: 3, level: 2 } },
    ]

    expect(getSkillPointsSpent(nodes)).toBe(2 + 3 * 2)
  })

  test('defaults missing cost to 0 and missing level to 1', () => {
    expect(getSkillPointsForNodeData({ status: 'unlocked' })).toBe(0)
    expect(getSkillPointsForNodeData({ status: 'unlocked', cost: 2 })).toBe(2)
    expect(getSkillPointsForNodeData({ status: 'unlocked', level: 3 })).toBe(0)
  })

  test('ignores invalid/negative values', () => {
    expect(getSkillPointsForNodeData({ status: 'unlocked', cost: -5, level: 2 })).toBe(0)
    expect(getSkillPointsForNodeData({ status: 'unlocked', cost: 2, level: -1 })).toBe(2)
    expect(getSkillPointsForNodeData({ status: 'unlocked', cost: Number.NaN, level: 2 })).toBe(
      0,
    )
  })

  test('computes required points regardless of status', () => {
    expect(getSkillPointsRequiredForNodeData({ cost: 2, level: 3 })).toBe(6)
    expect(getSkillPointsRequiredForNodeData({ cost: 2 })).toBe(2)
    expect(getSkillPointsRequiredForNodeData({ level: 3 })).toBe(0)
    expect(getSkillPointsRequiredForNodeData(undefined)).toBe(0)
  })
})

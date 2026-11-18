import { describe, expect, it } from 'vitest'
import { compareInterests } from '../src/lib/compare'

describe('compareInterests', () => {
  it('scores identical maps at 100 and different maps at 0', () => {
    const a = [{ topic: 'Comedy', share: 0.6 }, { topic: 'Fishing', share: 0.4 }]
    expect(compareInterests(a, a).score).toBe(100)
    expect(compareInterests(a, [{ topic: 'Tech', share: 1 }]).score).toBe(0)
  })

  it('finds shared topics and topics only one person sees', () => {
    const c = compareInterests(
      [{ topic: 'Comedy', share: 0.4 }, { topic: 'Hunting & Outdoors', share: 0.4 }, { topic: 'Cooking & Food', share: 0.2 }],
      [{ topic: 'Comedy', share: 0.3 }, { topic: 'Cooking & Food', share: 0.3 }, { topic: 'Pets & Animals', share: 0.4 }],
    )
    expect(c.shared.map((r) => r.topic)).toEqual(['Comedy', 'Cooking & Food'])
    expect(c.onlyA.map((r) => r.topic)).toEqual(['Hunting & Outdoors'])
    expect(c.onlyB.map((r) => r.topic)).toEqual(['Pets & Animals'])
    expect(c.score).toBeGreaterThan(30)
    expect(c.score).toBeLessThan(70)
  })

  it('handles an empty map', () => {
    expect(compareInterests([], [{ topic: 'Comedy', share: 1 }]).score).toBe(0)
  })
})

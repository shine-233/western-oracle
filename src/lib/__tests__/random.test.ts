import { describe, expect, it } from 'vitest'
import { pick, randInt, shuffle } from '../random'

describe('random', () => {
  it('randInt 返回 [0, n) 范围内的整数', () => {
    for (let i = 0; i < 500; i++) {
      const v = randInt(7)
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(7)
      expect(Number.isInteger(v)).toBe(true)
    }
  })

  it('randInt(1) 恒为 0；randInt(0) 抛出', () => {
    for (let i = 0; i < 20; i++) expect(randInt(1)).toBe(0)
    expect(() => randInt(0)).toThrow(RangeError)
  })

  it('shuffle 保持元素集合不变且长度一致', () => {
    const src = Array.from({ length: 50 }, (_, i) => i)
    for (let round = 0; round < 20; round++) {
      const out = shuffle(src)
      expect(out).toHaveLength(src.length)
      expect([...out].sort((a, b) => a - b)).toEqual(src)
    }
  })

  it('shuffle 不修改原数组', () => {
    const src = [1, 2, 3, 4, 5]
    const snapshot = [...src]
    shuffle(src)
    expect(src).toEqual(snapshot)
  })

  it('pick 只返回集合内元素', () => {
    const pool = ['a', 'b', 'c'] as const
    for (let i = 0; i < 30; i++) expect(pool).toContain(pick(pool))
  })
})

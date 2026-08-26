import { describe, expect, it } from 'vitest'
import { castMeihua, trigramByNum, TRIGRAMS } from '../meihua'

describe('meihua', () => {
  it('先天八卦数与爻位一一对应', () => {
    expect(trigramByNum(1).name).toBe('乾')
    expect(trigramByNum(2).name).toBe('兑')
    expect(trigramByNum(3).name).toBe('离')
    expect(trigramByNum(4).name).toBe('震')
    expect(trigramByNum(5).name).toBe('巽')
    expect(trigramByNum(6).name).toBe('坎')
    expect(trigramByNum(7).name).toBe('艮')
    expect(trigramByNum(8).name).toBe('坤')
    // 循环回绕
    expect(trigramByNum(9).name).toBe('乾')
    expect(TRIGRAMS.every((t) => t.bits.length === 3)).toBe(true)
  })

  it('同一输入卦象确定可复现', () => {
    const input = { picked: 7, year: 1990, month: 5, day: 23, hour: 14 }
    const a = castMeihua(input)
    const b = castMeihua(input)
    expect(a.upper.name).toBe(b.upper.name)
    expect(a.lower.name).toBe(b.lower.name)
    expect(a.moving).toBe(b.moving)
    expect(a.hexa.zh).toBe(b.hexa.zh)
  })

  it('推演公式自洽：上卦=和 mod8，动爻=总和 mod6', () => {
    const input = { picked: 88, year: 2000, month: 1, day: 1, hour: 6 }
    const r = castMeihua(input)
    // base = 2000+1+1 = 2002；上卦 (2002+88) mod8 → 2090 mod8 余 2 → 兑
    expect(r.upper.name).toBe('兑')
    // 下卦 (2002+6+88)=2096 mod8 余 0 → 取 8 → 坤
    expect(r.lower.name).toBe('坤')
    // 动爻 总和2096 mod6：2096 = 349*6+2 → 第2爻
    expect(r.moving).toBe(2)
    expect(r.hexa.zh.length).toBeGreaterThan(0)
    expect(r.steps).toHaveLength(3)
  })
})

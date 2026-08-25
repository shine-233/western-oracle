import { describe, expect, it } from 'vitest'
import { ALMANAC_RULER_DOMAIN, todayAlmanac } from '../daily'
import { moonPhase } from '../astrology'

const WEEK_RULER = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'] as const

describe('todayAlmanac', () => {
  it('星期守护星与星期几一一对应（传统周守护星序）', () => {
    // 2026-08-23 周日 → 2026-08-29 周六，一整周
    for (let d = 23; d <= 29; d++) {
      const date = new Date(2026, 7, d)
      const alm = todayAlmanac(date)
      expect(alm.rulerKey).toBe(WEEK_RULER[date.getDay()])
      expect(ALMANAC_RULER_DOMAIN[alm.rulerKey]).toBeDefined()
    }
  })

  it('同一天结果完全确定（伪随机基于日期哈希）', () => {
    const a = todayAlmanac(new Date(2026, 7, 25))
    const b = todayAlmanac(new Date(2026, 7, 25))
    expect(a).toEqual(b)
  })

  it('宜忌跟随当日月相索引', () => {
    const date = new Date(2026, 7, 25)
    const phase = moonPhase(date)
    const alm = todayAlmanac(date)
    expect(alm.doText.length).toBeGreaterThan(0)
    expect(alm.dontText.length).toBeGreaterThan(0)
    // 中英双份且不同文本
    expect(alm.doEn.length).toBeGreaterThan(0)
    expect(alm.dontEn.length).toBeGreaterThan(0)
    expect(alm.doEn).not.toBe(alm.doText)
    expect(phase.index).toBeGreaterThanOrEqual(0)
    expect(phase.index).toBeLessThanOrEqual(7)
  })

  it('幸运色来自预置色板、幸运数在 1-9', () => {
    const hexes = new Set(['#f5c86e', '#b3a6f7', '#ff9fce', '#7de8c3', '#a9c4e8', '#ffb37a', '#8f8ac2'])
    const seen = new Set<string>()
    for (let d = 1; d <= 31; d++) {
      const alm = todayAlmanac(new Date(2026, 7, d))
      expect(hexes.has(alm.luckyColor.hex)).toBe(true)
      expect(alm.luckyNumber).toBeGreaterThanOrEqual(1)
      expect(alm.luckyNumber).toBeLessThanOrEqual(9)
      seen.add(alm.luckyColor.hex)
    }
    // 一个月内应出现多种颜色
    expect(seen.size).toBeGreaterThan(2)
  })
})

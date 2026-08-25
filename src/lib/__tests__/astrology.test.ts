import { describe, expect, it } from 'vitest'
import { computeNatalChart, crossAspects, moonPhase, type BirthInput } from '../astrology'

const BEIJING: BirthInput = {
  year: 2000,
  month: 1,
  day: 1,
  hour: 12,
  minute: 0,
  timezone: 8,
  latitude: 39.9042,
  longitude: 116.4074,
}

describe('natal chart', () => {
  it('返回完整盘面：星体、宫位线、相位、元素统计', () => {
    const chart = computeNatalChart(BEIJING)
    expect(chart.planets.length).toBeGreaterThanOrEqual(14)
    expect(chart.cusps).toHaveLength(12)
    expect(chart.aspects.length).toBeGreaterThan(0)
    expect(chart.patterns).toBeInstanceOf(Array)
    const sun = chart.planets.find((p) => p.name === 'Sun')
    expect(sun).toBeDefined()
    // 2000-01-01 太阳黄经约 280°，落在摩羯座（索引 9）
    expect(sun!.signIndex).toBe(9)
    const moon = chart.planets.find((p) => p.name === 'Moon')
    expect(moon).toBeDefined()
    // 南北交点恒相对 180°
    const nn = chart.planets.find((p) => p.name === 'NorthNode')
    const sn = chart.planets.find((p) => p.name === 'SouthNode')
    if (nn && sn) {
      let sep = Math.abs(nn.lon - sn.lon) % 360
      if (sep > 180) sep = 360 - sep
      expect(sep).toBeCloseTo(180, 5)
    }
  })

  it('同盘自交叉：每颗星与自身合相且偏差≈0', () => {
    const chart = computeNatalChart(BEIJING)
    const selfCross = crossAspects(chart.planets, chart.planets)
    expect(selfCross.length).toBeGreaterThanOrEqual(chart.planets.length)
    const selfConj = selfCross.find((a) => a.body1 === 'Sun' && a.body2 === 'Sun' && a.type === 'conjunction')
    expect(selfConj).toBeDefined()
    expect(selfConj!.orb).toBeLessThan(0.01)
  })

  it('按紧密程度升序排列', () => {
    const chart = computeNatalChart(BEIJING)
    const sky = computeNatalChart({ ...BEIJING, year: 2026, month: 8, day: 25 })
    const list = crossAspects(sky.planets, chart.planets)
    for (let i = 1; i < list.length; i++) {
      expect(list[i]!.orb).toBeGreaterThanOrEqual(list[i - 1]!.orb)
    }
  })
})

describe('moon phase', () => {
  it('月相索引合法且文案非空', () => {
    const p = moonPhase(new Date('2026-08-25T20:00:00'))
    expect(p.index).toBeGreaterThanOrEqual(0)
    expect(p.index).toBeLessThanOrEqual(7)
    expect(p.name.length).toBeGreaterThan(0)
    expect(p.desc.length).toBeGreaterThan(0)
    expect(p.emoji.length).toBeGreaterThan(0)
  })

  it('已知满月日期给出满月附近相位（允许相邻档）', () => {
    // 2026-08-28 为满月（近似），检查 elongation 落在满月档
    const full = moonPhase(new Date('2026-08-28T12:00:00Z'))
    expect([3, 4, 5]).toContain(full.index)
  })
})

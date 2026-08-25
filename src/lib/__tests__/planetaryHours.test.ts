import { describe, expect, it } from 'vitest'
import { riseSet, planetaryHours, currentPlanetHour, dayRuler } from '../planetaryHours'

const BJ = { latitude: 39.9042, longitude: 116.4074 }
const LONDON = { latitude: 51.5074, longitude: -0.1278 }

describe('riseSet 日出日落', () => {
  it('北京冬至日出晚、日落早；夏至相反', () => {
    const winter = riseSet(new Date(2026, 11, 21), BJ.latitude, BJ.longitude)
    const summer = riseSet(new Date(2026, 5, 21), BJ.latitude, BJ.longitude)
    expect(winter.sunrise).toBeTruthy()
    expect(summer.sunrise).toBeTruthy()
    // 北京属东八区，本地时间用 UTC+8 读
    const h = (d: Date): number => d.getUTCHours() + 8 + d.getUTCMinutes() / 60
    expect(h(winter.sunrise!)).toBeGreaterThan(h(summer.sunrise!))
    expect(h(winter.sunset!)).toBeLessThan(h(summer.sunset!))
  })

  it('日出早于日落，昼长在合理区间', () => {
    const { sunrise, sunset } = riseSet(new Date(2026, 7, 25), LONDON.latitude, LONDON.longitude)
    expect(sunrise).toBeTruthy()
    expect(sunset).toBeTruthy()
    const lenH = (sunset!.getTime() - sunrise!.getTime()) / 3600000
    expect(lenH).toBeGreaterThan(8)
    expect(lenH).toBeLessThan(18)
  })
})

describe('planetaryHours 行星时序列', () => {
  it('共 24 时，首时守护星 = 当日守护星，且按迦勒底次序轮转', () => {
    const date = new Date(2026, 7, 25)
    const hs = planetaryHours(date, BJ.latitude, BJ.longitude)
    expect(hs).toHaveLength(24)
    expect(hs[0]!.ruler).toBe(dayRuler(date))
    const ORDER = ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon']
    for (let i = 1; i < hs.length; i++) {
      const prev = ORDER.indexOf(hs[i - 1]!.ruler)
      const cur = ORDER.indexOf(hs[i]!.ruler)
      expect(cur).toBe((prev + 1) % 7)
    }
  })

  it('前 12 时为日间、后 12 时为夜间，且时间连续覆盖到次日日出', () => {
    const date = new Date(2026, 7, 25)
    const hs = planetaryHours(date, BJ.latitude, BJ.longitude)
    expect(hs.filter((h) => h.daytime)).toHaveLength(12)
    expect(hs.filter((h) => !h.daytime)).toHaveLength(12)
    for (let i = 1; i < hs.length; i++) {
      expect(hs[i]!.start.getTime()).toBe(hs[i - 1]!.end.getTime())
    }
    const nextRise = riseSet(new Date(date.getTime() + 86400000), BJ.latitude, BJ.longitude).sunrise!
    expect(hs[23]!.end.getTime()).toBe(nextRise.getTime())
  })

  it('currentPlanetHour 能定位当前时辰', () => {
    const hs = planetaryHours(new Date(), BJ.latitude, BJ.longitude)
    const probe = hs[5]!
    const found = currentPlanetHour(hs, new Date((probe.start.getTime() + probe.end.getTime()) / 2))
    expect(found?.index).toBe(probe.index)
  })
})

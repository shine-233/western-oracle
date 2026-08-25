import { describe, expect, it } from 'vitest'
import { findSolarReturn } from '../solarReturn'
import { getSunPosition } from 'celestine'

describe('findSolarReturn 太阳回归时刻', () => {
  it('本命太阳 0°（白羊点）→ 回归落在 3 月中下旬', () => {
    const r = findSolarReturn(0, 2026, 3, 21)
    const m = r.moment
    expect(m.getMonth()).toBe(2) // March
    expect(m.getDate()).toBeGreaterThanOrEqual(18)
    expect(m.getDate()).toBeLessThanOrEqual(23)
    expect(r.residualDeg).toBeLessThan(0.01)
  })

  it('本命太阳 180°（天秤点）→ 回归落在 9 月下旬', () => {
    const r = findSolarReturn(180, 2026, 9, 23)
    expect(r.moment.getMonth()).toBe(8) // September
    expect(r.residualDeg).toBeLessThan(0.01)
  })

  it('回归时刻的太阳黄经与本命黄经几乎重合（独立用 celestine 复核）', () => {
    // 7 月 18 日前后太阳黄经约 115°，取 115.5 保证回归落在扫描窗内
    const natalLon = 115.5
    const r = findSolarReturn(natalLon, 2027, 7, 18)
    const jd =
      r.moment.getTime() / 86400000 + 2440587.5
    const lon = getSunPosition(jd).longitude
    const dist = Math.abs(((lon - natalLon + 540) % 360) - 180)
    expect(dist).toBeLessThan(0.02)
  })
})

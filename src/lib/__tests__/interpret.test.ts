import { describe, expect, it } from 'vitest'
import { computeNatalChart, crossAspects, type BirthInput, type NatalChart } from '../astrology'
import { readSynastry, readTransits } from '../interpret'

const A: BirthInput = { year: 1995, month: 6, day: 15, hour: 10, minute: 30, timezone: 8, latitude: 31.23, longitude: 121.47 }
const B: BirthInput = { year: 1997, month: 11, day: 3, hour: 18, minute: 45, timezone: 8, latitude: 39.9, longitude: 116.41 }

function chartOf(b: BirthInput): NatalChart {
  return computeNatalChart(b)
}

describe('synastry reading', () => {
  const a = chartOf(A)
  const b = chartOf(B)
  const reading = readSynastry(a, b)

  it('缘分指数在 28-97 之间', () => {
    expect(reading.score).toBeGreaterThanOrEqual(28)
    expect(reading.score).toBeLessThanOrEqual(97)
  })

  it('总览、标签、建议齐全', () => {
    expect(reading.overview.length).toBeGreaterThan(20)
    expect(reading.tags.length).toBeGreaterThan(0)
    expect(reading.advice.length).toBeGreaterThan(10)
    for (const tag of reading.tags) expect(tag.length).toBeGreaterThan(2)
  })

  it('解读条目结构完整且不超过 9 条', () => {
    expect(reading.items.length).toBeGreaterThan(0)
    expect(reading.items.length).toBeLessThanOrEqual(9)
    for (const item of reading.items) {
      expect(item.title).toContain('偏差')
      expect(item.text.length).toBeGreaterThan(20)
    }
  })
})

describe('transit reading', () => {
  const natal = chartOf(A)
  const sky = chartOf({ ...A, year: 2026, month: 8, day: 25 })
  const aspects = crossAspects(sky.planets, natal.planets)
  const reading = readTransits(natal, sky, aspects)

  it('总览包含天象与相位计数信息', () => {
    expect(reading.overview).toContain('月相')
    expect(reading.overview).toContain(String(aspects.length))
  })

  it('条目等级合法、标题含相位符号区间', () => {
    for (const item of reading.items) {
      expect(['high', 'mid', 'low']).toContain(item.level)
      expect(item.title.length).toBeGreaterThan(6)
      expect(item.text.length).toBeGreaterThan(15)
    }
  })

  it('无相位时也有留白提示', () => {
    const empty = readTransits(natal, sky, [])
    expect(empty.items).toHaveLength(0)
    expect(empty.highlight).toBeDefined()
    expect(empty.highlight!.length).toBeGreaterThan(10)
  })
})

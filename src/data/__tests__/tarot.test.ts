import { describe, expect, it } from 'vitest'
import { ALL_CARDS, MAJOR_ARCANA, SPREADS, dailyCard, getCard } from '../tarot'

describe('tarot data', () => {
  it('整副牌共 78 张：22 大阿卡纳 + 56 小阿卡纳', () => {
    expect(ALL_CARDS).toHaveLength(78)
    expect(MAJOR_ARCANA).toHaveLength(22)
    expect(ALL_CARDS.filter((c) => c.arcana === 'minor')).toHaveLength(56)
  })

  it('每张卡字段完整且正逆位释义非空', () => {
    for (const c of ALL_CARDS) {
      expect(c.id.length).toBeGreaterThan(0)
      expect(c.nameCn.length).toBeGreaterThan(0)
      expect(c.keywords.length).toBeGreaterThan(0)
      expect(c.upright.length).toBeGreaterThan(6)
      expect(c.reversed.length).toBeGreaterThan(6)
    }
  })

  it('id 唯一（getCard 可稳定命中）', () => {
    const ids = new Set(ALL_CARDS.map((c) => c.id))
    expect(ids.size).toBe(78)
    expect(getCard('fool')?.name).toBe('The Fool')
    expect(getCard('nope')).toBeUndefined()
  })

  it('四种牌阵，凯尔特十字为 10 张位', () => {
    expect(SPREADS.map((s) => s.id)).toEqual(['single', 'three', 'five', 'celtic'])
    for (const s of SPREADS) {
      expect(s.positions.length).toBeGreaterThan(0)
      expect(s.name.length).toBeGreaterThan(0)
    }
    const celtic = SPREADS.find((s) => s.id === 'celtic')!
    expect(celtic.positions).toHaveLength(10)
  })

  it('每日一牌按日期确定且落在牌库内', () => {
    const d1 = dailyCard(new Date('2026-08-25T00:00:00'))
    const d2 = dailyCard(new Date('2026-08-25T23:59:59'))
    const d3 = dailyCard(new Date('2026-08-26T00:00:00'))
    expect(d1.card.id).toBe(d2.card.id)
    expect(d1.reversed).toBe(d2.reversed)
    expect(ALL_CARDS.some((c) => c.id === d3.card.id)).toBe(true)
  })
})

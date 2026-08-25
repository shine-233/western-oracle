import { describe, expect, it } from 'vitest'
import { ASPECTS, CHART_POINT_KEYS, HOUSES, PATTERNS_CN, PLANETS, SIGNS, aspectText, houseFullText, planetInHouseText, planetInSignText, signFullText } from '../corpus'

describe('astro corpus', () => {
  it('12 星座 / 12 宫位 / 完整星体表', () => {
    expect(SIGNS).toHaveLength(12)
    expect(HOUSES).toHaveLength(12)
    for (const s of SIGNS) {
      expect(s.personality.length).toBeGreaterThan(8)
      expect(s.love.length).toBeGreaterThan(4)
      expect(s.career.length).toBeGreaterThan(4)
      expect(s.shadow.length).toBeGreaterThan(4)
    }
    for (const h of HOUSES) expect(h.theme.length).toBeGreaterThan(10)
  })

  it('星体表覆盖全部盘面点位，字段非空', () => {
    for (const key of CHART_POINT_KEYS) {
      const p = PLANETS[key]
      expect(p, `missing planet ${key}`).toBeDefined()
      expect(p!.cn.length).toBeGreaterThan(0)
      expect(p!.detail.length).toBeGreaterThan(10)
    }
  })

  it('相位含义含五大主要相位', () => {
    for (const a of ['conjunction', 'sextile', 'square', 'trine', 'opposition']) {
      expect(ASPECTS[a]).toBeDefined()
      expect(ASPECTS[a]!.essence.length).toBeGreaterThan(6)
      expect(ASPECTS[a]!.advice.length).toBeGreaterThan(6)
    }
  })

  it('格局中文名覆盖 7 种 PatternType', () => {
    expect(Object.keys(PATTERNS_CN)).toHaveLength(7)
  })

  it('组合文案生成器输出包含关键名词', () => {
    const s = planetInSignText('Sun', 0)
    expect(s).toContain('太阳')
    expect(s).toContain('白羊座')
    const h = planetInHouseText('Moon', 4)
    expect(h).toContain('月亮')
    expect(h).toContain('第 4 宫')
    expect(signFullText(5)).toContain('处女座')
    expect(houseFullText(1)).toContain('第 1 宫')
    expect(aspectText('trine')).toContain('拱相')
  })
})

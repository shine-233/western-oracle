import { describe, expect, it } from 'vitest'
import { MASCOT_IDS, MASCOTS, MASCOT_PALETTE, mascotVoxels } from '../mascots'

describe('oracle pets', () => {
  it('七只吉祥物 id 唯一', () => {
    expect(MASCOT_IDS).toHaveLength(7)
    expect(new Set(MASCOT_IDS).size).toBe(7)
  })

  it('像素画只使用调色板字符，行宽一致，且达到高密度规格（≥40×46，≤64）', () => {
    for (const def of Object.values(MASCOTS)) {
      const cols = Math.max(...def.sprite.map((r) => r.length))
      expect(cols).toBeGreaterThanOrEqual(40)
      expect(def.sprite.length).toBeGreaterThanOrEqual(46)
      expect(cols).toBeLessThanOrEqual(64)
      for (const row of def.sprite) {
        for (const ch of row.padEnd(cols, '.')) {
          if (ch === '.') continue
          expect(MASCOT_PALETTE[ch], `${def.id}: 未知字符 ${ch}`).toBeDefined()
        }
      }
    }
  })

  it('七只吉祥物剪影互不相同（防止重绘时模板覆盖个性）', () => {
    const sigs = Object.values(MASCOTS).map((d) => d.sprite.join('|'))
    expect(new Set(sigs).size).toBe(7)
  })

  it('每只吉祥物都有眼睛（可眨眼）且体素非空', () => {
    for (const def of Object.values(MASCOTS)) {
      const voxels = mascotVoxels(def)
      expect(voxels.length).toBeGreaterThan(30)
      const eyes = voxels.filter((v) => v.isEye)
      expect(eyes.length, `${def.id} 缺少眼睛`).toBeGreaterThanOrEqual(2)
    }
  })

  it('体素坐标落在画布范围内', () => {
    for (const def of Object.values(MASCOTS)) {
      const cols = Math.max(...def.sprite.map((r) => r.length))
      for (const v of mascotVoxels(def)) {
        expect(v.x).toBeGreaterThanOrEqual(0)
        expect(v.x).toBeLessThan(cols)
        expect(v.y).toBeLessThan(def.sprite.length)
      }
    }
  })
})

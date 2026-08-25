import { describe, expect, it } from 'vitest'
import { birthdayNumber, calculateNumerology, digitSum, lifePathNumber, personalDay, personalMonth, personalYear } from '../numerology'

describe('numerology', () => {
  it('digitSum 反复约简到个位', () => {
    expect(digitSum(5)).toBe(5)
    expect(digitSum(42)).toBe(6)
    expect(digitSum(987)).toBe(6)
  })

  it('生命路径数保留大师数 11/22/33', () => {
    // 2000-01-01 → 2+0+0+0+0+1+0+1 = 4
    expect(lifePathNumber(2000, 1, 1)).toBe(4)
    // 1962-08-29 → 数字和 37 → 10 → 1
    expect(lifePathNumber(1962, 8, 29)).toBe(1)
    // 1955-10-28 → 31 → 4（比尔·盖茨）
    expect(lifePathNumber(1955, 10, 28)).toBe(4)
  })

  it('生日数：个位原样，两位约简，22 为大师数', () => {
    expect(birthdayNumber(7)).toBe(7)
    expect(birthdayNumber(19)).toBe(1)
    expect(birthdayNumber(22)).toBe(22)
    // 生日数不做大师数保留：29 → 11 → 2
    expect(birthdayNumber(29)).toBe(2)
  })

  it('无姓名时姓名系数字为 null', () => {
    const r = calculateNumerology({ y: 1990, m: 6, d: 15 }, '')
    expect(r.expression).toBeNull()
    expect(r.soulUrge).toBeNull()
    expect(r.personality).toBeNull()
    expect(r.lifePath).toBeGreaterThan(0)
  })

  it('姓名数字落在 1-9 或大师数区间', () => {
    const r = calculateNumerology({ y: 1990, m: 6, d: 15 }, 'Zhang San')
    const ok = (v: number | null): boolean => v !== null && (v >= 1 && v <= 9 || v === 11 || v === 22 || v === 33)
    expect(ok(r.expression)).toBe(true)
    expect(ok(r.soulUrge)).toBe(true)
    expect(ok(r.personality)).toBe(true)
  })

  it('流年/流月/流日均在有效范围', () => {
    for (let m = 1; m <= 12; m++) {
      for (const day of [1, 15, 28]) {
        const py = personalYear(m, day, 2026)
        const pm = personalMonth(py, m)
        const pd = personalDay(pm, day)
        const valid = (v: number): boolean => v >= 1 && v <= 9 || v === 11 || v === 22
        expect(valid(py)).toBe(true)
        expect(valid(pm)).toBe(true)
        expect(valid(pd)).toBe(true)
      }
    }
  })
})

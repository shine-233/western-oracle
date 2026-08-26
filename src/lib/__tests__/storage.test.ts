import { beforeEach, describe, expect, it } from 'vitest'
import { loadJSON, migrateRaw, removeKey, saveJSON } from '../storage'

describe('migrateRaw', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('旧键值迁入新前缀键并删除旧键', () => {
    localStorage.setItem('wo.moonbreath', JSON.stringify([{ d: '2026-08-25' }]))
    migrateRaw('wo.moonbreath', 'moonbreath-log')
    expect(localStorage.getItem('wo.moonbreath')).toBeNull()
    expect(loadJSON<{ d: string }[]>('moonbreath-log', [])).toEqual([{ d: '2026-08-25' }])
  })

  it('目标已存在时只清旧键不覆盖新数据', () => {
    localStorage.setItem('wo-wo-memory-best', '7')
    saveJSON('memory-best', 12)
    migrateRaw('wo-wo-memory-best', 'memory-best')
    expect(localStorage.getItem('wo-wo-memory-best')).toBeNull()
    expect(loadJSON<number>('memory-best', 0)).toBe(12)
  })

  it('旧键不存在时静默跳过', () => {
    expect(() => migrateRaw('ghost-key', 'any')).not.toThrow()
    expect(removeKey).toBeDefined()
  })
})

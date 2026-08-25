import { beforeEach, describe, expect, it } from 'vitest'
import { addHistory, clearHistory, getHistory, removeHistory } from '../history'

describe('divination history', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('增查删清闭环', () => {
    expect(getHistory()).toHaveLength(0)
    addHistory({ type: 'tarot', label: '塔罗 · 三张牌阵', summary: '愚者、月亮、太阳' })
    const list = getHistory()
    expect(list).toHaveLength(1)
    expect(list[0]!.label).toBe('塔罗 · 三张牌阵')
    removeHistory(list[0]!.id)
    expect(getHistory()).toHaveLength(0)
  })

  it('新记录排在最前，最多保留 200 条', () => {
    for (let i = 0; i < 205; i++) {
      addHistory({ type: 'rune', label: `第 ${i} 次`, summary: `s${i}` })
    }
    const list = getHistory()
    expect(list).toHaveLength(200)
    expect(list[0]!.label).toBe('第 204 次')
    expect(list[199]!.label).toBe('第 5 次')
  })

  it('clearHistory 一键清空且损坏数据安全回退', () => {
    addHistory({ type: 'numerology', label: '灵数', summary: '生命路径 7' })
    clearHistory()
    expect(getHistory()).toHaveLength(0)
    localStorage.setItem('wo-divination-history', '{broken json')
    expect(getHistory()).toEqual([])
  })
})

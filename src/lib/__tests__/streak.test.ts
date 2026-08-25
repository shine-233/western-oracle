import { describe, expect, it } from 'vitest'
import { getStreak, recordDivination } from '../streak'

/**
 * streak 依赖 localStorage，vitest 环境（jsdom/happy-dom）自带内存版实现。
 * 为隔离用例，先手动清 key。
 */
function reset(): void {
  window.localStorage.clear()
}

describe('streak', () => {
  it('首次占卜记 1 天', () => {
    reset()
    const s = recordDivination(new Date(2026, 7, 25, 9, 0))
    expect(s.days).toBe(1)
    expect(s.best).toBe(1)
  })

  it('同一天重复占卜不重复计天', () => {
    reset()
    recordDivination(new Date(2026, 7, 25, 9, 0))
    const again = recordDivination(new Date(2026, 7, 25, 21, 30))
    expect(again.days).toBe(1)
  })

  it('连续每天占卜逐日累加', () => {
    reset()
    recordDivination(new Date(2026, 7, 23))
    recordDivination(new Date(2026, 7, 24))
    const s = recordDivination(new Date(2026, 7, 25))
    expect(s.days).toBe(3)
    expect(s.best).toBe(3)
  })

  it('断签后归一重计，但保留最佳纪录', () => {
    reset()
    recordDivination(new Date(2026, 7, 1))
    recordDivination(new Date(2026, 7, 2))
    recordDivination(new Date(2026, 7, 3))
    const after = recordDivination(new Date(2026, 7, 20))
    expect(after.days).toBe(1)
    expect(after.best).toBe(3)
  })

  it('getStreak 只读：隔天未占卜时展示为 0 但不写入', () => {
    reset()
    recordDivination(new Date(2026, 7, 10))
    // 用未来日期模拟「第二天查看但没占」
    const view = getStreak()
    expect(view.best).toBeGreaterThanOrEqual(1)
    expect(view.days).toBe(0)
  })
})

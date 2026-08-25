/**
 * 占卜连击（对标 CHANI/Co-Star 的 streak 游戏化机制）：
 * 每天第一次占卜记 1 天，连续则累加，断签归零重计。
 * 数据存 localStorage（key: wo-streak），纯本地。
 */

const KEY = 'wo-streak'

export interface StreakState {
  /** 当前连击天数 */
  days: number
  /** 历史最长连击 */
  best: number
  /** 上次占卜的日期标记 YYYY-M-D */
  last: string
}

function dayKey(d = new Date()): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

function load(): StreakState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const p = JSON.parse(raw) as Partial<StreakState>
      if (typeof p.days === 'number' && typeof p.best === 'number' && typeof p.last === 'string') {
        return { days: p.days, best: p.best, last: p.last }
      }
    }
  } catch {
    /* noop */
  }
  return { days: 0, best: 0, last: '' }
}

function save(s: StreakState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    /* noop */
  }
}

/** 相对给定时间的前一天 */
function yesterdayKey(now: Date): string {
  const y = new Date(now)
  y.setDate(y.getDate() - 1)
  return dayKey(y)
}

/**
 * 记录一次占卜：当天首次才推进连击。
 * @returns 更新后的状态
 */
export function recordDivination(now = new Date()): StreakState {
  const s = load()
  const today = dayKey(now)
  if (s.last === today) return s
  s.days = s.last === yesterdayKey(now) ? s.days + 1 : 1
  s.best = Math.max(s.best, s.days)
  s.last = today
  save(s)
  return s
}

/** 只读查看当前连击（不推进） */
export function getStreak(): StreakState {
  const s = load()
  // 断签超过一天：展示时清零当前值，但保留最佳纪录
  if (s.last !== dayKey() && s.last !== yesterdayKey(new Date())) s.days = 0
  return s
}

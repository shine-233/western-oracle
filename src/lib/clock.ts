/**
 * THREE.Clock 自 r183 起弃用（每帧打 console 警告）。
 * 此处用 performance.now 提供同款 getDelta/getElapsedTime/start 语义的替代：
 * getElapsedTime 会先推进 delta（与 THREE.Clock 行为一致），首次 getDelta 返回 0。
 */
export interface MiniClock {
  getDelta(): number
  getElapsedTime(): number
  start(): void
}

export function createClock(): MiniClock {
  let started = false
  let last = performance.now()
  let elapsed = 0

  const delta = (): number => {
    const now = performance.now()
    if (!started) {
      started = true
      last = now
      return 0
    }
    const d = (now - last) / 1000
    last = now
    elapsed += d
    return d
  }

  return {
    getDelta: delta,
    getElapsedTime: () => {
      delta()
      return elapsed
    },
    start: () => {
      started = false
      elapsed = 0
    },
  }
}

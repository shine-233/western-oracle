/**
 * 低端设备/省流检测：给 3D 后处理（bloom）这类重特效一个总闸。
 * 判定（任一命中即视为低配）：
 * - navigator.deviceMemory ≤ 4 GB
 * - connection.saveData（用户开了省流）
 * - 硬件线程数 ≤ 4 且屏幕 dpr ≥ 2（典型老手机）
 * 全部 API 缺失时按桌面处理，返回 false。
 */
export function isLowEnd(): boolean {
  if (typeof navigator === 'undefined') return false
  const nav = navigator as Navigator & {
    deviceMemory?: number
    connection?: { saveData?: boolean }
    hardwareConcurrency?: number
  }
  if (nav.connection?.saveData) return true
  if (typeof nav.deviceMemory === 'number' && nav.deviceMemory > 0 && nav.deviceMemory <= 4) return true
  const cores = nav.hardwareConcurrency ?? 8
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1
  if (cores <= 4 && dpr >= 2) return true
  return false
}

/* ---------- 用户手动覆盖（设置页开关，刷新后生效） ---------- */

const OVERRIDE_KEY = 'wo-lowpower-override'

/** 实际生效的低配档：用户覆盖优先，否则走自动检测 */
export function lowPowerActive(): boolean {
  try {
    const saved = localStorage.getItem(OVERRIDE_KEY)
    if (saved === '1') return true
    if (saved === '0') return false
  } catch {
    /* noop */
  }
  return isLowEnd()
}

export function setLowPowerOverride(v: boolean): void {
  try {
    localStorage.setItem(OVERRIDE_KEY, v ? '1' : '0')
  } catch {
    /* noop */
  }
}

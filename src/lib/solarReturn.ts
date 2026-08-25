/**
 * 太阳回归（Solar Return）：太阳每年回到出生时黄经的那一瞬间，
 * 被视为「这一年的年度盘」起点。本模块只负责找时刻，排盘复用 astrology.ts。
 */
import { getSunPosition, toJulianDate } from 'celestine'

function jdOf(y: number, m: number, d: number, hour: number, minute = 0): number {
  return toJulianDate({ year: y, month: m, day: d, hour, minute, second: 0 })
}

/** 黄经差（0-180） */
function angDiff(a: number, b: number): number {
  const d = Math.abs((((a - b) % 360) + 360) % 360)
  return d > 180 ? 360 - d : d
}

function jdToDate(jd: number): Date {
  // JD → Unix 毫秒（JD 2440587.5 = 1970-01-01T00:00:00Z）
  return new Date(Math.round((jd - 2440587.5) * 86400000))
}

export interface SolarReturnResult {
  /** 太阳精确回归的本地时刻 */
  moment: Date
  /** 回归时刻太阳黄经与本命黄经的差（度），应 < 0.01 */
  residualDeg: number
}

/**
 * 求某一年太阳回归时刻。
 * @param natalSunLon 本命太阳黄经（0-360）
 * @param year 目标年份
 * 策略：以生日当天为基准，前后各扫 2 天、步长 3 小时的粗网格，
 * 取黄经差最小点，再做二分细化到分钟级。
 */
export function findSolarReturn(natalSunLon: number, year: number, birthMonth: number, birthDay: number): SolarReturnResult {
  // 粗扫描
  let bestJd = 0
  let bestDiff = Infinity
  for (let off = -48; off <= 48; off += 3) {
    const jd = jdOf(year, birthMonth, birthDay, off)
    const diff = angDiff(getSunPosition(jd).longitude, natalSunLon)
    if (diff < bestDiff) {
      bestDiff = diff
      bestJd = jd
    }
  }

  // 二分细化：沿黄道差值单调段逼近（步长逐步折半，共 ~20 次 → 秒级精度）
  let lo = bestJd - 3 / 24
  let hi = bestJd + 3 / 24
  const sign = ((getSunPosition(hi).longitude - getSunPosition(lo).longitude + 540) % 360) - 180
  for (let i = 0; i < 22; i++) {
    const mid = (lo + hi) / 2
    const dMid = ((getSunPosition(mid).longitude - natalSunLon + 540) % 360) - 180
    if (dMid * sign > 0) hi = mid
    else lo = mid
  }
  const jdFinal = (lo + hi) / 2
  return {
    moment: jdToDate(jdFinal),
    residualDeg: angDiff(getSunPosition(jdFinal).longitude, natalSunLon),
  }
}

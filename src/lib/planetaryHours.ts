/**
 * 行星时（Planetary Hours）：古巴比伦/中世纪择时体系。
 * 日出→日落均分 12 个「日间时」，日落→次日日出均分 12 个「夜间时」，
 * 按迦勒底次序（土木火日金水月）轮值，当日第一时的守护星即当日守护星。
 */

/** 迦勒底次序 */
const CHALDEAN = ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon'] as const

export type PlanetKey = (typeof CHALDEAN)[number]

/** 星期几（0=周日）→ 当日守护星 */
const DAY_RULERS: PlanetKey[] = [
  'Sun', // 周日
  'Moon', // 周一
  'Mars', // 周二
  'Mercury', // 周三
  'Jupiter', // 周四
  'Venus', // 周五
  'Saturn', // 周六
]

export function dayRuler(date: Date): PlanetKey {
  return DAY_RULERS[date.getDay()]!
}

/* ---------- 太阳升落（NOAA 简化算法，精度 ±2 分钟） ---------- */
const RAD = Math.PI / 180

function julianDay(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5
}

function sunDeclination(jd: number): number {
  const n = jd - 2451545.0
  const L = (280.46 + 0.9856474 * n) % 360
  const g = (357.528 + 0.9856003 * n) % 360 * RAD
  const lambda = (L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * RAD
  const eps = (23.439 - 0.0000004 * n) * RAD
  return Math.asin(Math.sin(eps) * Math.sin(lambda)) / RAD
}

/** 太阳时角修正（-0.833° 蒙气差） */
function hourAngle(latDeg: number, decDeg: number): number {
  const lat = latDeg * RAD
  const dec = decDeg * RAD
  const cosH = (Math.cos(90.833 * RAD) - Math.sin(lat) * Math.sin(dec)) / (Math.cos(lat) * Math.cos(dec))
  if (cosH > 1) return NaN // 极夜：太阳不升
  if (cosH < -1) return NaN // 极昼：太阳不落
  return Math.acos(cosH) / RAD
}

export interface RiseSet {
  sunrise: Date | null
  sunset: Date | null
}

/** 求某地当天的日出日落（date 取当地中午以减少漂移） */
export function riseSet(date: Date, latitude: number, longitude: number): RiseSet {
  // 用 UTC 正午附近的日期做基准，按经度估算当地正午
  const noon = new Date(date)
  noon.setUTCHours(12 - Math.round(longitude / 15), 0, 0, 0)
  const jd = julianDay(noon)
  const dec = sunDeclination(jd)
  const ha = hourAngle(latitude, dec)
  if (Number.isNaN(ha)) return { sunrise: null, sunset: null }

  // 太阳时角 → 小时差
  const dh = ha / 15
  // 当地太阳正午 ≈ UTC 12:00 - 经度/15 + 时差方程（简化忽略 ≤16min 误差可接受，这里补上）
  const eot = equationOfTime(jd) // 分钟
  const solarNoonUtcMin = 720 - longitude * 4 - eot
  const base = new Date(noon)
  base.setUTCHours(0, solarNoonUtcMin, 0, 0)
  return {
    sunrise: new Date(base.getTime() - dh * 3600000),
    sunset: new Date(base.getTime() + dh * 3600000),
  }
}

/** 时差方程（分钟） */
function equationOfTime(jd: number): number {
  const n = jd - 2451545.0
  const L = (280.46 + 0.9856474 * n) % 360
  const g = (357.528 + 0.9856003 * n) % 360 * RAD
  const lambda = (L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * RAD
  const y = Math.tan((23.439 - 0.0000004 * n) * RAD / 2) ** 2
  return (y * Math.sin(2 * (lambda * RAD)) - 2 * 0.0167 * Math.sin(g)) / RAD * 4
}

/* ---------- 行星时序列 ---------- */
export interface PlanetaryHour {
  index: number // 1-24
  /** true = 日间时 */
  daytime: boolean
  ruler: PlanetKey
  start: Date
  end: Date
  /** 本时辰时长（分钟） */
  minutes: number
}

/**
 * 计算从当日日出开始的 24 行星时。
 * 夜间跨到次日日出；极昼极夜地区返回空数组。
 */
export function planetaryHours(date: Date, latitude: number, longitude: number): PlanetaryHour[] {
  const { sunrise, sunset } = riseSet(date, latitude, longitude)
  const nextRise = riseSet(new Date(date.getTime() + 86400000), latitude, longitude).sunrise
  if (!sunrise || !sunset || !nextRise) return []

  const dayLen = sunset.getTime() - sunrise.getTime()
  const nightLen = nextRise.getTime() - sunset.getTime()
  const dayMs = dayLen / 12
  const nightMs = nightLen / 12

  // 行星日以「当地民用日」为准，取入参日期的星期而非日出时刻的星期
  const ruler0 = DAY_RULERS[date.getDay()]!
  const startIdx = CHALDEAN.indexOf(ruler0)

  const out: PlanetaryHour[] = []
  for (let i = 0; i < 24; i++) {
    const ruler = CHALDEAN[(startIdx + i) % 7]!
    if (i < 12) {
      const start = new Date(sunrise.getTime() + i * dayMs)
      out.push({
        index: i + 1,
        daytime: true,
        ruler,
        start,
        end: new Date(sunrise.getTime() + (i + 1) * dayMs),
        minutes: dayMs / 60000,
      })
    } else {
      const j = i - 12
      const start = new Date(sunset.getTime() + j * nightMs)
      out.push({
        index: i + 1,
        daytime: false,
        ruler,
        start,
        end: new Date(sunset.getTime() + (j + 1) * nightMs),
        minutes: nightMs / 60000,
      })
    }
  }
  return out
}

/** 当前所在的行星时（找不到返回 null） */
export function currentPlanetHour(hours: PlanetaryHour[], now = new Date()): PlanetaryHour | null {
  return hours.find((h) => now >= h.start && now < h.end) ?? null
}

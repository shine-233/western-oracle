import { calculateChart, getMoonPosition, getSunPosition, toJulianDate } from 'celestine'
import { CHART_POINT_KEYS, PATTERNS_CN, PLANETS, SIGNS, planetGlyph } from '../data/corpus'

export const ZODIAC_SIGNS = SIGNS.map((s) => ({ en: s.en, cn: s.cn, glyph: s.glyph }))

export const ELEMENT_CN: Record<string, string> = {
  fire: '火',
  earth: '土',
  air: '风',
  water: '水',
}

export const MODALITY_CN: Record<string, string> = {
  cardinal: '开创',
  fixed: '固定',
  mutable: '变动',
}

export const PLANET_CN: Record<string, string> = Object.fromEntries(
  Object.entries(PLANETS).map(([k, v]) => [k, v.cn]),
)

/** 兼容旧引用：一句话版行星释义（详细版见 data/corpus.ts） */
export const PLANET_MEANINGS: Record<string, string> = Object.fromEntries(
  Object.entries(PLANETS).map(([k, v]) => [k, `${v.cn} —— ${v.detail}`]),
)

const POINT_ORDER = new Map<string, number>(CHART_POINT_KEYS.map((k, i) => [k as string, i]))
const POINT_SET = new Set<string>(CHART_POINT_KEYS)

/** celestine 返回名 → 内部 key */
const NAME_ALIASES: Record<string, string> = {
  'North Node': 'NorthNode',
  'South Node': 'SouthNode',
  'Mean Lilith': 'Lilith',
  'True Lilith': 'Lilith',
}

function normalizeName(raw: string): string {
  return NAME_ALIASES[raw] ?? raw
}

const MAJOR_ASPECT_TYPES = new Set(['conjunction', 'opposition', 'trine', 'square', 'sextile'])

export interface BirthInput {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  /** UTC 偏移小时数，如北京 +8 */
  timezone: number
  latitude: number
  longitude: number
}

export interface ChartPlanet {
  name: string
  cn: string
  glyph: string
  lon: number
  signIndex: number
  signCn: string
  /** "24°23′" */
  degText: string
  house: number
  retro: boolean
}

export interface ChartAspect {
  body1: string
  body2: string
  type: string
  symbol: string
  strength: number
}

export interface ChartPattern {
  type: string
  cn: string
  bodies: string[]
  desc: string
}

export interface NatalChart {
  planets: ChartPlanet[]
  ascendant: { lon: number; text: string }
  midheaven: { lon: number; text: string }
  cusps: number[]
  aspects: ChartAspect[]
  patterns: ChartPattern[]
  elements: Record<string, string[]>
  modalities: Record<string, string[]>
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function toPoint(raw: any): ChartPlanet | null {
  const name = normalizeName(String(raw.name))
  if (!POINT_SET.has(name)) return null
  return {
    name,
    cn: PLANETS[name]?.cn ?? name,
    glyph: planetGlyph(name),
    lon: raw.longitude,
    signIndex: raw.sign as number,
    signCn: SIGNS[raw.sign as number]?.cn ?? raw.signName,
    degText: `${raw.degree}°${String(raw.minute).padStart(2, '0')}′`,
    house: raw.house ?? 0,
    retro: Boolean(raw.isRetrograde),
  }
}

export function computeNatalChart(input: BirthInput): NatalChart {
  const raw = calculateChart({
    year: input.year,
    month: input.month,
    day: input.day,
    hour: input.hour,
    minute: input.minute,
    timezone: input.timezone,
    latitude: input.latitude,
    longitude: input.longitude,
  }) as any

  const byName = new Map<string, ChartPlanet>()
  for (const rp of raw.planets as any[]) {
    const p = toPoint(rp)
    if (p && !byName.has(p.name)) byName.set(p.name, p)
  }
  for (const rn of (raw.nodes ?? []) as any[]) {
    const p = toPoint(rn)
    if (p && !byName.has(p.name)) byName.set(p.name, p)
  }
  for (const rl of (raw.lilith ?? []) as any[]) {
    const p = toPoint(rl)
    if (p && !byName.has(p.name)) byName.set(p.name, p)
  }

  // 由北交点推算缺失的南交点（恒相对 180°）
  const north = byName.get('NorthNode')
  if (north && !byName.has('SouthNode')) {
    const signIdx = (north.signIndex + 6) % 12
    byName.set('SouthNode', {
      ...north,
      name: 'SouthNode',
      cn: PLANETS.SouthNode!.cn,
      glyph: PLANETS.SouthNode!.glyph,
      lon: (north.lon + 180) % 360,
      signIndex: signIdx,
      signCn: SIGNS[signIdx]!.cn,
    })
  }

  const southFinal = byName.get('SouthNode')
  const planets = [...byName.values()]
    .filter((p) => p.name !== 'SouthNode')
    .sort((a, b) => (POINT_ORDER.get(a.name) ?? 99) - (POINT_ORDER.get(b.name) ?? 99))
  if (southFinal && !planets.some((p) => p.name === 'SouthNode')) {
    planets.push(southFinal)
  }

  const aspects: ChartAspect[] = (raw.aspects.all as any[])
    .filter((a) => MAJOR_ASPECT_TYPES.has(a.type) && POINT_SET.has(normalizeName(a.body1)) && POINT_SET.has(normalizeName(a.body2)))
    .map((a) => ({
      body1: normalizeName(a.body1),
      body2: normalizeName(a.body2),
      type: a.type,
      symbol: a.symbol,
      strength: Math.round(a.strength ?? 0),
    }))

  const patterns: ChartPattern[] = ((raw.patterns ?? []) as any[])
    .map((pt) => ({
      type: String(pt.type),
      cn: PATTERNS_CN[String(pt.type)]?.cn ?? String(pt.type),
      bodies: (pt.bodies as string[]).map(normalizeName),
      desc: PATTERNS_CN[String(pt.type)]?.desc ?? String(pt.description ?? ''),
    }))

  return {
    planets,
    ascendant: {
      lon: raw.angles.ascendant.longitude,
      text: `${SIGNS[raw.angles.ascendant.sign as number]?.cn ?? ''} ${raw.angles.ascendant.degree}°`,
    },
    midheaven: {
      lon: raw.angles.midheaven.longitude,
      text: `${SIGNS[raw.angles.midheaven.sign as number]?.cn ?? ''} ${raw.angles.midheaven.degree}°`,
    },
    cusps: (raw.houses.cusps as any[]).map((c) => c.longitude as number),
    aspects,
    patterns,
    elements: raw.summary.elements ?? {},
    modalities: raw.summary.modalities ?? {},
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export const TIMEZONES: Array<{ label: string; value: number }> = [
  { label: 'UTC+8 北京/新加坡', value: 8 },
  { label: 'UTC+9 东京/首尔', value: 9 },
  { label: 'UTC+7 曼谷/河内', value: 7 },
  { label: 'UTC+5:30 新德里', value: 5.5 },
  { label: 'UTC+4 迪拜', value: 4 },
  { label: 'UTC+2 雅典/开罗', value: 2 },
  { label: 'UTC+1 柏林/巴黎', value: 1 },
  { label: 'UTC+0 伦敦', value: 0 },
  { label: 'UTC-4 纽约（夏令时）', value: -4 },
  { label: 'UTC-5 纽约', value: -5 },
  { label: 'UTC-8 洛杉矶', value: -8 },
]

export const CITY_PRESETS: Array<{ city: string; lat: number; lng: number }> = [
  { city: '北京', lat: 39.9042, lng: 116.4074 },
  { city: '上海', lat: 31.2304, lng: 121.4737 },
  { city: '广州', lat: 23.1291, lng: 113.2644 },
  { city: '深圳', lat: 22.5431, lng: 114.0579 },
  { city: '成都', lat: 30.5728, lng: 104.0668 },
  { city: '杭州', lat: 30.2741, lng: 120.1551 },
  { city: '西安', lat: 34.3416, lng: 108.9398 },
  { city: '武汉', lat: 30.5928, lng: 114.3055 },
  { city: '哈尔滨', lat: 45.8038, lng: 126.535 },
  { city: '乌鲁木齐', lat: 43.8256, lng: 87.6168 },
  { city: '香港', lat: 22.3193, lng: 114.1694 },
  { city: '台北', lat: 25.033, lng: 121.5654 },
  { city: '东京', lat: 35.6762, lng: 139.6503 },
  { city: '首尔', lat: 37.5665, lng: 126.978 },
  { city: '新加坡', lat: 1.3521, lng: 103.8198 },
  { city: '伦敦', lat: 51.5074, lng: -0.1278 },
  { city: '巴黎', lat: 48.8566, lng: 2.3522 },
  { city: '柏林', lat: 52.52, lng: 13.405 },
  { city: '纽约', lat: 40.7128, lng: -74.006 },
  { city: '洛杉矶', lat: 34.0522, lng: -118.2437 },
  { city: '悉尼', lat: -33.8688, lng: 151.2093 },
]

/* ---------- 合盘 / 行运共用：两组星体的交叉相位 ---------- */

const CROSS_ORBS: Record<string, number> = {
  conjunction: 8,
  opposition: 6,
  trine: 6,
  square: 6,
  sextile: 4,
}

const ASPECT_ANGLES: Record<string, number> = {
  conjunction: 0,
  sextile: 60,
  square: 90,
  trine: 120,
  opposition: 180,
}

export const ASPECT_CN: Record<string, string> = {
  conjunction: '合相',
  sextile: '六合',
  square: '刑相',
  trine: '拱相',
  opposition: '冲相',
}

export const ASPECT_SYMBOL: Record<string, string> = {
  conjunction: '☌',
  sextile: '⚹',
  square: '□',
  trine: '△',
  opposition: '☍',
}

export interface CrossAspect {
  body1: string
  body2: string
  type: string
  /** 与精确相位的偏差（度） */
  orb: number
}

/**
 * 计算 A 组星体与 B 组星体之间的主要相位（合盘/行运）。
 * 返回按 orb（紧密程度）升序排列。
 */
export function crossAspects(a: ChartPlanet[], b: ChartPlanet[]): CrossAspect[] {
  const out: CrossAspect[] = []
  for (const p1 of a) {
    for (const p2 of b) {
      let sep = Math.abs(p1.lon - p2.lon) % 360
      if (sep > 180) sep = 360 - sep
      for (const [type, angle] of Object.entries(ASPECT_ANGLES)) {
        const orb = Math.abs(sep - angle)
        if (orb <= CROSS_ORBS[type]!) {
          out.push({ body1: p1.name, body2: p2.name, type, orb: Math.round(orb * 100) / 100 })
          break
        }
      }
    }
  }
  return out.sort((x, y) => x.orb - y.orb)
}

/* ---------- 月相 ---------- */

export interface MoonPhaseInfo {
  /** 0-7：新月→蛾眉月→上弦→盈凸→满月→亏凸→下弦→残月 */
  index: number
  name: string
  emoji: string
  desc: string
}

const PHASES: Array<{ name: string; emoji: string; desc: string }> = [
  { name: '新月', emoji: '🌑', desc: '适合播种愿望、开启新计划的日子。' },
  { name: '蛾眉月', emoji: '🌒', desc: '行动力萌芽，迈出第一步吧。' },
  { name: '上弦月', emoji: '🌓', desc: '遇到阻力的考验期，坚持就是胜利。' },
  { name: '盈凸月', emoji: '🌔', desc: '成果渐渐丰满，调整细节冲刺。' },
  { name: '满月', emoji: '🌕', desc: '能量顶点，适合庆祝、感恩与释放。' },
  { name: '亏凸月', emoji: '🌖', desc: '开始做减法，把收获消化成智慧。' },
  { name: '下弦月', emoji: '🌗', desc: '断舍离的好时机，放下不再需要的。' },
  { name: '残月', emoji: '🌘', desc: '静养休整，为新周期积蓄力量。' },
]

/** 计算给定时刻的月相（默认当前） */
export function moonPhase(date = new Date()): MoonPhaseInfo {
  const jd = toJulianDate({
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hour: date.getHours(),
    minute: date.getMinutes(),
    second: 0,
  })
  return moonPhaseFromJD(jd)
}

function moonPhaseFromJD(jd: number): MoonPhaseInfo {
  const sun = getSunPosition(jd)
  const moon = getMoonPosition(jd)
  const elong = (((moon.longitude - sun.longitude) % 360) + 360) % 360
  const index = Math.floor(elong / 45) % 8
  return { index, ...PHASES[index]! }
}

export interface NextMoonPhaseInfo {
  /** 下一个月相 0-7 */
  index: number
  name: string
  emoji: string
  /** 距下一个月相的约天数（朔望月均分估算） */
  days: number
}

const SYNODIC_MONTH = 29.530588853

/** 距下一个月相还有多久（默认当前时刻） */
export function nextMoonPhase(date = new Date()): NextMoonPhaseInfo {
  const jd = toJulianDate({
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hour: date.getHours(),
    minute: date.getMinutes(),
    second: 0,
  })
  const sun = getSunPosition(jd)
  const moon = getMoonPosition(jd)
  const elong = (((moon.longitude - sun.longitude) % 360) + 360) % 360
  const curIndex = Math.floor(elong / 45) % 8
  const degToBoundary = ((curIndex + 1) * 45 - elong) % 360
  const days = Math.max(0, (degToBoundary / 360) * SYNODIC_MONTH)
  const nextIndex = (curIndex + 1) % 8
  const p = PHASES[nextIndex]!
  return { index: nextIndex, name: p.name, emoji: p.emoji, days }
}

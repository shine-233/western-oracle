import { calculateChart } from 'celestine'

export const ZODIAC_SIGNS = [
  { en: 'Aries', cn: '白羊座', glyph: '♈' },
  { en: 'Taurus', cn: '金牛座', glyph: '♉' },
  { en: 'Gemini', cn: '双子座', glyph: '♊' },
  { en: 'Cancer', cn: '巨蟹座', glyph: '♋' },
  { en: 'Leo', cn: '狮子座', glyph: '♌' },
  { en: 'Virgo', cn: '处女座', glyph: '♍' },
  { en: 'Libra', cn: '天秤座', glyph: '♎' },
  { en: 'Scorpio', cn: '天蝎座', glyph: '♏' },
  { en: 'Sagittarius', cn: '射手座', glyph: '♐' },
  { en: 'Capricorn', cn: '摩羯座', glyph: '♑' },
  { en: 'Aquarius', cn: '水瓶座', glyph: '♒' },
  { en: 'Pisces', cn: '双鱼座', glyph: '♓' },
] as const

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

const PLANET_GLYPHS: Record<string, string> = {
  Sun: '☉', Moon: '☽', Mercury: '☿', Venus: '♀', Mars: '♂',
  Jupiter: '♃', Saturn: '♄', Uranus: '♅', Neptune: '♆', Pluto: '♇',
}

/** 默认展示的十大星体 */
const MAIN_PLANETS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto']

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
  glyph: string
  lon: number
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

export interface NatalChart {
  planets: ChartPlanet[]
  ascendant: { lon: number; text: string }
  midheaven: { lon: number; text: string }
  cusps: number[]
  aspects: ChartAspect[]
  elements: Record<string, string[]>
  modalities: Record<string, string[]>
}

/* eslint-disable @typescript-eslint/no-explicit-any */
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

  const planets: ChartPlanet[] = (raw.planets as any[])
    .filter((p) => MAIN_PLANETS.includes(p.name))
    .map((p) => ({
      name: p.name,
      glyph: PLANET_GLYPHS[p.name] ?? p.name[0]!,
      lon: p.longitude,
      signCn: ZODIAC_SIGNS[p.sign as number]?.cn ?? p.signName,
      degText: `${p.degree}°${String(p.minute).padStart(2, '0')}′`,
      house: p.house ?? 0,
      retro: Boolean(p.isRetrograde),
    }))

  const aspects: ChartAspect[] = (raw.aspects.all as any[])
    .filter((a) => MAJOR_ASPECT_TYPES.has(a.type) && MAIN_PLANETS.includes(a.body1) && MAIN_PLANETS.includes(a.body2))
    .map((a) => ({
      body1: a.body1,
      body2: a.body2,
      type: a.type,
      symbol: a.symbol,
      strength: Math.round(a.strength ?? 0),
    }))

  return {
    planets,
    ascendant: {
      lon: raw.angles.ascendant.longitude,
      text: `${ZODIAC_SIGNS[raw.angles.ascendant.sign as number]?.cn ?? ''} ${raw.angles.ascendant.degree}°`,
    },
    midheaven: {
      lon: raw.angles.midheaven.longitude,
      text: `${ZODIAC_SIGNS[raw.angles.midheaven.sign as number]?.cn ?? ''} ${raw.angles.midheaven.degree}°`,
    },
    cusps: (raw.houses.cusps as any[]).map((c) => c.longitude as number),
    aspects,
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

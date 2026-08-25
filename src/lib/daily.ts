/** 今日星历：星期守护星 + 月相宜忌 + 幸运色/幸运数（按日期确定，纯本地） */
import { moonPhase } from './astrology'

export interface Almanac {
  /** 星期守护星内部键，如 'Sun' */
  rulerKey: string
  rulerLine: string
  doText: string
  doEn: string
  dontText: string
  dontEn: string
  luckyColor: { cn: string; en: string; hex: string }
  luckyNumber: number
}

const WEEK_RULER = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'] as const

const RULER_DOMAIN: Record<string, [string, string]> = {
  Sun: ['自信与表达的好日子', 'confidence & self-expression'],
  Moon: ['照顾情绪与家人', 'tending feelings & family'],
  Mars: ['开动身体与竞争心', 'body, courage & competition'],
  Mercury: ['学习、签约与沟通', 'study, contracts & chat'],
  Jupiter: ['扩张视野与大决定', 'growth & big-picture calls'],
  Venus: ['美、爱与人情往来', 'beauty, love & social grace'],
  Saturn: ['整理、收尾与自律', 'order, deadlines & discipline'],
}

const PHASE_DO: [string, string][] = [
  ['播种愿望、写下新计划', 'plant wishes; write new plans'],
  ['迈出第一步', 'take the first step'],
  ['正面硬刚卡点', 'face blockers head-on'],
  ['打磨细节、推进冲刺', 'polish details; push forward'],
  ['庆祝、感恩与分享', 'celebrate, thank & share'],
  ['复盘收获、消化经验', 'review gains; digest lessons'],
  ['断舍离、结束拖延事项', 'declutter; close loose ends'],
  ['休息、冥想、早点睡', 'rest, meditate, sleep early'],
]

const PHASE_DONT: [string, string][] = [
  ['仓促启动重大承诺', 'rushing major commitments'],
  ['贪多求快摊大饼', 'overloading the plate'],
  ['意气用事硬碰硬', 'butting heads out of pride'],
  ['过度完美主义内耗', 'perfectionist spirals'],
  ['情绪上头做决定', 'deciding while euphoric'],
  ['翻旧账自我否定', 're-litigating old wounds'],
  ['强行挽留将逝之物', 'clinging to what\'s leaving'],
  ['熬夜刷屏透支自己', 'late-night doomscrolling'],
]

const COLORS: Array<{ cn: string; en: string; hex: string }> = [
  { cn: '星光金', en: 'Starlight Gold', hex: '#f5c86e' },
  { cn: '月尘紫', en: 'Moondust Violet', hex: '#b3a6f7' },
  { cn: '玫瑰粉', en: 'Rose Quartz', hex: '#ff9fce' },
  { cn: '极光绿', en: 'Aurora Mint', hex: '#7de8c3' },
  { cn: '暮空蓝', en: 'Dusk Blue', hex: '#a9c4e8' },
  { cn: '落日橙', en: 'Sunset Amber', hex: '#ffb37a' },
  { cn: '午夜墨', en: 'Midnight Ink', hex: '#8f8ac2' },
]

export function todayAlmanac(date = new Date()): Almanac {
  const rulerKey = WEEK_RULER[date.getDay()]!
  const domain = RULER_DOMAIN[rulerKey]!
  const phase = moonPhase(date)

  // 稳定伪随机：日期哈希选色选数
  const key = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate()
  let h = (key ^ 0x5f356495) >>> 0
  h = Math.imul(h ^ (h >>> 13), 0x27d4eb2d) >>> 0
  const color = COLORS[h % COLORS.length]!
  const luckyNumber = ((h >>> 8) % 9) + 1

  return {
    rulerKey,
    rulerLine: `${domain[0]}｜${domain[1]}`,
    doText: PHASE_DO[phase.index]![0],
    doEn: PHASE_DO[phase.index]![1],
    dontText: PHASE_DONT[phase.index]![0],
    dontEn: PHASE_DONT[phase.index]![1],
    luckyColor: color,
    luckyNumber,
  }
}

export { RULER_DOMAIN as ALMANAC_RULER_DOMAIN }

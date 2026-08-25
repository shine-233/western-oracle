/**
 * 占卜结果 → 学徒情绪 的统一换算。
 * 各模块把自己的数据压成 0-100 分，这里映射到四档情绪；
 * ApprenticeReact 组件据此让对应的学徒现场点评。
 */
import type { MoodKey } from '../data/apprenticeProfiles'

export function moodFromScore(score: number): MoodKey {
  if (score >= 78) return 'great'
  if (score >= 55) return 'good'
  if (score >= 35) return 'meh'
  return 'oops'
}

/** 模块 → 当值学徒 */
export const MODULE_APPRENTICE: Record<string, string> = {
  tarot: 'cat',
  astrology: 'owl',
  numerology: 'numi',
  runes: 'golem',
  synastry: 'twins',
  transits: 'comet',
}

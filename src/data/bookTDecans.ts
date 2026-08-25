/**
 * Golden Dawn《Book T – The Tarot》(约1892, 公版) 三十六旬对应表：
 * 星座十度区间 × Chaldean 守护 × 塔罗小牌 × GD 称号。
 * 由 research/pipeline 程序化生成（Chaldean 序列 + 锚点校验），请勿手改。
 */
export interface DecanInfo {
  sign: string
  decan: number
  fromDegree: number
  toDegree: number
  ruler: string
  gdTitle: string
}

export const BOOK_T_DECANS: Record<string, DecanInfo> = {
  'wands-2': { sign: 'Aries', decan: 1, fromDegree: 0, toDegree: 10, ruler: 'Mars', gdTitle: 'Lord of Dominion' },
  'wands-3': { sign: 'Aries', decan: 2, fromDegree: 10, toDegree: 20, ruler: 'Sun', gdTitle: 'Lord of Established Strength' },
  'wands-4': { sign: 'Aries', decan: 3, fromDegree: 20, toDegree: 30, ruler: 'Venus', gdTitle: 'Lord of Perfected Work' },
  'pentacles-5': { sign: 'Taurus', decan: 1, fromDegree: 0, toDegree: 10, ruler: 'Mercury', gdTitle: 'Lord of Material Trouble' },
  'pentacles-6': { sign: 'Taurus', decan: 2, fromDegree: 10, toDegree: 20, ruler: 'Moon', gdTitle: 'Lord of Material Success' },
  'pentacles-7': { sign: 'Taurus', decan: 3, fromDegree: 20, toDegree: 30, ruler: 'Saturn', gdTitle: 'Lord of Success Unfulfilled' },
  'swords-8': { sign: 'Gemini', decan: 1, fromDegree: 0, toDegree: 10, ruler: 'Jupiter', gdTitle: 'Lord of Shortened Force' },
  'swords-9': { sign: 'Gemini', decan: 2, fromDegree: 10, toDegree: 20, ruler: 'Mars', gdTitle: 'Lord of Despair and Cruelty' },
  'swords-10': { sign: 'Gemini', decan: 3, fromDegree: 20, toDegree: 30, ruler: 'Sun', gdTitle: 'Lord of Ruin' },
  'cups-2': { sign: 'Cancer', decan: 1, fromDegree: 0, toDegree: 10, ruler: 'Venus', gdTitle: 'Lord of Love' },
  'cups-3': { sign: 'Cancer', decan: 2, fromDegree: 10, toDegree: 20, ruler: 'Mercury', gdTitle: 'Lord of Abundance' },
  'cups-4': { sign: 'Cancer', decan: 3, fromDegree: 20, toDegree: 30, ruler: 'Moon', gdTitle: 'Lord of Luxury' },
  'wands-5': { sign: 'Leo', decan: 1, fromDegree: 0, toDegree: 10, ruler: 'Saturn', gdTitle: 'Lord of Strife' },
  'wands-6': { sign: 'Leo', decan: 2, fromDegree: 10, toDegree: 20, ruler: 'Jupiter', gdTitle: 'Lord of Victory' },
  'wands-7': { sign: 'Leo', decan: 3, fromDegree: 20, toDegree: 30, ruler: 'Mars', gdTitle: 'Lord of Valour' },
  'pentacles-8': { sign: 'Virgo', decan: 1, fromDegree: 0, toDegree: 10, ruler: 'Sun', gdTitle: 'Lord of Prudence' },
  'pentacles-9': { sign: 'Virgo', decan: 2, fromDegree: 10, toDegree: 20, ruler: 'Venus', gdTitle: 'Lord of Material Gain' },
  'pentacles-10': { sign: 'Virgo', decan: 3, fromDegree: 20, toDegree: 30, ruler: 'Mercury', gdTitle: 'Lord of Wealth' },
  'swords-2': { sign: 'Libra', decan: 1, fromDegree: 0, toDegree: 10, ruler: 'Moon', gdTitle: 'Lord of Peace Restored' },
  'swords-3': { sign: 'Libra', decan: 2, fromDegree: 10, toDegree: 20, ruler: 'Saturn', gdTitle: 'Lord of Sorrow' },
  'swords-4': { sign: 'Libra', decan: 3, fromDegree: 20, toDegree: 30, ruler: 'Jupiter', gdTitle: 'Lord of Rest from Strife' },
  'cups-5': { sign: 'Scorpio', decan: 1, fromDegree: 0, toDegree: 10, ruler: 'Mars', gdTitle: 'Lord of Disappointment' },
  'cups-6': { sign: 'Scorpio', decan: 2, fromDegree: 10, toDegree: 20, ruler: 'Sun', gdTitle: 'Lord of Pleasure' },
  'cups-7': { sign: 'Scorpio', decan: 3, fromDegree: 20, toDegree: 30, ruler: 'Venus', gdTitle: 'Lord of Illusionary Success' },
  'wands-8': { sign: 'Sagittarius', decan: 1, fromDegree: 0, toDegree: 10, ruler: 'Mercury', gdTitle: 'Lord of Swiftness' },
  'wands-9': { sign: 'Sagittarius', decan: 2, fromDegree: 10, toDegree: 20, ruler: 'Moon', gdTitle: 'Lord of Great Strength' },
  'wands-10': { sign: 'Sagittarius', decan: 3, fromDegree: 20, toDegree: 30, ruler: 'Saturn', gdTitle: 'Lord of Oppression' },
  'pentacles-2': { sign: 'Capricorn', decan: 1, fromDegree: 0, toDegree: 10, ruler: 'Jupiter', gdTitle: 'Lord of Harmonious Change' },
  'pentacles-3': { sign: 'Capricorn', decan: 2, fromDegree: 10, toDegree: 20, ruler: 'Mars', gdTitle: 'Lord of Material Works' },
  'pentacles-4': { sign: 'Capricorn', decan: 3, fromDegree: 20, toDegree: 30, ruler: 'Sun', gdTitle: 'Lord of Earthly Power' },
  'swords-5': { sign: 'Aquarius', decan: 1, fromDegree: 0, toDegree: 10, ruler: 'Venus', gdTitle: 'Lord of Defeat' },
  'swords-6': { sign: 'Aquarius', decan: 2, fromDegree: 10, toDegree: 20, ruler: 'Mercury', gdTitle: 'Lord of Earned Success' },
  'swords-7': { sign: 'Aquarius', decan: 3, fromDegree: 20, toDegree: 30, ruler: 'Moon', gdTitle: 'Lord of Unstable Effort' },
  'cups-8': { sign: 'Pisces', decan: 1, fromDegree: 0, toDegree: 10, ruler: 'Saturn', gdTitle: 'Lord of Indolence' },
  'cups-9': { sign: 'Pisces', decan: 2, fromDegree: 10, toDegree: 20, ruler: 'Jupiter', gdTitle: 'Lord of Material Happiness' },
  'cups-10': { sign: 'Pisces', decan: 3, fromDegree: 20, toDegree: 30, ruler: 'Mars', gdTitle: 'Lord of Perpetual Success' },
}

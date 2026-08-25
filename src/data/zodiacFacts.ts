/**
 * 黄道事实层（dariusk/corpora zodiac.json, CC0）：
 * 黄经区间/元素/古典与现代守护/符号/日期/关键词。
 * 古典守护列已与本仓库 Tetrabiblos 庙宫表交叉验证一致。自动生成，请勿手改。
 */
export interface ZodiacFact {
  sign: string
  longitudeStart: number
  longitudeEnd: number
  element: string
  rulerClassic: string
  rulerModern: string
  unicodeSymbol: string
  gloss: string
  approximateDates: string
  keywords: string[]
}

export const ZODIAC_FACTS: Record<string, ZodiacFact> = {
  'Aries': { sign: 'Aries', longitudeStart: 0.0, longitudeEnd: 30.0, element: 'Fire', rulerClassic: 'Mars', rulerModern: 'Mars', unicodeSymbol: '♈', gloss: 'The Ram', approximateDates: '21 March - 20 April', keywords: ['driven', 'idealistic', 'aggressive'] },
  'Taurus': { sign: 'Taurus', longitudeStart: 30.0, longitudeEnd: 60.0, element: 'Earth', rulerClassic: 'Venus', rulerModern: 'Earth', unicodeSymbol: '♉', gloss: 'The Bull', approximateDates: '21 April - 21 May', keywords: ['resolute', 'sensual', 'indulgent'] },
  'Gemini': { sign: 'Gemini', longitudeStart: 60.0, longitudeEnd: 90.0, element: 'Air', rulerClassic: 'Mercury', rulerModern: 'Mercury', unicodeSymbol: '♊', gloss: 'The Twins', approximateDates: '22 May - 21 June', keywords: ['playful', 'curious', 'two-faced'] },
  'Cancer': { sign: 'Cancer', longitudeStart: 90.0, longitudeEnd: 120.0, element: 'Water', rulerClassic: 'Moon', rulerModern: 'Moon', unicodeSymbol: '♋', gloss: 'The Crab', approximateDates: '22 June - 23 July', keywords: ['nurturing', 'snobby', 'petty'] },
  'Leo': { sign: 'Leo', longitudeStart: 120.0, longitudeEnd: 150.0, element: 'Fire', rulerClassic: 'Sun', rulerModern: 'Sun', unicodeSymbol: '♌', gloss: 'The Lion', approximateDates: '24 July - 23 August', keywords: ['fierce', 'opulent', 'narcissistic'] },
  'Virgo': { sign: 'Virgo', longitudeStart: 150.0, longitudeEnd: 180.0, element: 'Earth', rulerClassic: 'Mercury', rulerModern: 'Ceres', unicodeSymbol: '♍', gloss: 'The Maiden', approximateDates: '24 August - 23 September', keywords: ['meticulous', 'helpful', 'naive'] },
  'Libra': { sign: 'Libra', longitudeStart: 180.0, longitudeEnd: 210.0, element: 'Air', rulerClassic: 'Venus', rulerModern: 'Venus', unicodeSymbol: '♎', gloss: 'The Scales', approximateDates: '24 September - 23 October', keywords: ['balanced', 'chatty', 'indecisive'] },
  'Scorpio': { sign: 'Scorpio', longitudeStart: 210.0, longitudeEnd: 240.0, element: 'Water', rulerClassic: 'Mars', rulerModern: 'Pluto', unicodeSymbol: '♏', gloss: 'The Scorpion', approximateDates: '24 October - 22 November', keywords: ['deep', 'magnetic', 'destructive'] },
  'Sagittarius': { sign: 'Sagittarius', longitudeStart: 240.0, longitudeEnd: 270.0, element: 'Fire', rulerClassic: 'Jupiter', rulerModern: 'Jupiter', unicodeSymbol: '♐', gloss: 'The Archer', approximateDates: '23 November - 21 December', keywords: ['ambitious', 'daring', 'coarse'] },
  'Capricorn': { sign: 'Capricorn', longitudeStart: 270.0, longitudeEnd: 300.0, element: 'Earth', rulerClassic: 'Saturn', rulerModern: 'Saturn', unicodeSymbol: '♑', gloss: 'The Mountain Sea-goat', approximateDates: '22 December - 20 January', keywords: ['responsible', 'awkward', 'rigid'] },
  'Aquarius': { sign: 'Aquarius', longitudeStart: 300.0, longitudeEnd: 330.0, element: 'Air', rulerClassic: 'Saturn', rulerModern: 'Uranus', unicodeSymbol: '♒', gloss: 'The Water-bearer', approximateDates: '21 January - 19 February', keywords: ['inventive', 'zany', 'erratic'] },
  'Pisces': { sign: 'Pisces', longitudeStart: 330.0, longitudeEnd: 360.0, element: 'Water', rulerClassic: 'Jupiter', rulerModern: 'Neptune', unicodeSymbol: '♓', gloss: 'The Fish', approximateDates: '20 February - 20 March', keywords: ['artistic', 'sentimental', 'dependent'] },
}

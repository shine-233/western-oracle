/**
 * 太阳回归（Solar Return）：太阳每年回到出生时黄经的那一瞬间，
 * 被视为「这一年的年度盘」起点。本模块只负责找时刻，排盘复用 astrology.ts。
 */
import { getSunPosition, toJulianDate } from 'celestine'
import { locale } from './i18n'

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

/* ---------- 回归上升落本命宫位：一年剧本的开场方式（深化解读） ---------- */
const SR_ASC_NOTES: string[][] = [
  ['开场即主角：这一年你走到哪都被看见，适合立人设、定基调——第一印象会跟上一整年。', 'You open center stage: people notice you wherever you go. Set the tone early — first impressions stick for twelve months.'],
  ['开场是钱袋：安全感的锚在现金流，先理财再谈梦，大件消费放到下半年更稳。', 'The year opens through your wallet: stability starts with cash flow. Secure finances first; leave big purchases for the second half.'],
  ['开场是话匣：消息、短途和学习任务排队进门，机会藏在信息流里，嘴和日程都灵活点。', 'It opens as a buzz of messages, errands and courses. Opportunities ride in on news — stay nimble with words and schedules.'],
  ['开场是家门：安家、家人或内心课题打头阵，先把根扎稳，外面的事才推得动。', 'It opens at the home front: family and inner foundations demand attention first. Anchor down, then push outward.'],
  ['开场是心动：恋爱、创作和玩乐提前点亮全年，认真去玩的人今年运气不差。', 'It opens with sparks: romance, creativity and play light up early. Take fun seriously — it pays this year.'],
  ['开场是日常：工作流程与健康习惯被点名，把日子过规律本身就是今年的主任务。', 'It opens with routine: work systems and health habits take the stage. Living regularly IS this year\'s main quest.'],
  ['开场是对面：伴侣、搭档或对手先行登场，关系定义这一年——选对人比使劲努力更重要。', 'It opens face-to-face: partners, allies or rivals arrive first. Relationships define the year — choosing well beats trying hard.'],
  ['开场是深水：共同财务与信任议题开局，敢把话聊透的人拿到深度绑定的红利。', 'It opens in deep water: shared finances and trust come up first. Whoever dares to go deep reaps the binding rewards.'],
  ['开场是远方：留学、出版、长途旅行或信仰议题领跑，视野撑多大，人就长多大。', 'It opens toward the horizon: study, publishing, long journeys or beliefs lead off. You grow as wide as your view.'],
  ['开场是聚光灯：事业与声望的剧情前置，年初的曝光度决定全年的天花板。', 'It opens under the spotlight: career and reputation take the front seat. How visible you are early sets this year\'s ceiling.'],
  ['开场是人群：社群与老友先来敲门，在抱团与独立之间找平衡，是今年的必修课。', 'It opens among people: communities and old friends knock first. Leaning on the circle without dissolving into it — that\'s the art.'],
  ['开场是幕后：先退半步观察与休整，独处攒下的力气会在年底一次性兑现。', 'It opens backstage: step back, observe, recharge. Power saved in solitude cashes out big by year-end.'],
]

/** 回归上升落本命第 n 宫的深化一句（按当前语言） */
export function srAscNoteText(house: number): string {
  const pair = SR_ASC_NOTES[(house - 1 + 12) % 12]
  if (!pair) return ''
  return locale.value === 'zh' ? pair[0]! : pair[1]!
}

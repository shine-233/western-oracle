/** 奇趣占卜坊：占卜骰子 · 命运转盘 · 德尔斐神谕签筒。数据与文案自包含，纯本地。 */
import { locale } from '../lib/i18n'

export function L(pair: [string, string]): string {
  return locale.value === 'zh' ? pair[0] : pair[1]
}

/* ================= 占卜骰子 ================= */

export interface DieFace {
  /** 骰面符号 */
  glyph: string
  zh: string
  en: string
  /** 组合句里的角色描述 */
  zhRole: string
  enRole: string
}

/** 行星骰：六面 */
export const PLANET_FACES: DieFace[] = [
  { glyph: '☉', zh: '太阳', en: 'Sun', zhRole: '由你主导、站到台前', enRole: 'lead it in the open' },
  { glyph: '☽', zh: '月亮', en: 'Moon', zhRole: '跟着感觉走，照顾情绪', enRole: 'follow feeling, tend moods' },
  { glyph: '☿', zh: '水星', en: 'Mercury', zhRole: '多问多聊，把话说开', enRole: 'talk it out, ask around' },
  { glyph: '♀', zh: '金星', en: 'Venus', zhRole: '带上审美和人情味', enRole: 'bring taste and warmth' },
  { glyph: '♂', zh: '火星', en: 'Mars', zhRole: '直接动手，别磨叽', enRole: 'act fast, no dithering' },
  { glyph: '♃', zh: '木星', en: 'Jupiter', zhRole: '往大了想，机会在扩张', enRole: 'think big, odds are expanding' },
]

/** 领域骰：六面 */
export const REALM_FACES: DieFace[] = [
  { glyph: '♥', zh: '感情', en: 'Love', zhRole: '感情的事', enRole: 'matters of the heart' },
  { glyph: '💰', zh: '钱财', en: 'Money', zhRole: '钱袋的事', enRole: 'money matters' },
  { glyph: '💼', zh: '事业', en: 'Career', zhRole: '工作与事业', enRole: 'work and career' },
  { glyph: '🌱', zh: '健康', en: 'Health', zhRole: '身体和精力', enRole: 'body and energy' },
  { glyph: '📚', zh: '学习', en: 'Study', zhRole: '学习和输入', enRole: 'study and input' },
  { glyph: '🧭', zh: '出行', en: 'Travel', zhRole: '出门与远行', enRole: 'trips and getting around' },
]

/** 拼组合解读句 */
export function diceReading(p: DieFace, r: DieFace): string {
  if (locale.value === 'zh') return `掷出「${p.zh} × ${r.zh}」：${r.zhRole}，接下来适合${p.zhRole}。`
  return `You rolled “${p.en} × ${r.en}”: with ${r.enRole}, the move is to ${p.enRole}.`
}

/* ================= 命运转盘 ================= */

export interface WheelSector {
  emoji: string
  zh: string
  en: string
  zhLine: string
  enLine: string
  color: string
}

export const WHEEL_SECTORS: WheelSector[] = [
  { emoji: '🌟', zh: '大吉', en: 'Great Luck', zhLine: '今天宇宙手滑，把好东西多塞了你一份。收好，别声张。', enLine: 'The universe overpaid you today. Pocket it quietly.', color: '#f5c86e' },
  { emoji: '💗', zh: '桃花', en: 'Romance', zhLine: '有人的目光在你身上多停了一秒。抬头，别装没看见。', enLine: "Someone's gaze lingered a second too long. Look up — don't pretend you missed it.", color: '#ff9fce' },
  { emoji: '🪙', zh: '财气', en: 'Fortune', zhLine: '小财在路上了：一笔进账、一个折扣、或者口袋里翻出的十块钱。', enLine: 'Small money inbound: a payment, a discount, or a bill forgotten in a pocket.', color: '#7de8c3' },
  { emoji: '🌀', zh: '变动', en: 'Change', zhLine: '有个计划该改道了。不是失败，是导航重新规划路线。', enLine: 'A plan wants rerouting. Not failure — just GPS doing its job.', color: '#a9c4e8' },
  { emoji: '🤝', zh: '贵人', en: 'Helper', zhLine: '今天开口求助的成功率比平时高。那个一直想找的人，去找吧。', enLine: 'Asking for help works unusually well today. Go find that person you keep meaning to ask.', color: '#b3a6f7' },
  { emoji: '📖', zh: '学习', en: 'Insight', zhLine: '有个困惑会突然"啊——"地通。准备好纸笔或备忘录。', enLine: 'A confusion is about to click into place. Keep notes ready.', color: '#8fd0ff' },
  { emoji: '🛌', zh: '休整', en: 'Rest', zhLine: '轮盘让你躺就躺一会儿。这不是偷懒，是充电，充的是你的电。', enLine: 'The wheel says lie down. That is not laziness; that is charging your own battery.', color: '#c9b8ff' },
  { emoji: '⚔️', zh: '考验', en: 'Trial', zhLine: '会有一件小事不顺。它只负责试音，不负责定调，别加戏。', enLine: 'One small thing will snag. It tests the waters; it does not decide the weather.', color: '#ffb37a' },
]

/* ================= 神谕签筒（德尔斐 Cleromancy 抽签） ================= */

export type FortuneRank = 'blessed' | 'favored' | 'quiet' | 'turning'

export const RANK_CN: Record<FortuneRank, string> = {
  blessed: '星佑',
  favored: '眷顾',
  quiet: '静好',
  turning: '逆转',
}

export interface OracleSlip {
  rank: FortuneRank
  zhPoem: string
  enPoem: string
  zhAdvice: string
  enAdvice: string
  lucky: string
}

export const ORACLE_POOL: OracleSlip[] = [
  { rank: 'blessed', zhPoem: '云开月正明，何须问路程', enPoem: 'Clouds part, moonlight pours — no need to ask the way', zhAdvice: '等的那件事有动静了，主动推一把就成了。', enAdvice: 'The thing you wait on stirs. One push from you settles it.', lucky: '东南方 · 下午茶时间' },
  { rank: 'blessed', zhPoem: '春水初生时，行舟自不迟', enPoem: 'Spring rivers rise; boats sail unforced', zhAdvice: '顺势而为的一天，别人递来的台阶可以上。', enAdvice: 'Go with the flow today; take the step someone offers.' , lucky: '东方 · 清晨' },
  { rank: 'favored', zhPoem: '静水流千里，深潭藏大鱼', enPoem: 'Still water travels far; deep pools hide big fish', zhAdvice: '少说多做，今天的运气藏在低调里。', enAdvice: 'Talk less, do more — luck hides in low profile today.', lucky: '北方 · 黄昏' },
  { rank: 'favored', zhPoem: '旧枝发新芽，回望笑此花', enPoem: 'Old branch buds anew; you will smile at this bloom', zhAdvice: '翻出一件半途而废的事，捡起来，这次能成。', enAdvice: 'Pick one abandoned project back up. This time it takes.', lucky: '西方 · 午后' },
  { rank: 'quiet', zhPoem: '薄雾锁山径，缓步亦可行', enPoem: 'Mist locks the path; slow steps still arrive', zhAdvice: '急事放缓，缓事做细。傍晚之后运势回升。', enAdvice: 'Slow the urgent, refine the slow. Luck climbs after dusk.', lucky: '南方 · 夜里' },
  { rank: 'quiet', zhPoem: '灯下影成双，茶凉再续汤', enPoem: 'Lamplight doubles your shadow; refill the cooled tea', zhAdvice: '今天适合收尾不适合开局，把手头的事清一清。', enAdvice: 'Close loops rather than open new ones today.', lucky: '家中 · 任意时刻' },
  { rank: 'turning', zhPoem: '风紧莫扬帆，系舟自安然', enPoem: 'When wind bites, tie the sail; anchored, all is well', zhAdvice: '所谓逆转，只是今天不宜硬来。躲开争执，明天就是转机。', enAdvice: '"Ill" only means do not force it today. Dodge arguments; tomorrow turns.', lucky: '原地 · 睡个好觉' },
]

/** 加权抽签：大吉稍稀有，凶转吉最少见 */
const ORACLE_WEIGHTS = [2, 2.4, 3, 2.6, 3, 2.5, 1.2]

export function drawOracleSlip(): OracleSlip {
  const total = ORACLE_WEIGHTS.reduce((s, w) => s + w, 0)
  let roll = Math.random() * total
  for (let i = 0; i < ORACLE_POOL.length; i++) {
    roll -= ORACLE_WEIGHTS[i]!
    if (roll <= 0) return ORACLE_POOL[i]!
  }
  return ORACLE_POOL[ORACLE_POOL.length - 1]!
}

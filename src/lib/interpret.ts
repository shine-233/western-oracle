/**
 * 本地规则解读引擎：合盘 / 行运的纯本地文案生成，不依赖 AI。
 * 文案 = 星体对主题 + 相位性质收尾，保证任何组合都有可读的成段解读。
 */
import { ASPECTS, PLANETS } from '../data/corpus'
import { ASPECT_CN, crossAspects, moonPhase, type CrossAspect, type NatalChart } from './astrology'

/* ---------------- 基础工具 ---------------- */

type Kind = 'luminary' | 'personal' | 'social' | 'generational' | 'point'

function kindOf(name: string): Kind {
  return (PLANETS[name]?.kind ?? 'personal') as Kind
}

/** 星体对主题库（键为两个 name 排序后用 | 连接） */
const PAIR_TOPICS: Record<string, string> = {
  'Moon|Sun': '太阳与月亮的相遇是意志与情感的合奏——TA 的外在追求与内在需求是否同频，决定了这段关系「顺不顺自己的心」。',
  'Sun|Venus': '太阳照见金星：TA 的魅力恰好长在你的审美点上（或反之），这是最经典的「心动信号」轴线。',
  'Mars|Sun': '太阳遇上火星：两个人凑在一起自带发动机，一起做事热血沸腾，但方向盘只有一个人握时会打架。',
  'Moon|Venus': '月亮与金星的对话是最柔软的一条线：TA 表达爱的方式，能不能刚好接住你内心最需要的那个姿势。',
  'Mars|Moon': '火星点燃月亮：TA 的行动力会搅动你的情绪之海——可以是激情，也可以是心惊，取决于彼此的油门和刹车。',
  'Mars|Venus': '金星与火星，爱与欲的经典双人舞：吸引力法则在这条线上体现得淋漓尽致，火花与火药只隔一层纸。',
  'Mercury|Mercury': '两颗水星对望：聊天聊不聊得下去，全看这条线。频道对上时废话都是享受，对不上时句句都费劲。',
  'Mercury|Venus': '水星遇金星：甜言蜜语含量检测仪。这条线顺的人，连吵架都像在说情话。',
  'Mercury|Mars': '水星碰火星：语速与火药味齐飞。讨论容易升温成辩论，记得给对话装个灭火器。',
  'Saturn|Sun': '土星注视太阳：这段关系里有「责任」二字的重量——TA 可能是你的老师、考官或压舱石，成长与压力同源。',
  'Saturn|Moon': '土星压着月亮：TA 的严肃会触碰你最柔软的安全感课题；熬过冷启动，这条线会变成最深的依赖。',
  'Saturn|Venus': '土星检验金星：爱在这里被要求「转正」——承诺、现实、长期主义。通过考验的金星，从此不怕风浪。',
  'Jupiter|Moon': '木星拥抱月亮：TA 能把你情绪的水位撑大变宽，是天然的开心果与治愈系；小心一起膨胀的是消费欲。',
  'Jupiter|Venus': '金星搭上木星：享乐与幸运加倍卡。在一起总觉得世界更开阔，也更容易「明天再省钱」。',
  'Jupiter|Sun': '木星点亮太阳：TA 看你的眼神自带滤镜与期许，能把你的自信撑到新高度。',
}

/** 兜底：按类别组合的主题句 */
const KIND_TOPICS: Record<string, string> = {
  'luminary|luminary': '两颗光体的互动定义了这段关系的基调：自我与自我如何共处。',
  'luminary|personal': 'TA 的日常行星直接作用于你的核心自我：生活细节里全是这条线的回声。',
  'personal|personal': '两条日常行星的化学反应：从吃饭口味到回消息速度，处处是它的影子。',
  'social|luminary': '社会级行星参与你的核心剧本：这段关系会把你们带向更大的舞台。',
  'social|personal': '成长与纪律的大行星，正在给你的日常互动定规则。',
  'generational|personal': '时代行星触碰个人行星：深层的观念碰撞与代际课题，也是改造彼此的入口。',
}

function pairTopic(a: string, b: string): string {
  const key = [a, b].sort().join('|')
  if (PAIR_TOPICS[key]) return PAIR_TOPICS[key]!
  const ka = kindOf(a)
  const kb = kindOf(b)
  return (
    KIND_TOPICS[[ka, kb].sort().join('|')] ??
    KIND_TOPICS['personal|personal']!
  )
}

/* ---------------- 合盘 ---------------- */

export interface SynastryReading {
  /** 缘分指数 0-100 */
  score: number
  /** 标签 */
  tags: string[]
  overview: string
  items: Array<{ title: string; text: string }>
  advice: string
}

const HARMONY_WEIGHT: Record<string, number> = { trine: 5, sextile: 3, conjunction: 2 }
const TENSION_WEIGHT: Record<string, number> = { square: 4, opposition: 3 }

/** 个人星体（含光体）权重更高 */
function bodyWeight(name: string): number {
  const k = kindOf(name)
  if (k === 'luminary') return 2
  if (k === 'personal') return 1.5
  if (k === 'social') return 1
  return 0.6
}

const NATURE_ENDING: Record<string, string> = {
  harmonious: '这条线是你们关系里的顺风区：舒服、默契、一点就通——记得常来充电。',
  dynamic: '这条线自带张力：吵得起来的地方，恰恰是你们能一起升级的地方。别怕摩擦，怕的是不沟通。',
  neutral: '这条线能量浓稠不分好坏：深度绑定，荣辱与共，学会驾驭它就等于掌握了关系的钥匙。',
}

const ASPECT_VERB: Record<string, string> = {
  conjunction: '紧密相拥',
  sextile: '友好致意',
  square: '正面掰腕',
  trine: '顺流同行',
  opposition: '隔轴相望',
}

export function readSynastry(chartA: NatalChart, chartB: NatalChart, aspects?: CrossAspect[]): SynastryReading {
  const list = aspects ?? crossAspects(chartA.planets, chartB.planets)

  let harmony = 0
  let tension = 0
  let bond = 0
  for (const a of list) {
    const w = bodyWeight(a.body1) * bodyWeight(a.body2) * (1 - Math.min(a.orb, 8) / 10)
    harmony += (HARMONY_WEIGHT[a.type] ?? 0) * w
    tension += (TENSION_WEIGHT[a.type] ?? 0) * w
    if (a.type === 'conjunction') bond += w
  }

  const coreCount = list.filter((a) => ['Sun', 'Moon', 'Venus', 'Mars'].includes(a.body1) || ['Sun', 'Moon', 'Venus', 'Mars'].includes(a.body2)).length
  const rawScore = 46 + Math.min(harmony * 2.2, 34) + Math.min(coreCount * 2.5, 18) - Math.min(tension * 1.1, 16)
  const score = Math.max(28, Math.min(97, Math.round(rawScore)))

  const tags: string[] = []
  if (harmony > tension * 1.4 && harmony > 8) tags.push('细水长流型')
  if (tension > harmony * 1.2 && tension > 8) tags.push('欢喜冤家型')
  if (bond > 6) tags.push('灵魂缠绕型')
  if (coreCount >= 6) tags.push('高浓度交集')
  if (tags.length === 0) tags.push('君子之交型')

  const hCount = list.filter((a) => a.type === 'trine' || a.type === 'sextile').length
  const tCount = list.filter((a) => a.type === 'square' || a.type === 'opposition').length
  const cCount = list.filter((a) => a.type === 'conjunction').length

  const overview =
    `两人星盘共产生 ${list.length} 条主要交叉相位：和谐 ${hCount} 条、张力 ${tCount} 条、合相 ${cCount} 条。` +
    (tags.includes('灵魂缠绕型')
      ? '大量合相意味着你们像两块互相咬合的拼图——亲密无间，但也容易把对方的课题当成自己的。'
      : tags.includes('欢喜冤家型')
        ? '张力相位占优：你们的关系自带「越斗越亲」的属性，关键在于把较劲变成并肩。'
        : tags.includes('细水长流型')
          ? '和谐相位占优：相处成本低，舒适度高，需要留意的是别让「太顺」稀释了激情。'
          : '你们的连接点不多但未必浅——有些缘分走的是少而精的路线。')

  const seenPairs = new Set<string>()
  const items: SynastryReading['items'] = []
  for (const a of list.slice(0, 9)) {
    const pairKey = `${a.body1}|${a.body2}`
    if (seenPairs.has(pairKey)) continue
    seenPairs.add(pairKey)
    const cnA = PLANETS[a.body1]?.cn ?? a.body1
    const cnB = PLANETS[a.body2]?.cn ?? a.body2
    const asp = ASPECTS[a.type]
    items.push({
      title: `A 方${cnA} ${asp?.symbol ?? ''} ${ASPECT_CN[a.type]} B 方${cnB}（偏差 ${a.orb}°）`,
      text: `${pairTopic(a.body1, a.body2)}\n此刻它们${ASPECT_VERB[a.type] ?? '相遇'}——${NATURE_ENDING[asp?.nature ?? 'neutral']}`,
    })
  }

  const advice =
    tension > harmony
      ? '相处建议：把「赢过对方」的目标换成「赢过问题」。每月留一次正式复盘对话，让张力有出口，而不是在心里发酵。'
      : harmony > tension
        ? '相处建议：你们缺的不是默契是新意——定期一起做一件两人都没做过的事，防止舒适区变成温水。'
        : '相处建议：你们的课题是「翻译」——同一件事，试着各用一句话说出自己的真实期待，误会会少一大半。'

  return { score, tags, overview, items, advice }
}

/* ---------------- 行运 ---------------- */

export interface TransitReading {
  overview: string
  items: Array<{ title: string; text: string; level: 'high' | 'mid' | 'low' }>
  highlight?: string
}

/** 行运行星「正在做什么」 */
const TRANSIT_VERBS: Record<string, string> = {
  Sun: '行运太阳正把聚光灯打向你生活的',
  Moon: '行运月亮让你的心情随着',
  Mercury: '行运水星搅动着你在',
  Venus: '行运金星在',
  Mars: '行运火星给你在',
  Jupiter: '行运木星正在扩张你',
  Saturn: '行运土星开始验收你在',
  Uranus: '行运天王星随时准备翻转你',
  Neptune: '行运海王星为你的',
  Pluto: '行运冥王星深入改造着你',
  Chiron: '行运凯龙轻触你在',
  Lilith: '行运莉莉丝唤醒你在',
  NorthNode: '行运北交点把成长路标插在',
  SouthNode: '行运南交点让你回头看清',
  Ceres: '行运谷神星滋养着你',
  Pallas: '行运智神星为你规划',
  Juno: '行运婚神星检视你在',
  Vesta: '行运灶神星守护你在',
}

/** 本命行星「对应的生活领域」 */
const NATAL_AREA: Record<string, string> = {
  Sun: '自我认同与人生方向',
  Moon: '情绪与家庭安全感',
  Mercury: '思维、学习与沟通',
  Venus: '感情生活与审美享受',
  Mars: '行动力、竞争与欲望',
  Jupiter: '信念系统与机遇',
  Saturn: '长期责任与事业骨架',
  Uranus: '渴望自由的领域',
  Neptune: '梦想与灵性世界',
  Pluto: '深层心理与转化课题',
  Chiron: '旧伤与疗愈天赋',
  Lilith: '压抑的欲望',
  NorthNode: '灵魂成长方向',
  SouthNode: '惯性舒适区',
  Ceres: '滋养与照顾模式',
  Pallas: '策略思维',
  Juno: '承诺关系需求',
  Vesta: '专注奉献之事',
}

/** 行运语境下的相位收尾 */
const TRANSIT_ENDING: Record<string, Record<string, string>> = {
  conjunction: {
    high: '开启新周期的窗口：想要播种的愿望，趁现在郑重写下。',
    mid: '一股新的能量注入该领域：身体会先于头脑感受到。',
    low: '该领域被轻轻点亮，适合做些小调整与小尝试。',
  },
  sextile: {
    high: '机会以「顺手」的方式出现：主动伸手，就能接到礼物。',
    mid: '一个不错的协调窗口：适合推进搁置已久的计划。',
    low: '微风级别的助力，善加利用也能积少成多。',
  },
  trine: {
    high: '顺流期：事情推进阻力小，适合冲刺与展示实力。',
    mid: '一段舒服的通道打开：把天赋拿出来用，别浪费顺风。',
    low: '轻微的顺畅感：保持节奏即可，无需强求突破。',
  },
  square: {
    high: '压力测试来了：该领域的老问题会被翻上台面，硬扛不如拆解。',
    mid: '一些摩擦与延误：慢即是快，检查再出发。',
    low: '小刺级别的不顺：注意沟通措辞，避免小事升级。',
  },
  opposition: {
    high: '关系与取舍的拉扯时刻：另一端有人在等你妥协或合作。',
    mid: '需要在两个选项之间找平衡：先各自站好，再谈整合。',
    low: '轻微的天平晃动：别急着二选一，时间会给答案。',
  },
}

export function readTransits(natal: NatalChart, sky: NatalChart, aspects?: CrossAspect[]): TransitReading {
  const list = aspects ?? crossAspects(sky.planets, natal.planets)

  const retroNames = sky.planets.filter((p) => p.retro).map((p) => PLANETS[p.name]?.cn ?? p.name)
  const phase = moonPhase()
  const skySun = sky.planets.find((p) => p.name === 'Sun')
  const skyVenus = sky.planets.find((p) => p.name === 'Venus')
  const skyMars = sky.planets.find((p) => p.name === 'Mars')

  const overview =
    `此刻天空：太阳行至${skySun?.signCn ?? '—'}，金星在${skyVenus?.signCn ?? '—'}，火星在${skyMars?.signCn ?? '—'}；` +
    `${retroNames.length ? `${retroNames.join('、')}正在逆行` : '没有行星逆行'}；月相 ${phase.emoji} ${phase.name}。` +
    `与你本命盘共振出 ${list.length} 条行运相位，其中 ${list.filter((a) => a.orb < 2).length} 条非常紧密（偏差 <2°），这些就是今天的「主线剧情」。`

  const items: TransitReading['items'] = []
  let highlight: string | undefined

  for (const a of list.slice(0, 12)) {
    const tW = bodyWeight(a.body1)
    const nW = bodyWeight(a.body2)
    const big = (tW >= 1 && nW >= 1.5) || (tW >= 2 && nW >= 1)
    const level: 'high' | 'mid' | 'low' = a.orb < 2 && big ? 'high' : a.orb < 4 ? 'mid' : 'low'

    const cnT = PLANETS[a.body1]?.cn ?? a.body1
    const cnN = PLANETS[a.body2]?.cn ?? a.body2
    const verb = TRANSIT_VERBS[a.body1] ?? `行运${cnT}正影响你在`
    const area = NATAL_AREA[a.body2] ?? `${cnN}相关领域`
    const endings = TRANSIT_ENDING[a.type] ?? TRANSIT_ENDING.conjunction!
    const ending = endings[level]
    items.push({
      title: `行运${cnT} ${ASPECT_SYMBOL_OF(a.type)} 本命${cnN} · ${ASPECT_CN[a.type]} ${a.orb}°`,
      text: `${verb}「${area}」，与本命${cnN}形成${ASPECT_CN[a.type]}。${ending}`,
      level,
    })

    if (!highlight && level === 'high') {
      highlight =
        a.body1 === 'Saturn'
          ? `重点：土星正在验收你的「${area}」。感觉沉、慢、被挑剔都是正常的——交出的每一分努力都会记入长期学分。`
          : a.body1 === 'Uranus'
            ? `重点：天王星正在电击你的「${area}」。计划外的变化不是事故，是快递——签收它。`
            : a.body1 === 'Pluto'
              ? `重点：冥王星在你「${area}」做深层手术。旧模式剥落时会很痛，但长出来的才是真骨头。`
              : a.body1 === 'Jupiter'
                ? `重点：木星正在吹气球——你的「${area}」处于膨胀红利期，敢想就有人接。`
                : `重点：行运${cnT}×本命${cnN}是当下最紧的一根弦（偏差仅 ${a.orb}°），今天围绕「${area}」发生的事都值得记录。`
    }
  }

  if (!highlight && list.length === 0) {
    highlight = '此刻天空与你的本命盘没有紧密互动——宇宙在留白，适合休息、整理与发呆。'
  }

  return { overview, items, highlight }
}

function ASPECT_SYMBOL_OF(type: string): string {
  return ASPECTS[type]?.symbol ?? '✧'
}

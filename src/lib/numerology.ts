/** 生命灵数（Numerology）核心算法 */

export function digitSum(n: number): number {
  let v = n
  while (v > 9) {
    v = String(v)
      .split('')
      .reduce((s, d) => s + Number(d), 0)
  }
  return v
}

/** 生命路径数：生日各位数字累加，保留主数 11/22/33 */
export function lifePathNumber(y: number, m: number, d: number): number {
  const sum = reduceKeepMasters(
    String(y) +
      String(m).padStart(2, '0') +
      String(d).padStart(2, '0'),
  )
  return sum
}

function reduceKeepMasters(numStr: string): number {
  let n = numStr.split('').reduce((s, d) => s + Number(d), 0)
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    n = digitSum(n)
  }
  return n
}

/** 生命路径数的逐级约减链：如 19900523 → 29 → 11（遇主数 11/22/33 停） */
export function lifePathChain(y: number, m: number, d: number): number[] {
  const steps: number[] = []
  let n = (
    String(y) + String(m).padStart(2, '0') + String(d).padStart(2, '0')
  )
    .split('')
    .reduce((s, c) => s + Number(c), 0)
  steps.push(n)
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    // 每次只做一层"各位相加"，保留中间过程（如 37 → 10 → 1）
    n = String(n)
      .split('')
      .reduce((s, c) => s + Number(c), 0)
    steps.push(n)
  }
  return steps
}

/** 生日数：仅用"日" */
export function birthdayNumber(d: number): number {
  return d > 22 ? digitSum(d) : d === 22 ? 22 : d > 9 ? digitSum(d) : d
}

const PYTHAGOREAN: Record<string, number> = {}
{
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  letters.split('').forEach((ch, i) => {
    PYTHAGOREAN[ch] = (i % 9) + 1
  })
}

const VOWELS = new Set(['A', 'E', 'I', 'O', 'U'])

function nameToNumbers(name: string): { all: number; vowels: number; consonants: number } | null {
  const clean = name.toUpperCase().replace(/[^A-Z]/g, '')
  if (clean.length === 0) return null
  let all = 0
  let vw = 0
  let cs = 0
  for (const ch of clean) {
    const v = PYTHAGOREAN[ch]!
    all += v
    if (VOWELS.has(ch)) vw += v
    else cs += v
  }
  return { all: reduceKeepMasters(String(all)), vowels: reduceKeepMasters(String(vw)), consonants: reduceKeepMasters(String(cs)) }
}

export interface NumerologyResult {
  lifePath: number
  birthday: number
  expression: number | null
  soulUrge: number | null
  personality: number | null
}

export function calculateNumerology(birth: { y: number; m: number; d: number }, fullName: string): NumerologyResult {
  const nameNums = nameToNumbers(fullName)
  return {
    lifePath: lifePathNumber(birth.y, birth.m, birth.d),
    birthday: birthdayNumber(birth.d),
    expression: nameNums?.all ?? null,
    soulUrge: nameNums?.vowels ?? null,
    personality: nameNums?.consonants ?? null,
  }
}

export interface NumberMeaning {
  title: string
  essence: string
  detail: string
}

/** 数字含义：1-9 与三大主数 */
export const NUMBER_MEANINGS: Record<number, NumberMeaning> = {
  1: { title: '开创者', essence: '独立 · 领导 · 原创力', detail: '1 号人天生带着开拓者的火种，适合做第一个吃螃蟹的人。课题是学会合作与倾听，独行的勇气配上团队的智慧才能走远。' },
  2: { title: '调和者', essence: '共感 · 协作 · 细腻', detail: '2 号人是天生的外交家与疗愈者，擅长在关系里织出和谐。课题是建立边界，温柔不等于无底线地退让。' },
  3: { title: '表达者', essence: '创意 · 沟通 · 乐观', detail: '3 号人自带聚光灯，语言、艺术与幽默是你的天赋。课题是聚焦，把散落的灵感收拢成一件完成的作品。' },
  4: { title: '建造者', essence: '务实 · 秩序 · 坚持', detail: '4 号人是大厦的地基，可靠与纪律让你无往不利。课题是柔韧，允许计划外的生活给你惊喜。' },
  5: { title: '冒险家', essence: '自由 · 变化 · 感官', detail: '5 号人的灵魂装着风，旅行、尝试与新知是你的养分。课题是自律，自由的另一面是别被欲望牵着走。' },
  6: { title: '守护者', essence: '责任 · 爱 · 审美', detail: '6 号人是家庭与社群的暖炉，照顾人与创造美让你发光。课题是放手，你无法也不必替所有人负重。' },
  7: { title: '求索者', essence: '分析 · 灵性 · 深度', detail: '7 号人的头脑是一口深井，研究、哲思与独处是你的道场。课题是信任，偶尔让心先于脑做决定。' },
  8: { title: '掌局者', essence: '力量 · 财富 · 成就', detail: '8 号人生来懂得物质世界的游戏规则，组织与执行是强项。课题是柔软，权力最好的用法是成全他人。' },
  9: { title: '博爱者', essence: '慈悲 · 完成 · 远见', detail: '9 号人装着老灵魂的悲悯，艺术、公益与教导让你圆满。课题是告别，学会放手旧章节才写得动新篇。' },
  11: { title: '启示者（大师数）', essence: '直觉 · 灵感 · 感召', detail: '11 是高配的 2：敏锐如天线般的直觉与感染力。课题是落地，把天上的电光接进现实的插座。' },
  22: { title: '筑梦师（大师数）', essence: '宏图 · 落地 · 影响力', detail: '22 是高配的 4：有能力把宏大愿景砌成真实建筑。课题是承受，大梦想需要大心脏，允许自己慢慢盖。' },
  33: { title: '引路人（大师数）', essence: '大爱 · 教导 · 疗愈', detail: '33 是高配的 6：以近乎圣者的慈悲服务众人。课题是自渡，照亮别人之前请先点亮自己。' },
}

/* ---------- 流年 / 流月 / 流日 ---------- */

/** 流年数 = 出生月 + 出生日 + 目标年份，保留大师数 */
export function personalYear(birthMonth: number, birthDay: number, year: number): number {
  const sum = digitSum(birthMonth) + digitSum(birthDay) + digitSum(year)
  return reduceKeepMasters(String(sum))
}

/** 流月数 = 流年数 + 当月 */
export function personalMonth(pYear: number, month: number): number {
  return digitSum(digitSum(pYear) + digitSum(month))
}

/** 流日数 = 流月数 + 当日 */
export function personalDay(pMonth: number, day: number): number {
  return digitSum(digitSum(pMonth) + digitSum(day))
}

/** 流年主题（1-9） */
export const PERSONAL_YEAR_MEANINGS: Record<number, string> = {
  1: '播种年 —— 万物重启，适合开新局、立新志。',
  2: '扎根年 —— 慢就是快，合作与耐心是关键词。',
  3: '绽放年 —— 表达、社交与创造力的高光时刻。',
  4: '筑基年 —— 修房子、修身体、修规矩，务实为上。',
  5: '变奏年 —— 拥抱变化，旅行与新鲜事在路上。',
  6: '归巢年 —— 家庭与关系升温，责任里藏着甜。',
  7: '深潜年 —— 学习研究的好年份，答案向内求。',
  8: '丰收年 —— 事业与财务的收获季，大胆收获。',
  9: '谢幕年 —— 总结、感恩、放手，给下个九年腾地方。',
}

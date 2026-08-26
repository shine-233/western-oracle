/**
 * 学徒好感度：抚摸/互动积累，五级羁绊。
 * - 数据存 localStorage（key: wo-affection），按学徒 id 分档
 * - Lv3 解锁各学徒的秘密台词（隐藏剧情，见 SECRET_LINES）
 */

const KEY = 'wo-affection'

/** 各等级所需好感度阈值（Lv1 起） */
export const LEVELS = [0, 5, 12, 22, 35]

export const LEVEL_TITLES_ZH = ['初识', '熟络', '心意相通', '形影不离', '命运相连']
export const LEVEL_TITLES_EN = ['Acquainted', 'Familiar', 'Kindred', 'Inseparable', 'Fatebound']

function load(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, number>
  } catch {
    return {}
  }
}

function save(all: Record<string, number>): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch {
    /* noop */
  }
}

export function getPoints(id: string): number {
  return load()[id] ?? 0
}

export function levelOf(points: number): number {
  let lv = 1
  for (let i = 0; i < LEVELS.length; i++) {
    if (points >= LEVELS[i]!) lv = i + 1
  }
  return lv
}

/** 增加好感度；返回新状态与是否升级 */
export function addAffection(
  id: string,
  n = 1,
): { points: number; level: number; leveledUp: boolean } {
  const all = load()
  const before = levelOf(all[id] ?? 0)
  all[id] = (all[id] ?? 0) + n
  save(all)
  const level = levelOf(all[id]!)
  return { points: all[id]!, level, leveledUp: level > before }
}

/** 升到下一级还差多少点（满级返回 null） */
export function pointsToNext(id: string): number | null {
  const p = getPoints(id)
  const lv = levelOf(p)
  if (lv >= LEVELS.length) return null
  return (LEVELS[lv] ?? 0) - p
}

/* ---------- Lv3 解锁的秘密台词 ---------- */

export const SECRET_LINES: Record<string, { zh: string; en: string }> = {
  cat: {
    zh: '其实这顶猫耳兜帽是师父的第一件失败作品。她说留着提醒自己，我说——戴着挺暖和的。',
    en: 'This cat-ear hood was Master\'s first failed spellwork. She keeps it to remember; I keep wearing it — it\'s warm.',
  },
  owl: {
    zh: '帽子上少缝了一颗星。那不是遗漏——是给还没来的学生留的位置。',
    en: 'One star is missing from my hat. Not an oversight — it\'s reserved for the student yet to come.',
  },
  numi: {
    zh: '偷偷算过师父的生日：她的生命路径数和我的一样哦。这就是我们相遇的原因吧。',
    en: 'I secretly reduced Master\'s birthday: her life path matches mine. That\'s why we met, I think.',
  },
  golem: {
    zh: '斗篷上每长出一片新苔藓，就是我又默默说了一次没说出口的谢谢。',
    en: 'Every new patch of moss on this cloak is a thank-you I never said out loud.',
  },
  twins: {
    zh: '光环其实会漏电。靠近我的人容易心动——不是我干的，是它。',
    en: 'My halo leaks a little spark. People fall for others around me — not my doing. It\'s the halo.',
  },
  comet: {
    zh: '七十六年绕一圈的星有很多。愿意为一句话停下来的，只有我一个。',
    en: 'Plenty of stars orbit every 76 years. Only one stops mid-orbit for a single sentence.',
  },
}

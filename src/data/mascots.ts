/** 模块吉祥物「神谕宠物园」：像素画数据，与露娜共用体素渲染管线 */

export const MASCOT_PALETTE: Record<string, string> = {
  K: '#2e2650', // 描边
  E: '#1d1838', // 眼睛
  W: '#fff6ec', // 奶白
  G: '#ffd76e', // 金色（猫眼/尾巴尖）
  B: '#ff9fce', // 腮红粉
  P: '#ff9fce', // 粉（耳朵鼻子）
  F: '#453a72', // 猫毛深紫
  H: '#7c66d6', // 猫头鹰身体
  O: '#ffb37a', // 橙（喙与爪）
  L: '#b3a6f7', // 灵数精灵淡紫
  M: '#8f8ac2', // 石头人岩石
  V: '#7de8c3', // 符文荧光绿
  N: '#5fb8a5', // 苔藓深绿 / 双子鸟·薄荷
  R: '#ff9fce', // 双子鸟·玫瑰
  D: '#a9c4e8', // 彗星星尘蓝
  T: '#f5c86e', // 彗尾金
}

export interface MascotDef {
  id: string
  /** 中文名 */
  nameCn: string
  /** 英文名 */
  nameEn: string
  sprite: string[]
  /** 参与眨眼动作的调色板字母 */
  eyeChars: string[]
  /** 环绕卫星体的颜色 */
  satelliteColor: string
  /** 地面光晕颜色 */
  glowColor: string
}

/* ---------- 塔罗 · 黑猫墨墨 ---------- */
const CAT: MascotDef = {
  id: 'cat',
  nameCn: '墨墨',
  nameEn: 'Momo',
  satelliteColor: '#ffd76e',
  glowColor: '#ff9fce',
  eyeChars: ['E'],
  sprite: [
    '..KK.........KK..',
    '.KPPK.......KPPK.',
    '.KFFFK.....KFFFK.',
    '.KFFFFFFFFFFFFFK.',
    'KFFFFFFFFFFFFFFFK',
    'KFEEFFFFFFFEEFFFK',
    'KFFFFFFFPFFFFFFFK',
    'KFFFFFWWWWWFFFFFK',
    '.KFFFFFFFFFFFFFK.',
    '..KKKKKKKKKKKKK..',
    '....KFFFFFFFK.KK.',
    '...KFWWWWWWFKKFK.',
    '...KFWWWWWWFKKFK.',
    '...KFFKFFKFFKK...',
    '...KKK.KKK.KK....',
  ],
}

/* ---------- 占星 · 猫头鹰星教授 ---------- */
const OWL: MascotDef = {
  id: 'owl',
  nameCn: '星教授',
  nameEn: 'Prof. Star',
  satelliteColor: '#7de8c3',
  glowColor: '#7c66d6',
  eyeChars: ['E'],
  sprite: [
    '...KKKKKKK...',
    '..KHHHHHHHK..',
    '.KHHHHHHHHHK.',
    '.KWWWHHHWWWK.',
    '.KWWEWHHWEWK.',
    '.KWWWHHHWWWK.',
    'KHHHHOOOHHHHK',
    'KHHHHHHHHHHHK',
    'KHKKHHHHHKKHK',
    'KHHKHHHHHKHHK',
    '.KHHHHHHHHHK.',
    '..KHHHHHHHK..',
    '..KOOK.KOOK..',
  ],
}

/* ---------- 灵数 · 数字精灵 Numi ---------- */
const NUMI: MascotDef = {
  id: 'numi',
  nameCn: 'Numi',
  nameEn: 'Numi',
  satelliteColor: '#b3a6f7',
  glowColor: '#ffd76e',
  eyeChars: ['E'],
  sprite: [
    '.......KG.......',
    '.......KL.......',
    '.....KKLLKK.....',
    '....KLLLLLK.....',
    '...KLLLLLLLK....',
    '..KLLLLLLLLLK...',
    '.KLLEELLLEELLKK.',
    '.KLLEELLLEELLK..',
    '.KLLLLLLLLLLLK..',
    '.KLBBLLLLLBBLK..',
    '.KLLLLLKKLLLLK..',
    '..KLLLWWLLLK....',
    '..KLLLLLLLLK....',
    '...KKKKKKKKK....',
  ],
}

/* ---------- 卢恩 · 符文石人 Runi ---------- */
const GOLEM: MascotDef = {
  id: 'golem',
  nameCn: 'Runi',
  nameEn: 'Runi',
  satelliteColor: '#7de8c3',
  glowColor: '#5fb8a5',
  eyeChars: ['V'],
  sprite: [
    '..KKKKKKKKKKK...',
    '.KMMMMMMMMMMMK..',
    '.KMVVKMMMKVVMK..',
    '.KMMMMMMMMMMMK..',
    '.KMMVKKKKKVMMMK.',
    'KMMKMMMMMMKMMMK.',
    'KMMKMNMMMMKMMMK.',
    '.KKMMMMMMMMKK...',
    '..KMMMMMMMMK....',
    '..KMKKKKKKMK....',
    '..KMMK..KMMK....',
    '..KKKK..KKKK....',
  ],
}

/* ---------- 合盘 · 双生鸟 ---------- */
const TWINS: MascotDef = {
  id: 'twins',
  nameCn: '双生鸟',
  nameEn: 'Twinies',
  satelliteColor: '#ff9fce',
  glowColor: '#ff9fce',
  eyeChars: ['E'],
  sprite: [
    '..KKK........KKK..',
    '.KRRRK......KNNNK.',
    'KREWRK.....KWENNK.',
    'KRRRRK..G..KNNNNK.',
    'KRRRRK.GGG.KNNNNK.',
    'KRPPRK.GGG.KNPNNK.',
    '.KRRK...G..KNNK...',
    '..KK.......KK.....',
    '..KOOK.....KOOK...',
  ],
}

/* ---------- 行运 · 小彗星 ---------- */
const COMET: MascotDef = {
  id: 'comet',
  nameCn: '小彗星',
  nameEn: 'Comet',
  satelliteColor: '#a9c4e8',
  glowColor: '#a9c4e8',
  eyeChars: ['E'],
  sprite: [
    '..........KTK...',
    '.........KTTTK..',
    '........KTTTK...',
    '.......KTTTK....',
    '..KKKKKTTTK.....',
    '.KDDDDDKTTK.....',
    'KDDEDDDDKK......',
    'KDDEDDDDK.......',
    'KDDDDDDDK.......',
    'KDPDDDDPK.......',
    '.KDBBDBK........',
    '..KKKKK.........',
  ],
}

export const MASCOTS: Record<string, MascotDef> = {
  cat: CAT,
  owl: OWL,
  numi: NUMI,
  golem: GOLEM,
  twins: TWINS,
  comet: COMET,
}

export const MASCOT_IDS = Object.keys(MASCOTS)

export interface MascotVoxel {
  x: number
  y: number
  color: string
  isEye: boolean
}

/** 把像素画展开成体素列表；短行自动补齐到最长行 */
export function mascotVoxels(def: MascotDef): MascotVoxel[] {
  const cols = Math.max(...def.sprite.map((r) => r.length))
  const out: MascotVoxel[] = []
  def.sprite.forEach((rawRow, y) => {
    const row = rawRow.padEnd(cols, '.')
    row.split('').forEach((ch, x) => {
      const color = MASCOT_PALETTE[ch]
      if (!color || ch === '.') return
      out.push({ x, y, color, isEye: def.eyeChars.includes(ch) })
    })
  })
  return out
}

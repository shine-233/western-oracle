/** 神谕宠物园：模块吉祥物——露娜同款画风的小巫师家族（拟人化），共用一套像素调色板 */

export const MASCOT_PALETTE: Record<string, string> = {
  K: '#2e2650', // 描边
  E: '#3a2e5c', // 眼睛
  S: '#ffdcc5', // 皮肤
  B: '#ff9fce', // 腮红
  W: '#fff6ec', // 奶白
  G: '#ffd76e', // 金色星星
  H: '#6b5bd6', // 露娜帽紫（阿斯特拉尖帽）
  D: '#5a4bbf', // 裙子紫
  L: '#b3a6f7', // 头发淡紫
  O: '#8a5a3b', // 靴子/扫帚柄
  F: '#453a72', // 兜帽深紫（墨墨）
  P: '#ff9fce', // 猫耳内衬粉
  C: '#a9c4e8', // 暮空蓝发（阿斯特拉）/彗星骑手帽
  N: '#5fb8a5', // 薄荷绿（Numi 尖帽）/苔藓
  M: '#8f8ac2', // 岩石灰斗篷（Runa）
  V: '#7de8c3', // 符文荧光绿 / Numi 发色
  R: '#ff8fb8', // 玫瑰粉裙（Cupie/彗星骑手）
  T: '#f5c86e', // 法杖与彗尾金
}

export interface MascotDef {
  id: string
  nameCn: string
  nameEn: string
  sprite: string[]
  /** 参与眨眼动作的调色板字母 */
  eyeChars: string[]
  /** 环绕卫星体的颜色 */
  satelliteColor: string
  /** 地面光晕颜色 */
  glowColor: string
}

/* ---------- 塔罗 · 见习塔罗师墨墨：猫耳兜帽，怀里抱着一摞牌 ---------- */
const CAT: MascotDef = {
  id: 'cat',
  nameCn: '见习塔罗师 · 墨墨',
  nameEn: 'Apprentice · Momo',
  satelliteColor: '#ffd76e',
  glowColor: '#ff9fce',
  eyeChars: ['E'],
  sprite: [
    '...KK..........KK...',
    '..KPPK........KPPK..',
    '..KFFFK......KFFFK..',
    '..KFFFKKKKKKKKFFFK..',
    '.KFFFFFFFFFFFFFFFFK.',
    '.KFFFFFFFFFFFFFFFFK.',
    '.KKFFFFFFFFFFFFFFKK.',
    '...KKKKKKKKKKKKKK...',
    '...KLLSSSSSSSSLLK...',
    '...KLSSSSSSSSSSLK...',
    '...KLSSESSSSSESLK...',
    '...KLSSSSSSSSSSLK...',
    '...KLSBSSSSSSBSLK...',
    '....KSSSSKKSSSSK....',
    '.....KWDDDDDDWK.....',
    '....KSWKKKKKKWSK....',
    '....KDDKWGGWKDDK....',
    '.....KDKKKKKKDK.....',
    '.....KDDKKKKDDK.....',
    '.....KDDKKKKDDK.....',
    '.....KOOK..KOOK.....',
    '.....KOOK..KOOK.....',
    '.....KKKK..KKKK.....',
  ],
}

/* ---------- 占星 · 星象教授阿斯特拉：缀星尖帽 + 单片星镜 ---------- */
const OWL: MascotDef = {
  id: 'owl',
  nameCn: '星象教授 · 阿斯特拉',
  nameEn: 'Prof. Astraea',
  satelliteColor: '#7de8c3',
  glowColor: '#6b5bd6',
  eyeChars: ['E'],
  sprite: [
    '...........KK.......',
    '..........KGGK......',
    '..........KHHK......',
    '.........KHGHK......',
    '........KHHHHK......',
    '.......KHHHGHK......',
    '.....KHHHHHHHHK.....',
    '...KHGHHHHHHHHHHK...',
    '..KKHHHHHHHHHHHHKK..',
    '...KCCSSSSSSSSCCK...',
    '...KCSSSSSSSSSSCK...',
    '...KCSSESSSSGESCK...',
    '...KCSSSSSSSSSSCK...',
    '...KCSBSSSSSSBSCK...',
    '....KSSSSKKSSSSK....',
    '.....KWDDDDDDWK.....',
    '....KSWDDDDDDWSK....',
    '....KDDDDDDDDDDK....',
    '.....KDDDDDDDDK.....',
    '.....KDDKKKKDDK.....',
    '.....KOOK..KOOK.....',
    '.....KOOK..KOOK.....',
    '.....KKKK..KKKK.....',
  ],
}

/* ---------- 灵数 · 数字魔法使 Numi：薄荷尖帽 + 荧光绿金绳双马尾 ---------- */
const NUMI: MascotDef = {
  id: 'numi',
  nameCn: '数字魔法使 · Numi',
  nameEn: 'Numeria · Numi',
  satelliteColor: '#b3a6f7',
  glowColor: '#7de8c3',
  eyeChars: ['E'],
  sprite: [
    '...........KK.......',
    '..........KGNK......',
    '..........KNNK......',
    '.........KNNNK......',
    '........KNNNNK......',
    '.......KNNGNNK......',
    '.....KNNNNNNNNK.....',
    '...KNNNNNNNNNNNNK...',
    '..KKNNNNNNNNNNNNKK..',
    '...KVVSSSSSSSSVVK...',
    '...KVSSSSSSSSSSVK...',
    '.GGKVSSESSSSSESVKGG.',
    '.V.KSSSSSSSSSSSSK.V.',
    'V..KSSBSSSSSSBSSK..V',
    '.V..KSSSSKKSSSSK..V.',
    '.V..KWLLLLLLWK..V..',
    '....KSWLLLLLLWSK....',
    '.....KLLLLLLLLK.....',
    '.....KLLLGGGLLK.....',
    '.....KLLKKKKLLK.....',
    '.....KOOK..KOOK.....',
    '.....KOOK..KOOK.....',
    '.....KKKK..KKKK.....',
  ],
}

/* ---------- 卢恩 · 符文萨满 Runa：石斗篷苔藓点 + 符文法杖 ---------- */
const GOLEM: MascotDef = {
  id: 'golem',
  nameCn: '符文萨满 · Runa',
  nameEn: 'Rune Shaman · Runa',
  satelliteColor: '#7de8c3',
  glowColor: '#5fb8a5',
  eyeChars: ['E'],
  sprite: [
    '..........KKK.......',
    '.........KMMMK......',
    '.........KMMMK......',
    '.........KMMMK......',
    '........KMMMMK......',
    '.......KMNMMMK......',
    '.....KMMMMMMMMK.....',
    '...KMMMMMMMMMMMMK...',
    '..KKMMMMNMMMMMMKK...',
    '...KLLSSSSSSSSLLK...',
    '...KLSSSSSSSSSSLK...',
    '...KLSSESSSSSESLK...',
    '...KLSSSSSSSSSSLK...',
    '...KLSBSSSSSSBSLK.G.',
    '....KSSSSKKSSSSK.T..',
    '.....KWDVVVVDWK..T..',
    '....KSWDMMMMDWSK.T..',
    '....KDDDMMMDDDDK.T..',
    '.....KDDMMMMDDK..T..',
    '.....KDDKKKKDDK..T..',
    '.....KOOK..KOOK..T..',
    '.....KOOK..KOOK..T..',
    '.....KKKK..KKKK..T..',
  ],
}

/* ---------- 合盘 · 小爱神 Cupie：头顶光环 + 小翅膀 + 心口爱心 ---------- */
const TWINS: MascotDef = {
  id: 'twins',
  nameCn: '小爱神 · Cupie',
  nameEn: 'Cupid · Cupie',
  satelliteColor: '#ff8fb8',
  glowColor: '#ff8fb8',
  eyeChars: ['E'],
  sprite: [
    '.........KKKKK......',
    '.........KGGGK......',
    '..........KKK.......',
    '.........KLLLK......',
    '........KLLLLLK.....',
    '.......KLLLLLLLK....',
    '.....KLLLLLLLLLLK...',
    '...KLLSSSSSSSSLLK...',
    '..KKLSSSSSSSSSSLKK..',
    '...KLSSESSSSSESLK...',
    '...KLSSSSSSSSSSLK...',
    '...KLSBSSSSSSBSLK...',
    '....KSSSSKKSSSSK....',
    '.....KWRRRRRRWK.....',
    '.KKKKSWRRGGRRWSKKKK.',
    '.KK.KDDRGGRDDDK.KK..',
    '.....KDDDDDDDDK.....',
    '.....KDDKKKKDDK.....',
    '.....KDDKKKKDDK.....',
    '.....KOOK..KOOK.....',
    '.....KOOK..KOOK.....',
    '.....KKKK..KKKK.....',
  ],
}

/* ---------- 行运 · 彗星骑手 Comet：骑扫帚横穿天际，身后拖着彗尾 ---------- */
const COMET: MascotDef = {
  id: 'comet',
  nameCn: '彗星骑手 · Comet',
  nameEn: 'Sky Rider · Comet',
  satelliteColor: '#a9c4e8',
  glowColor: '#a9c4e8',
  eyeChars: ['E'],
  sprite: [
    '...........KK...............',
    '..........KCCK.......TT.....',
    '..........KCCK......TTT.....',
    '.........KCCCK.......TT.....',
    '........KCCHHK..............',
    '.......KCHHHHK..............',
    '.....KCHHHHHHHK.............',
    '...KCHHHHHHHHHHHK...........',
    '..KKCHHHHHHHHHHCKK..........',
    '...KLLSSSSSSSSLLK...........',
    '...KLSSSSSSSSSSLK...........',
    '...KLSSESSSSSESLK...........',
    '...KLSSSSSSSSSSLK...........',
    '...KLSBSSSSSSBSLK...........',
    '....KSSSSKKSSSSK............',
    '.....KWRRRRRRWK.............',
    '....KSWRRRRRRWSK........TT..',
    '....KRRRRRRRRRRK.......TTT..',
    '.....KRRRRRRRRK.........TT..',
    '....ORRRKKKKRRRO............',
    '...OOOOOOOOOOOOOOOOOOOOO....',
    '.....KOOK..KOOK.OOOOO.......',
    '.....KKKK..KKKK..TTTT.......',
  ],
}

/* ---------- 水晶 · 雾语占卜师 Mist：兜帽垂纱，怀里抱一颗发光宝珠 ---------- */
const MIST: MascotDef = {
  id: 'mist',
  nameCn: '雾语占卜师 · Mist',
  nameEn: 'Mist Speaker · Mist',
  satelliteColor: '#b3a6f7',
  glowColor: '#7de8c3',
  eyeChars: ['E'],
  sprite: [
    '...........KK.......',
    '..........KGWK......',
    '..........KCCK......',
    '.........KCCCK......',
    '........KCCHHK......',
    '.......KCHHHHK......',
    '.....KCCHHHHCCK.....',
    '...KCCHHHHHHHHCCK...',
    '..KKCCHHHHHHHHCCKK..',
    '...KCCSSSSSSSSCCK...',
    '...KCSSSSSSSSSSCK...',
    '...KCSSESSSSSESGK...',
    '...KCSSSSSSSSSSCK...',
    '...KCSBSSSSSSBSCK...',
    '....KSSSSKKSSSSK....',
    '.....KWDDDDDDWK.....',
    '....KSWDWWWGDWSK....',
    '....KDDWWWWGDDDK....',
    '.....KDDWWWWDDK.....',
    '.....KDDKKKKDDK.....',
    '.....KOOK..KOOK.....',
    '.....KOOK..KOOK.....',
    '.....KKKK..KKKK.....',
  ],
}

export const MASCOTS: Record<string, MascotDef> = {
  cat: CAT,
  owl: OWL,
  numi: NUMI,
  golem: GOLEM,
  twins: TWINS,
  comet: COMET,
  mist: MIST,
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

/** 小巫女露娜的像素画数据：2D 吉祥物与 3D 体素模型共用。
 * v2：分辨率 20×23 → 28×27，面部升级（2×2 眼 + 白色高光 + 双宽腮红 + 嘴部像素）。
 * 面部关键坐标（供表情系统使用）：
 *   左眼 (8,12)-(9,13) · 右眼 (18,12)-(19,13) · 嘴 (13,14)-(14,14) · 腮红 (8,14)(9,14)(19,14)(20,14)
 */

export const WITCH_PALETTE: Record<string, string> = {
  K: '#2e2650', // 描边
  H: '#6b5bd6', // 帽子
  G: '#f5c86e', // 金星
  S: '#ffdcc5', // 皮肤
  E: '#3a2e5c', // 眼睛
  B: '#ff9fce', // 腮红
  L: '#b3a6f7', // 头发
  D: '#5a4bbf', // 裙子
  W: '#fff6ec', // 领子 / 眼睛高光
  O: '#8a5a3b', // 靴子
}

export const WITCH_W = 28
export const WITCH_H = 27

export const WITCH_SPRITE = [
  '............KGGK............',
  '...........KHHK.............',
  '...........KHGGHK...........',
  '..........KHHHHK............',
  '.........KHHGHHHK...........',
  '........KGHHHHHHGK..........',
  '.......KHHHGHHHGHHK.........',
  '......KHHHHHHHHHHHHK........',
  '....KGGGGGGGGGGGGGGGGGGK....',
  '....KKHHHHHHHHHHHHHHHHKK....',
  '.....KLLSSSSSSSSSSSSLLK.....',
  '.....KLSSSSSSSSSSSSSSLK.....',
  '.....KLSEESSSSSSSSEESLK.....',
  '.....KLSEWSSSSSSSSEWSLK.....',
  '.....KLSBBSSSKKSSSBBSLK.....',
  '.....KLLSSSSSSSSSSSSLLK.....',
  '......KWWDDDDDDDDDDWWK......',
  '......KSWDDDGGDDDDWSK.......',
  '......KSDDDDGGDDDDSK........',
  '......KKDDDDDDDDDDDKK.......',
  '.....KDDDGDDDDDDGDDK........',
  '....KDDDDGDDDDDGDDDK........',
  '...KDDDDDDDDDDDDDDDDDDK.....',
  '...KWWWWWWWWWWWWWWWWWWK.....',
  '.....KOOK......KOOK.........',
  '.....KOOK......KOOK.........',
  '.....KKKK......KKKK.........',
]

/** 面部特征格坐标（像素单位，供 2D 表情层与体素眨眼定位） */
export const WITCH_FACE = {
  eyeL: { x: 8, y: 12, w: 2, h: 2 },
  eyeR: { x: 18, y: 12, w: 2, h: 2 },
  mouth: { x: 13, y: 14, w: 2, h: 1 },
  blushL: { x: 8, y: 14, w: 2, h: 1 },
  blushR: { x: 18, y: 14, w: 2, h: 1 },
}

export interface WitchVoxel {
  x: number
  y: number
  color: string
}

export function witchVoxels(): WitchVoxel[] {
  const out: WitchVoxel[] = []
  WITCH_SPRITE.forEach((row, y) => {
    row.split('').forEach((ch, x) => {
      const color = WITCH_PALETTE[ch]
      if (color) out.push({ x, y, color })
    })
  })
  return out
}

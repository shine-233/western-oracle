/** 小巫女露娜的像素画数据：2D 吉祥物与 3D 体素模型共用 */

export const WITCH_PALETTE: Record<string, string> = {
  K: '#2e2650', // 描边
  H: '#6b5bd6', // 帽子
  G: '#f5c86e', // 金星
  S: '#ffdcc5', // 皮肤
  E: '#3a2e5c', // 眼睛
  B: '#ff9fce', // 腮红
  L: '#b3a6f7', // 头发
  D: '#5a4bbf', // 裙子
  W: '#fff6ec', // 领子
  O: '#8a5a3b', // 靴子
}

export const WITCH_SPRITE = [
  '..........KGGK......',
  '..........KHHK......',
  '.........KHGHK...G..',
  '........KHHHHK......',
  '.......KHGHHHK......',
  '.....KHHHHHHHHK.....',
  '...KHHHHHHHHHHHHK...',
  '..KGGGGGGGGGGGGGGK..',
  '..KKHHHHHHHHHHHHKK..',
  '...KLLSSSSSSSSLLK...',
  '...KLSSSSSSSSSSLK...',
  '...KLSSESSSSSESLK...',
  '...KLSSSSSSSSSSLK...',
  '...KLSBSSSSSSBSLK...',
  '.L..KSSSSKKSSSSK....',
  '.....KWDDDDDDWK.....',
  '....KSWDDDGDDWSK....',
  '....KDDGDDDDGDDK....',
  '.....KDDGGGGDDK.....',
  '.....KWWKKKKWWK.....',
  '.....KOOK..KOOK.....',
  '.....KOOK..KOOK.....',
  '.....KKKK..KKKK.....',
]

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

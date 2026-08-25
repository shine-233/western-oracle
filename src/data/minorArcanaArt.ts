/**
 * 小阿卡纳像素画生成器（56 张）。
 * - 数字牌（A/2-10）：花色符号按经典阵型程序化布点
 * - 宫廷牌（侍从/骑士/王后/国王）：四套人形模板，衣装色随花色替换
 * - 花色字符：F=权杖火 U=圣杯水 I=宝剑钢 A=星币金（见 ARCANA_PALETTE）
 */
import type { ArcanaArt } from './arcanaArt'

export type MinorSuit = 'wands' | 'cups' | 'swords' | 'pentacles'

/* ---------- 四花色符号 ---------- */
const WAND: string[] = [
  '.T..T.',
  'TTMMTT',
  '..MM..',
  '..MM..',
  '..MM..',
  '..MM..',
  '..MM..',
  '..FF..',
]
const CUP: string[] = [
  '.UWWU.',
  '.UUUU.',
  '..UU..',
  '..UU..',
  '..UU..',
  '.UUUU.',
  '.AAAA.',
]
const SWORD: string[] = [
  '...I...',
  '..III..',
  '..III..',
  '..III..',
  '..III..',
  '.KKKKK.',
  '...M...',
  '...M...',
  '..MMM..',
]
const PENTACLE: string[] = [
  '.AAAA.',
  'AAKKAA',
  'AKKKKA',
  'AKKKKA',
  'AAKKAA',
  '.AAAA.',
]

const SUIT_SPRITE: Record<MinorSuit, string[]> = {
  wands: WAND,
  cups: CUP,
  swords: SWORD,
  pentacles: PENTACLE,
}

/* ---------- 数字牌布点（经典 pip 阵型，21×30 画布内） ---------- */
const PIP_LAYOUT: Record<number, Array<[number, number]>> = {
  1: [[8, 11]],
  2: [[6, 7], [12, 16]],
  3: [[6, 6], [12, 6], [9, 13]],
  4: [[5, 6], [12, 6], [5, 15], [12, 15]],
  5: [[5, 5], [12, 5], [8, 10], [5, 15], [12, 15]],
  6: [[5, 4], [12, 4], [5, 11], [12, 11], [5, 18], [12, 18]],
  7: [[5, 4], [12, 4], [5, 9], [12, 9], [8, 13], [5, 17], [12, 17]],
  8: [[5, 3], [12, 3], [5, 8], [12, 8], [5, 13], [12, 13], [5, 18], [12, 18]],
  9: [[5, 3], [12, 3], [5, 8], [12, 8], [8, 11], [5, 14], [12, 14], [5, 19], [12, 19]],
  10: [[5, 2], [12, 2], [5, 7], [12, 7], [5, 12], [12, 12], [5, 17], [12, 17], [8, 9], [9, 15]],
}

/* ---------- 宫廷牌人形模板（Z = 随花色替换的衣装色） ---------- */
const PAGE: string[] = [
  '...ZZZZ...',
  '..ZZZZZZ..',
  '.ZZZZZZZZ.',
  '...SSSS...',
  '...SESE...',
  '...SSSS...',
  '...SB.S...',
  '..ZZZZZZ..',
  '.ZZZZZZZZ.',
  '.ZZ.ZZ.ZZ.',
  '..ZZZZZZ..',
  '..SS..SS..',
]
const KNIGHT: string[] = [
  '..K.K.....',
  '..KZK.....',
  '.KZZZK....',
  '.KSSSK....',
  '..SESK....',
  '..SSSS....',
  '.ZZZZZZ...',
  'ZZZZZZZZ..',
  'ZZZZZZZZG.',
  '.ZZZZZZ.G.',
  '.ZZ..ZZ...',
  '..M..M....',
]
const QUEEN: string[] = [
  '..Y.Y.Y.Y...',
  '..YYYYYY....',
  '..LLLLLL....',
  '.LLSSSSLL...',
  '.LSSESSEL...',
  '.LLSBSSELL..',
  '..SSSSSS....',
  '..ZZZZZZ.RR.',
  '.ZZZZZZZZRR.',
  '.ZZLZZLZZ...',
  '.ZZZZZZZZ...',
  '.ZZZZZZZZ...',
]
const KING: string[] = [
  '.Y.Y.Y.Y.Y..',
  '.YYYYYYYY...',
  '..LLLLLL.G..',
  '.LLSSSSLL.M.',
  '.LSSESSEL.M.',
  '.LWWWWWWL.M.',
  '..SSSSSS..M.',
  '..ZZZZZZ..M.',
  '.ZZZZZZZZ.M.',
  '.ZZ.ZZ.ZZ...',
  '..ZZZZZZ....',
  '..SS..SS....',
]

const COURT_TEMPLATE: Record<string, string[]> = { page: PAGE, knight: KNIGHT, queen: QUEEN, king: KING }

/* ---------- 组装 ---------- */

function stamp(canvas: string[], sprite: string[], x: number, y: number): void {
  sprite.forEach((row, dy) => {
    const yy = y + dy
    if (yy < 0 || yy >= canvas.length) return
    const pad = canvas[yy]!.padEnd(24, '.').split('')
    row.split('').forEach((ch, dx) => {
      if (ch === '.') return
      const xx = x + dx
      if (xx >= 0 && xx < pad.length) pad[xx] = ch
    })
    canvas[yy] = pad.join('')
  })
}

function buildPipCard(suit: MinorSuit, n: number): string[] {
  const canvas: string[] = Array.from({ length: 26 }, () => '')
  for (const [x, y] of PIP_LAYOUT[n]!) stamp(canvas, SUIT_SPRITE[suit], x, y)
  return canvas
}

function buildCourt(suit: MinorSuit, rank: string): string[] {
  const accent = suit === 'wands' ? 'F' : suit === 'cups' ? 'U' : suit === 'swords' ? 'I' : 'A'
  return COURT_TEMPLATE[rank]!.map((r) => r.split('Z').join(accent))
}

/** 解析牌 id（如 'wands-7'、'cups-queen'）→ 像素画；非小阿卡纳返回 null */
export function getMinorArt(id: string): ArcanaArt | null {
  const sep = id.indexOf('-')
  if (sep < 0) return null
  const suit = id.slice(0, sep) as MinorSuit
  const rankRaw = id.slice(sep + 1)
  if (!(suit in SUIT_SPRITE)) return null
  if (rankRaw in COURT_TEMPLATE) {
    return { id: -1, rows: buildCourt(suit, rankRaw) }
  }
  const n = rankRaw === 'ace' ? 1 : Number(rankRaw)
  if (!Number.isInteger(n) || n < 1 || n > 10) return null
  return { id: -1, rows: buildPipCard(suit, n) }
}

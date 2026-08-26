/**
 * 像素画微着色：按邻接关系给每个色块计算落影/受光系数，
 * 让低密度像素精灵获得"体积感"——等效于一次程序化的手绘排线。
 * 规则：下边缘(邻格为空或异色)×0.86 落影；上边缘×1.07 受光；内部原色。
 */

export function shadeHex(hex: string, f: number): string {
  const n = hex.replace('#', '')
  const full = n.length === 3 ? n.split('').map((c) => c + c).join('') : n
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  const cl = (v: number): number => Math.max(0, Math.min(255, Math.round(v)))
  return `rgb(${cl(r * f)}, ${cl(g * f)}, ${cl(b * f)})`
}

export interface ShadedPixel {
  x: number
  y: number
  fill: string
}

export function shadedPixels(
  rows: readonly string[],
  palette: Record<string, string>,
  opts?: { dark?: number; lit?: number },
): ShadedPixel[] {
  const dark = opts?.dark ?? 0.86
  const lit = opts?.lit ?? 1.07
  const out: ShadedPixel[] = []

  const same = (y: number, x: number, ch: string): boolean => rows[y]?.[x] === ch

  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x]!
      const color = palette[ch]
      if (!color) continue
      let f = 1
      if (!same(y + 1, x, ch)) f = dark
      else if (!same(y - 1, x, ch)) f = lit
      out.push({ x, y, fill: f === 1 ? color : shadeHex(color, f) })
    }
  })
  return out
}

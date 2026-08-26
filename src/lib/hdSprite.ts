/**
 * HD 体素精灵管线：把基础像素画（~18×23）重建为高密度网格（F=2 时即 ≥36×46 档）。
 * - 每逻辑像素 → F×F 子像素；坐标单位 = 子像素
 * - 边缘检测：朝向空位的边缘环染描边色，轮廓利落
 * - 内部确定性噪声 + 纵向微渐变，消除色块感
 * - 输出直接喂 InstancedMesh（渲染端步长 = S/F）
 */

export interface HdVoxel {
  x: number
  y: number
  color: string
  isEye: boolean
}

export interface HdResult {
  voxels: HdVoxel[]
  cols: number
  rows: number
}

/** 简易确定性哈希：同位置每次刷新外观一致 */
function hash(x: number, y: number, salt: number): number {
  let h = (x * 374761393 + y * 668265263 + salt * 1274126177) >>> 0
  h = (h ^ (h >>> 13)) * 1274126177
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295
}

function shadeHex(hex: string, mul: number): string {
  const n = parseInt(hex.slice(1), 16)
  const r = Math.max(0, Math.min(255, Math.round(((n >> 16) & 255) * mul)))
  const g = Math.max(0, Math.min(255, Math.round(((n >> 8) & 255) * mul)))
  const b = Math.max(0, Math.min(255, Math.round((n & 255) * mul)))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

export function hdVoxels(
  sprite: string[],
  palette: Record<string, string>,
  opts: { F?: number; outline?: string; eyeChars?: string[]; salt?: number } = {},
): HdResult {
  const F = Math.max(1, opts.F ?? 2)
  const outline = opts.outline ?? '#151232'
  const eyeChars = new Set(opts.eyeChars ?? ['E'])
  const salt = opts.salt ?? 1

  const cols = Math.max(...sprite.map((r) => r.length))
  const rows = sprite.length

  // 像素→字符 映射（含边界查询）
  const cell = new Map<string, string>()
  sprite.forEach((raw, y) => {
    raw.padEnd(cols, '.').split('').forEach((ch, x) => {
      if (ch !== '.') cell.set(`${x},${y}`, ch)
    })
  })
  const at = (x: number, y: number): string | undefined => cell.get(`${x},${y}`)

  const voxels: HdVoxel[] = []

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const ch = at(x, y)
      if (!ch) continue
      const baseColor = palette[ch]
      if (!baseColor) continue
      const isEye = eyeChars.has(ch)

      // 四邻是否为空（决定该侧边缘环）
      const emptyN = !at(x, y - 1)
      const emptyS = !at(x, y + 1)
      const emptyW = !at(x - 1, y)
      const emptyE = !at(x + 1, y)

      for (let sy = 0; sy < F; sy++) {
        for (let sx = 0; sx < F; sx++) {
          let c = baseColor
          // 边缘环：子像素位于朝空位的那一圈 → 描边色
          const onTop = emptyN && sy === 0
          const onBottom = emptyS && sy === F - 1
          const onLeft = emptyW && sx === 0
          const onRight = emptyE && sx === F - 1
          if (onTop || onBottom || onLeft || onRight) {
            c = outline
          } else {
            // 内部：确定性噪声 ±5% + 纵向 3% 渐变
            const noise = 0.95 + hash(x * F + sx, y * F + sy, salt) * 0.1
            const grad = 1 - (sy / (F - 1 || 1)) * 0.06
            c = shadeHex(baseColor, noise * grad)
          }
          voxels.push({
            x: x * F + sx,
            y: y * F + sy,
            color: c,
            isEye: isEye && !(onTop || onBottom || onLeft || onRight),
          })
        }
      }
    }
  }

  return { voxels, cols: cols * F, rows: rows * F }
}

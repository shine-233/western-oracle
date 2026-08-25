/**
 * 分享图生成：把一次占卜结果画成一张可以右键保存的星空卡片。
 * 纯 Canvas 绘制，无外部图片依赖。
 */

export interface ShareCardData {
  /** 主标题，如「三张牌阵 · 过去/现在/未来」 */
  title: string
  /** 副标题，如日期与问题 */
  subtitle?: string
  /** 正文段落 */
  lines: string[]
  footer?: string
}

const W = 900
const H = 1200

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const out: string[] = []
  for (const paragraph of text.split('\n')) {
    let line = ''
    for (const ch of paragraph) {
      if (ctx.measureText(line + ch).width > maxWidth && line !== '') {
        out.push(line)
        line = ch
      } else {
        line += ch
      }
    }
    out.push(line)
  }
  return out
}

export function generateShareCard(data: ShareCardData): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  const cute = '"ZCOOL KuaiLe", "Yuanti SC", sans-serif'
  const mono = '"Press Start 2P", monospace'

  // 背景：深夜渐变
  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#141132')
  bg.addColorStop(0.6, '#1b1642')
  bg.addColorStop(1, '#241a52')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // 星星
  for (let i = 0; i < 140; i++) {
    const x = Math.random() * W
    const y = Math.random() * H
    const r = Math.random() * 1.6 + 0.3
    ctx.globalAlpha = 0.25 + Math.random() * 0.65
    ctx.fillStyle = Math.random() < 0.82 ? '#ffe9c4' : '#ffb7dc'
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1

  // 边框
  ctx.strokeStyle = '#f5c86e'
  ctx.lineWidth = 5
  ctx.strokeRect(28, 28, W - 56, H - 56)
  ctx.strokeStyle = 'rgba(179, 166, 247, 0.55)'
  ctx.lineWidth = 1.6
  ctx.strokeRect(42, 42, W - 84, H - 84)

  // 角饰
  const corner = (x: number, y: number, sx: number, sy: number): void => {
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(sx, sy)
    ctx.fillStyle = '#f5c86e'
    ctx.font = `26px ${cute}`
    ctx.fillText('✦', -12, 8)
    ctx.restore()
  }
  corner(64, 74, 1, 1)
  corner(W - 64, 74, -1, 1)
  corner(64, H - 58, 1, -1)
  corner(W - 64, H - 58, -1, -1)

  // 标题
  ctx.textAlign = 'center'
  ctx.fillStyle = '#f5c86e'
  ctx.font = `44px ${cute}`
  let y = 150
  for (const line of wrapText(ctx, data.title, W - 160)) {
    ctx.fillText(line, W / 2, y)
    y += 58
  }

  // 副标题
  if (data.subtitle) {
    ctx.font = `20px ${mono}`
    ctx.fillStyle = '#b3a6f7'
    for (const line of wrapText(ctx, data.subtitle, W - 180)) {
      ctx.fillText(line, W / 2, y + 8)
      y += 32
    }
  }

  // 分隔线
  y += 18
  ctx.strokeStyle = 'rgba(245, 200, 110, 0.5)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(W / 2 - 130, y)
  ctx.lineTo(W / 2 + 130, y)
  ctx.stroke()
  ctx.fillStyle = '#ff9fce'
  ctx.font = `22px ${cute}`
  ctx.fillText('✧', W / 2, y + 30)
  y += 66

  // 正文
  ctx.textAlign = 'left'
  ctx.font = `26px ${cute}`
  ctx.fillStyle = '#efeaff'
  const maxW = W - 190
  for (const para of data.lines) {
    for (const line of wrapText(ctx, para, maxW)) {
      if (y > H - 170) break
      ctx.fillText(line, 95, y)
      y += 40
    }
    y += 14
    if (y > H - 170) {
      ctx.fillStyle = 'rgba(239, 234, 255, 0.45)'
      ctx.font = `20px ${cute}`
      ctx.fillText('……（完整解读见站点）', 95, Math.min(y, H - 150))
      break
    }
  }

  // 页脚
  ctx.textAlign = 'center'
  ctx.font = `18px ${mono}`
  ctx.fillStyle = 'rgba(179, 166, 247, 0.75)'
  ctx.fillText(data.footer ?? 'WESTERN ORACLE · 神谕', W / 2, H - 78)

  return canvas
}

/** 生成并触发下载 PNG */
export function downloadShareCard(data: ShareCardData): void {
  const canvas = generateShareCard(data)
  canvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `western-oracle-${Date.now()}.png`
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 4000)
  }, 'image/png')
}

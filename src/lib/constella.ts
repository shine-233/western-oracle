/**
 * 星链画布（借鉴 tsparticles「links」预设的连线粒子效果）：
 * - 全站覆盖：一条 canvas 铺满视口，任何页面（含未来新增模块）自动生效
 * - 漂移星点两两近距连线成星座网；指针附近的星被轻微吸引，并与指针连出更亮的金线
 * - z-index:-1 与 .starfield 同层策略：位于背景之上、内容之下，不挡点击
 * - 尊重 prefers-reduced-motion；标签页隐藏时暂停绘制；DPR 自适应、上限 2x
 */

const LINK_DIST = 110
const MOUSE_DIST = 160
const STAR_COLOR = '240, 235, 220'
const LINE_COLOR = '179, 166, 247'
const CURSOR_LINE_COLOR = '245, 200, 110'

interface Star {
  x: number
  y: number
  vx: number
  vy: number
}

export function installConstella(): void {
  if (typeof document === 'undefined') return
  if (document.getElementById('wo-constella')) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const canvas = document.createElement('canvas')
  canvas.id = 'wo-constella'
  const style = document.createElement('style')
  style.textContent = `
#wo-constella { position: fixed; inset: 0; z-index: -1; pointer-events: none; }`
  document.head.appendChild(style)
  document.body.prepend(canvas)

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  let W = window.innerWidth
  let H = window.innerHeight

  function resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    W = window.innerWidth
    H = window.innerHeight
    canvas.width = W * dpr
    canvas.height = H * dpr
    canvas.style.width = `${W}px`
    canvas.style.height = `${H}px`
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
  }
  resize()
  window.addEventListener('resize', resize)

  const N = Math.min(85, Math.max(42, Math.round((W * H) / 26000)))
  const stars: Star[] = Array.from({ length: N }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    vx: (Math.random() - 0.5) * 0.22,
    vy: (Math.random() - 0.5) * 0.22,
  }))

  const mouse = { x: -9999, y: -9999 }
  function onMove(e: PointerEvent): void {
    mouse.x = e.clientX
    mouse.y = e.clientY
  }
  function onLeave(): void {
    mouse.x = -9999
    mouse.y = -9999
  }
  window.addEventListener('pointermove', onMove, { passive: true })
  document.documentElement.addEventListener('pointerleave', onLeave)

  function step(): void {
    ctx!.clearRect(0, 0, W, H)

    for (const s of stars) {
      // 指针吸引：近处的星被轻轻拉向光标（速度封顶防甩飞）
      const dxm = mouse.x - s.x
      const dym = mouse.y - s.y
      const dm2 = dxm * dxm + dym * dym
      if (dm2 < MOUSE_DIST * MOUSE_DIST && dm2 > 1) {
        const dm = Math.sqrt(dm2)
        s.vx += (dxm / dm) * 0.012
        s.vy += (dym / dm) * 0.012
      }
      const sp2 = s.vx * s.vx + s.vy * s.vy
      if (sp2 > 0.36) {
        const k = 0.6 / Math.sqrt(sp2)
        s.vx *= k
        s.vy *= k
      }
      s.x += s.vx
      s.y += s.vy
      if (s.x < -12) s.x = W + 12
      else if (s.x > W + 12) s.x = -12
      if (s.y < -12) s.y = H + 12
      else if (s.y > H + 12) s.y = -12
    }

    // 星星之间的连线（links 预设的核心视觉）
    ctx!.lineWidth = 1
    for (let i = 0; i < stars.length; i++) {
      const a = stars[i]!
      for (let j = i + 1; j < stars.length; j++) {
        const b = stars[j]!
        const dx = a.x - b.x
        const dy = a.y - b.y
        const d2 = dx * dx + dy * dy
        if (d2 >= LINK_DIST * LINK_DIST) continue
        const alpha = (1 - Math.sqrt(d2) / LINK_DIST) * 0.3
        ctx!.strokeStyle = `rgba(${LINE_COLOR}, ${alpha.toFixed(3)})`
        ctx!.beginPath()
        ctx!.moveTo(a.x, a.y)
        ctx!.lineTo(b.x, b.y)
        ctx!.stroke()
      }
    }

    // 指针与近处星星的金色连线（grab 交互）
    if (mouse.x > 0) {
      for (const s of stars) {
        const dx = s.x - mouse.x
        const dy = s.y - mouse.y
        const d2 = dx * dx + dy * dy
        if (d2 >= MOUSE_DIST * MOUSE_DIST) continue
        const alpha = (1 - Math.sqrt(d2) / MOUSE_DIST) * 0.5
        ctx!.strokeStyle = `rgba(${CURSOR_LINE_COLOR}, ${alpha.toFixed(3)})`
        ctx!.beginPath()
        ctx!.moveTo(mouse.x, mouse.y)
        ctx!.lineTo(s.x, s.y)
        ctx!.stroke()
      }
    }

    // 星点本体
    ctx!.fillStyle = `rgba(${STAR_COLOR}, 0.75)`
    for (const s of stars) {
      ctx!.beginPath()
      ctx!.arc(s.x, s.y, 1.1, 0, Math.PI * 2)
      ctx!.fill()
    }
  }

  function loop(): void {
    if (!document.hidden) step()
    requestAnimationFrame(loop)
  }
  loop()
}

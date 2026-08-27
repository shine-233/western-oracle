<script setup lang="ts">
/**
 * 物理抽牌桌原型（matter.js 式手感，零依赖 verlet 实现）。
 * 卡片受重力下落、可抓取甩出、互相碰撞堆叠、墙壁反弹。
 * 定位：已挂进街机页（/arcade 物理桌页签）作为可甩卡的实体牌桌玩法。
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { locale } from '../lib/i18n'

interface PhysCard {
  x: number
  y: number
  w: number
  h: number
  vx: number
  vy: number
  rot: number
  vr: number
  glyph: string
  accent: string
}

const wrapRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

const GLYPHS = ['✦', '☽', '☉', '☿', '♀', '♃', '♄', '♆', '♇', '☄', 'ᛟ', '☯']
const ACCENTS = ['#f5c86e', '#ff9fce', '#7de8c3', '#b3a6f7', '#7db8ff', '#ffb37a']

let cards: PhysCard[] = []
let ctx: CanvasRenderingContext2D | null = null
let raf = 0
let last = 0
let W = 0
let H = 0
let dragIdx = -1
let dragDX = 0
let dragDY = 0
let lastPX = 0
let lastPY = 0
let lastPT = 0

function spawn(n: number): void {
  cards = Array.from({ length: n }, (_, i) => ({
    x: W / 2 + (Math.random() - 0.5) * W * 0.55,
    y: -40 - i * 95,
    w: 74,
    h: 112,
    vx: (Math.random() - 0.5) * 80,
    vy: Math.random() * 40,
    rot: (Math.random() - 0.5) * 0.6,
    vr: (Math.random() - 0.5) * 2.4,
    glyph: GLYPHS[i % GLYPHS.length]!,
    accent: ACCENTS[i % ACCENTS.length]!,
  }))
}

function resize(): void {
  const cv = canvasRef.value
  const wrap = wrapRef.value
  if (!cv || !wrap) return
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  W = Math.min(wrap.clientWidth, 720)
  H = Math.max(360, Math.round(Math.min(window.innerHeight * 0.62, 560)))
  cv.width = Math.round(W * dpr)
  cv.height = Math.round(H * dpr)
  cv.style.width = `${W}px`
  cv.style.height = `${H}px`
  ctx = cv.getContext('2d')
}

function step(dt: number): void {
  for (let i = 0; i < cards.length; i++) {
    if (i === dragIdx) continue
    const c = cards[i]!
    c.vy += 1500 * dt
    c.vx *= 0.995
    c.x += c.vx * dt
    c.y += c.vy * dt
    c.rot += c.vr * dt
    c.vr *= 0.985
    const hw = c.w / 2
    const hh = c.h / 2
    if (c.x < hw) {
      c.x = hw
      c.vx = Math.abs(c.vx) * 0.55
    } else if (c.x > W - hw) {
      c.x = W - hw
      c.vx = -Math.abs(c.vx) * 0.55
    }
    if (c.y > H - hh) {
      c.y = H - hh
      c.vy = -Math.abs(c.vy) * 0.5
      c.vx *= 0.92
      c.vr *= 0.9
    } else if (c.y < hh) {
      c.y = hh
      c.vy = Math.abs(c.vy) * 0.4
    }
  }
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      const a = cards[i]!
      const b = cards[j]!
      const dx = b.x - a.x
      const px = a.w / 2 + b.w / 2 - Math.abs(dx) - 6
      const dy = b.y - a.y
      const py = a.h / 2 + b.h / 2 - Math.abs(dy) - 6
      if (px <= 0 || py <= 0) continue
      if (px < py) {
        const s = (dx >= 0 ? 1 : -1) * px * 0.5
        a.x -= s
        b.x += s
        b.vx += s * 6
        a.vx -= s * 6
      } else {
        const s = (dy >= 0 ? 1 : -1) * py * 0.5
        a.y -= s
        b.y += s
        if (dy >= 0) {
          b.vy = Math.min(b.vy, 0)
          a.vy = Math.max(a.vy, 0)
        }
      }
    }
  }
}

function trace(c: PhysCard): void {
  ctx!.beginPath()
  ctx!.roundRect(-c.w / 2, -c.h / 2, c.w, c.h, 10)
}

function draw(): void {
  if (!ctx) return
  ctx.clearRect(0, 0, W, H)
  for (const c of cards) {
    ctx.save()
    ctx.translate(c.x, c.y)
    ctx.rotate(c.rot)
    ctx.shadowColor = 'rgba(0, 0, 0, .45)'
    ctx.shadowBlur = 12
    ctx.shadowOffsetY = 6
    ctx.fillStyle = '#241f47'
    trace(c)
    ctx.fill()
    ctx.shadowColor = 'transparent'
    ctx.lineWidth = 2.5
    ctx.strokeStyle = c.accent
    trace(c)
    ctx.stroke()
    ctx.fillStyle = c.accent
    ctx.font = '34px serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(c.glyph, 0, 4)
    ctx.restore()
  }
}

function loop(t: number): void {
  const dt = last === 0 ? 0.016 : Math.min(0.033, (t - last) / 1000)
  last = t
  step(dt)
  draw()
  raf = requestAnimationFrame(loop)
}

function pos(e: PointerEvent): { x: number; y: number } {
  const r = canvasRef.value!.getBoundingClientRect()
  return { x: e.clientX - r.left, y: e.clientY - r.top }
}

function onDown(e: PointerEvent): void {
  const p = pos(e)
  for (let i = cards.length - 1; i >= 0; i--) {
    const c = cards[i]!
    if (Math.abs(p.x - c.x) < c.w / 2 + 8 && Math.abs(p.y - c.y) < c.h / 2 + 8) {
      dragIdx = i
      dragDX = p.x - c.x
      dragDY = p.y - c.y
      lastPX = p.x
      lastPY = p.y
      lastPT = performance.now()
      canvasRef.value?.setPointerCapture(e.pointerId)
      return
    }
  }
}

function onMove(e: PointerEvent): void {
  if (dragIdx < 0) return
  const c = cards[dragIdx]!
  const p = pos(e)
  const now = performance.now()
  const dt = Math.max(8, now - lastPT) / 1000
  c.vx = ((p.x - lastPX) / dt) * 0.6
  c.vy = ((p.y - lastPY) / dt) * 0.6
  c.x = p.x - dragDX
  c.y = p.y - dragDY
  lastPX = p.x
  lastPY = p.y
  lastPT = now
}

function onUp(e: PointerEvent): void {
  if (dragIdx >= 0) canvasRef.value?.releasePointerCapture?.(e.pointerId)
  dragIdx = -1
}

let ro: ResizeObserver | null = null

onMounted(() => {
  resize()
  spawn(10)
  ro = new ResizeObserver(resize)
  if (wrapRef.value) ro.observe(wrapRef.value)
  raf = requestAnimationFrame(loop)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  ro?.disconnect()
})
</script>

<template>
  <div ref="wrapRef" class="pt-wrap">
    <canvas
      ref="canvasRef"
      @pointerdown.prevent="onDown"
      @pointermove="onMove"
      @pointerup="onUp"
      @pointercancel="onUp"
    />
    <p class="pt-hint">
      ✧ {{ locale === 'zh' ? '抓一张甩出去试试 —— 物理抽牌桌原型' : 'Grab a card and fling it — physics table prototype' }}
    </p>
  </div>
</template>

<style scoped>
.pt-wrap {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.pt-wrap canvas {
  touch-action: none;
  cursor: grab;
  max-width: 100%;
  border: 2px dashed rgba(179, 166, 247, 0.3);
  border-radius: 16px;
  background: radial-gradient(ellipse at 50% 120%, rgba(124, 107, 214, 0.14), transparent 65%);
}
.pt-wrap canvas:active { cursor: grabbing; }
.pt-hint {
  margin-top: 10px;
  color: var(--ink-dim);
  font-size: 0.82rem;
  letter-spacing: 0.06em;
}
</style>

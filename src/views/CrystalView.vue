<script setup lang="ts">
/**
 * 水晶球 · 今日一问
 * - canvas 球内星云粒子：闲时慢漂移，凝视时漩涡加速再揭晓
 * - 答案按「日期 + 问题」稳定生成：同一天问同一件事，答案不变
 * - 粒子颜色实时读取当前主题变量，换肤联动
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { locale } from '../lib/i18n'
import { tt, OMENS, CRYSTAL_GOODFOR, hashSeed } from '../lib/i18nExtra'
import { sfx } from '../lib/sfx'
import { sparkleFromEvent } from '../lib/sparkle'
import DecryptTitle from '../components/DecryptTitle.vue'

const question = ref('')
const gazing = ref(false)
const asked = ref(false)
const omenText = ref('')
const goodText = ref('')
const hourWin = ref('')
const askCount = ref(0)

const zh = computed(() => locale.value === 'zh')

interface CrystalLog {
  date: string
  asks: Record<string, { omen: number; good: number; hour: number }>
}
const LOG_KEY = 'wo.crystal'

function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

function loadLog(): CrystalLog {
  try {
    const raw = JSON.parse(localStorage.getItem(LOG_KEY) ?? 'null') as CrystalLog | null
    if (raw && raw.date === todayKey() && raw.asks) return raw
  } catch { /* ignore */ }
  return { date: todayKey(), asks: {} }
}

function saveLog(log: CrystalLog): void {
  try {
    localStorage.setItem(LOG_KEY, JSON.stringify(log))
  } catch { /* ignore */ }
}

/** 从主题 CSS 变量取颜色（canvas 不能直接用 var()） */
function cssVar(name: string, fallback: string): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}

/* ---------- canvas ---------- */
const canvasRef = ref<HTMLCanvasElement | null>(null)
let raf = 0
let ctx: CanvasRenderingContext2D | null = null
let W = 0
let H = 0

interface P {
  a: number
  r: number
  sp: number
  sz: number
  c: 0 | 1 | 2
}
let parts: P[] = []
let swirl = 1
let targetSwirl = 1
let mx = 0.5
let my = 0.5
const reducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

function resize(): void {
  const cv = canvasRef.value
  if (!cv) return
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const rect = cv.getBoundingClientRect()
  W = rect.width
  H = rect.height
  cv.width = W * dpr
  cv.height = H * dpr
  ctx = cv.getContext('2d')
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0)
}

function initParts(): void {
  parts = Array.from({ length: 72 }, () => ({
    a: Math.random() * Math.PI * 2,
    r: 0.12 + Math.random() * 0.78,
    sp: (0.0016 + Math.random() * 0.0042) * (Math.random() < 0.5 ? 1 : -1),
    sz: 0.8 + Math.random() * 2.4,
    c: Math.floor(Math.random() * 3) as 0 | 1 | 2,
  }))
}

function themeColors(): [string, string, string] {
  return [
    cssVar('--pink', '#ff9fce'),
    cssVar('--gold', '#f5c86e'),
    cssVar('--mint', '#7de8c3'),
  ]
}

function frame(): void {
  if (!ctx) return
  swirl += (targetSwirl - swirl) * 0.04
  const colors = themeColors()
  const cx = W / 2 + (mx - 0.5) * 8
  const cy = H / 2 + (my - 0.5) * 8
  const R = Math.min(W, H) / 2 - 6

  ctx.clearRect(0, 0, W, H)

  const base = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.1, cx, cy, R)
  base.addColorStop(0, cssVar('--void-2', '#1e1a45'))
  base.addColorStop(1, cssVar('--void-0', '#0d0b20'))
  ctx.fillStyle = base
  ctx.beginPath()
  ctx.arc(cx, cy, R, 0, Math.PI * 2)
  ctx.fill()

  for (const p of parts) {
    if (!reducedMotion) p.a += p.sp * swirl
    const rr = p.r * R * 0.92
    const x = cx + Math.cos(p.a) * rr
    const y = cy + Math.sin(p.a) * rr * 0.86
    ctx.globalAlpha = 0.35 + 0.45 * Math.abs(Math.sin(p.a * 2))
    ctx.fillStyle = colors[p.c]
    ctx.beginPath()
    ctx.arc(x, y, p.sz, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1

  const gloss = ctx.createRadialGradient(
    cx - R * 0.38, cy - R * 0.42, 2,
    cx - R * 0.38, cy - R * 0.42, R * 0.5,
  )
  gloss.addColorStop(0, 'rgba(255,255,255,0.28)')
  gloss.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gloss
  ctx.beginPath()
  ctx.arc(cx, cy, R, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = cssVar('--lavender', '#b3a6f7')
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.arc(cx, cy, R, 0, Math.PI * 2)
  ctx.stroke()

  if (!reducedMotion) raf = requestAnimationFrame(frame)
}

/* ---------- 提问 ---------- */
function pickAnswer(seedStr: string): { omen: number; good: number; hour: number } {
  let h = hashSeed(seedStr)
  const omen = h % OMENS.length
  h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0
  const good = h % CRYSTAL_GOODFOR.length
  h = Math.imul(h ^ (h >>> 13), 3266489917) >>> 0
  const startHour = 9 + (h % 12)
  return { omen, good, hour: startHour }
}

function ask(e?: MouseEvent): void {
  if (gazing.value || asked.value) return
  gazing.value = true
  sfx.whoosh()
  targetSwirl = reducedMotion ? 1 : 9

  const q = question.value.trim().toLowerCase()
  const seedStr = `${todayKey()}|${q}`
  const key = hashSeed(seedStr).toString(36)
  const log = loadLog()
  const res = log.asks[key] ?? pickAnswer(seedStr)
  log.asks[key] = res
  saveLog(log)
  askCount.value = Object.keys(log.asks).length

  const delay = reducedMotion ? 250 : 2100
  window.setTimeout(() => {
    const po = OMENS[res.omen]!
    const pg = CRYSTAL_GOODFOR[res.good]!
    omenText.value = zh.value ? po[0] : po[1]
    goodText.value = zh.value ? pg[0] : pg[1]
    hourWin.value = `${res.hour}:00 – ${(res.hour + 2) % 24}:00`
    asked.value = true
    gazing.value = false
    targetSwirl = 1
    sfx.ding()
    if (e) sparkleFromEvent(e, 14)
  }, delay)
}

function onMouse(e: MouseEvent): void {
  const rect = canvasRef.value?.getBoundingClientRect()
  if (!rect) return
  mx = (e.clientX - rect.left) / rect.width
  my = (e.clientY - rect.top) / rect.height
}

onMounted(() => {
  resize()
  initParts()
  frame()
  window.addEventListener('resize', resize)
})
onBeforeUnmount(() => {
  if (raf) cancelAnimationFrame(raf)
  window.removeEventListener('resize', resize)
})

const askLabel = computed(() => (gazing.value ? tt('crystal.gazing') : tt('crystal.ask')))
</script>

<template>
  <div class="page-root">
    <h2><DecryptTitle :text="tt('crystal.title')" /></h2>
    <p class="hint">{{ tt('crystal.hint') }}</p>

    <section class="panel crystal-layout" style="margin-top: 20px;">
      <div class="orb-side">
        <canvas
          ref="canvasRef"
          class="orb"
          @mousemove="onMouse"
        />
      </div>

      <div class="ask-side">
        <label class="field">
          <span>{{ zh ? '你的问题' : 'Your question' }}</span>
          <input
            v-model="question"
            type="text"
            :placeholder="tt('crystal.placeholder')"
            :disabled="asked || gazing"
            maxlength="60"
          />
        </label>
        <button v-if="!asked" class="btn gold" :disabled="gazing" @click="ask($event)">
          🔮 {{ askLabel }}
        </button>

        <Transition name="omen-pop">
          <div v-if="asked" class="omen-box bounce-in">
            <p class="omen-main">{{ omenText }}</p>
            <p class="omen-sub">✧ {{ tt('crystal.lucky') }}：{{ goodText }}</p>
            <p class="omen-sub">⏳ {{ tt('crystal.hour') }}：{{ hourWin }}</p>
            <p class="omen-hint">{{ tt('crystal.againTomorrow') }}</p>
          </div>
        </Transition>

        <p v-if="askCount > 0" class="hint count-hint">
          {{ tt('crystal.count', { n: askCount }) }}
        </p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.crystal-layout {
  display: grid;
  grid-template-columns: minmax(240px, 340px) 1fr;
  gap: 26px;
  align-items: center;
}
@media (max-width: 760px) {
  .crystal-layout { grid-template-columns: 1fr; }
}
.orb-side { display: flex; justify-content: center; }
.orb {
  width: 100%;
  max-width: 320px;
  aspect-ratio: 1;
  cursor: crosshair;
  filter: drop-shadow(0 10px 30px color-mix(in srgb, var(--lavender) 35%, transparent));
}
.ask-side { display: flex; flex-direction: column; gap: 14px; }

.omen-box {
  padding: 16px 18px;
  background: color-mix(in srgb, var(--gold) 7%, var(--void-0));
  border: 2px dashed color-mix(in srgb, var(--gold) 55%, transparent);
  border-radius: 12px;
}
.omen-main {
  margin: 0 0 10px;
  font-family: var(--cute);
  font-size: 1.15rem;
  line-height: 1.9;
  color: var(--gold-bright);
}
.omen-sub { margin: 4px 0; color: var(--ink); font-size: 0.92rem; }
.omen-hint { margin: 10px 0 0; color: var(--ink-dim); font-size: 0.8rem; font-style: italic; }
.count-hint { margin-top: 4px; opacity: 0.75; }

.omen-pop-enter-active { transition: all 0.45s cubic-bezier(0.34, 1.56, 0.64, 1); }
.omen-pop-enter-from { opacity: 0; transform: translateY(14px) scale(0.92); }
</style>

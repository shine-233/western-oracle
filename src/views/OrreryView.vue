<script setup lang="ts">
/** 实时太阳系天象仪：用真实天文历算的黄经驱动轨道动画。可加速时间，点击星体看详情。
 * v2：新增 three.js 真 3D 视角（球体行星/土星环/轨道拖尾/拖拽旋转缩放），平面星图保留为 HUD。 */
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref } from 'vue'
import { computeNatalChart } from '../lib/astrology'
import { L } from '../data/oracleArcade'
import { sparkleFromEvent } from '../lib/sparkle'
import { sfx } from '../lib/sfx'
import DecryptTitle from '../components/DecryptTitle.vue'

const Orrery3D = defineAsyncComponent(() => import('../components/Orrery3D.vue'))
const MascotCard = defineAsyncComponent(() => import('../components/MascotCard.vue'))

const viewMode = ref<'3d' | '2d'>('3d')

/* ---------- 3D 视角：拖拽倾斜 + 滚轮缩放（OrbitControls 的轻量平替） ---------- */
const REDUCED =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v))
}

const BASE_TILT_X = 8
const tiltX = ref(0)
const tiltY = ref(0)
const zoom = ref(1)
const orbitDragging = ref(false)
let lastPX = 0
let lastPY = 0
let downPX = 0
let downPY = 0
/** 双指捏合缩放（移动端） */
const ptrs = new Map<number, { x: number; y: number }>()
let pinchStart = 0
let pinchStartZoom = 1
let usedPinch = false

const stageStyle = computed(() => ({
  transform: `perspective(950px) rotateX(${(BASE_TILT_X + tiltX.value).toFixed(2)}deg) rotateY(${tiltY.value.toFixed(2)}deg) scale(${zoom.value.toFixed(3)})`,
}))

function ptrDist(): number {
  const list = [...ptrs.values()]
  return Math.hypot(list[0]!.x - list[1]!.x, list[0]!.y - list[1]!.y)
}

function onStageDown(e: PointerEvent): void {
  ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY })
  if (ptrs.size === 1) usedPinch = false
  if (REDUCED || e.button !== 0) return
  if (ptrs.size === 2) {
    pinchStart = ptrDist()
    pinchStartZoom = zoom.value
    usedPinch = true
    orbitDragging.value = false
    return
  }
  orbitDragging.value = true
  lastPX = e.clientX
  lastPY = e.clientY
  downPX = e.clientX
  downPY = e.clientY
  try {
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  } catch {
    /* noop */
  }
}

function onStageMove(e: PointerEvent): void {
  if (!ptrs.has(e.pointerId)) return
  ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY })
  if (ptrs.size >= 2 && pinchStart > 0) {
    zoom.value = clamp(pinchStartZoom * (ptrDist() / pinchStart), 0.62, 1.6)
    return
  }
  if (!orbitDragging.value) return
  const dx = e.clientX - lastPX
  const dy = e.clientY - lastPY
  lastPX = e.clientX
  lastPY = e.clientY
  tiltY.value = clamp(tiltY.value + dx * 0.25, -30, 30)
  tiltX.value = clamp(tiltX.value - dy * 0.16, -14, 42)
}

function onStageUp(e: PointerEvent): void {
  ptrs.delete(e.pointerId)
  if (ptrs.size < 2) pinchStart = 0
  if (ptrs.size === 0) {
    orbitDragging.value = false
    tiltX.value = 0
    tiltY.value = 0
  }
}

function onStageWheel(e: WheelEvent): void {
  if (REDUCED) return
  zoom.value = clamp(zoom.value * (e.deltaY < 0 ? 1.08 : 0.93), 0.62, 1.6)
}

/** 拖拽/捏合超过阈值就不当作点选行星 */
function wasDrag(e?: MouseEvent): boolean {
  if (usedPinch) return true
  if (!e || !downPX) return false
  return Math.hypot(e.clientX - downPX, e.clientY - downPY) > 6
}

interface Body {
  key: string
  glyph: string
  orbit: number
  color: string
  zh: string
  en: string
}

const CX = 330
const CY = 330

const BODIES: Body[] = [
  { key: 'Sun', glyph: '☉', orbit: 64, color: '#ffd76e', zh: '太阳', en: 'Sun' },
  { key: 'Mercury', glyph: '☿', orbit: 96, color: '#c9b8ff', zh: '水星', en: 'Mercury' },
  { key: 'Venus', glyph: '♀', orbit: 128, color: '#ff9fce', zh: '金星', en: 'Venus' },
  { key: 'Moon', glyph: '☽', orbit: 158, color: '#fff6ec', zh: '月亮', en: 'Moon' },
  { key: 'Mars', glyph: '♂', orbit: 188, color: '#ff8f6e', zh: '火星', en: 'Mars' },
  { key: 'Jupiter', glyph: '♃', orbit: 222, color: '#ffb37a', zh: '木星', en: 'Jupiter' },
  { key: 'Saturn', glyph: '♄', orbit: 256, color: '#e8dcae', zh: '土星', en: 'Saturn' },
  { key: 'Uranus', glyph: '♅', orbit: 288, color: '#7de8c3', zh: '天王星', en: 'Uranus' },
  { key: 'Neptune', glyph: '♆', orbit: 318, color: '#7ea6d6', zh: '海王星', en: 'Neptune' },
]

/** 展示用的短评（自包含，避免耦合语料结构） */
const BLURB: Record<string, [string, string]> = {
  Sun: ['你的主角剧本：意志与方向。', 'Your headline: will and direction.'],
  Moon: ['情绪的潮汐表，最诚实的你。', 'Your tides — the most honest you.'],
  Mercury: ['脑子、嘴和快递，全归它管。', 'Mind, mouth and logistics, Inc.'],
  Venus: ['喜欢什么、怎么去爱、觉得啥好看。', 'What you like, whom you love, what looks good.'],
  Mars: ['油门和脾气，行动力的总闸。', 'Throttle and temper — the action switchboard.'],
  Jupiter: ['运气放大器，也是膨胀剂。', 'A luck amplifier — and an inflator.'],
  Saturn: ['规则和作业，交了才有糖。', 'Rules and homework; sweets follow submission.'],
  Uranus: ['意外和灵感共用一根天线。', 'Surprises and inspiration share one antenna.'],
  Neptune: ['梦、艺术和迷雾滤镜。', 'Dreams, art and the mist filter.'],
}

/* ---------- 模拟时钟 ---------- */
const simTime = ref(new Date())
const speedIdx = ref(1)
const SPEEDS = [
  { label: ['‖ 暂停', '‖ Pause'], factor: 0 },
  { label: ['▷ 实时', '▷ Real time'], factor: 1 },
  { label: ['» 1天=12秒', '» 1 day = 12s'], factor: 7200 },
  { label: ['≫ 1月=20秒', '≫ 1 month = 20s'], factor: 130000 },
] as const

let timer: number | null = null
function tick(): void {
  const f = SPEEDS[speedIdx.value]!.factor
  if (f > 0) {
    simTime.value = new Date(simTime.value.getTime() + 250 * f)
  }
}
onMounted(() => {
  timer = window.setInterval(tick, 250)
})
onBeforeUnmount(() => {
  if (timer !== null) window.clearInterval(timer)
})

function setSpeed(i: number): void {
  speedIdx.value = i
  sfx.blip()
}

function setMode(m: '3d' | '2d'): void {
  viewMode.value = m
  sfx.blip()
}

/** 3D 组件的点选事件（无鼠标事件对象） */
function pick3d(key: string): void {
  pick(key)
}

/* ---------- 星历计算（节流：每 tick 一次） ---------- */
const positions = computed(() => {
  void simTime.value // 建立响应依赖
  const t = simTime.value
  let chart
  try {
    chart = computeNatalChart({
      year: t.getFullYear(),
      month: t.getMonth() + 1,
      day: t.getDate(),
      hour: t.getHours(),
      minute: t.getMinutes(),
      timezone: -t.getTimezoneOffset() / 60,
      latitude: 0,
      longitude: 0,
    })
  } catch {
    return []
  }
  return BODIES.map((b) => {
    const p = chart.planets.find((x) => x.name === b.key)
    const lon = p?.lon ?? 0
    const rad = ((lon - 90) * Math.PI) / 180 // 0°白羊放在正上方
    return {
      ...b,
      lon,
      degText: p?.degText ?? '',
      signCn: p?.signCn ?? '',
      retro: p?.retro ?? false,
      x: CX + b.orbit * Math.cos(rad),
      y: CY + b.orbit * Math.sin(rad),
    }
  })
})

/* ---------- 选中详情 ---------- */
const selectedKey = ref<string | null>(null)
const selected = computed(() => positions.value.find((p) => p.key === selectedKey.value))

function pick(key: string, e?: MouseEvent): void {
  if (wasDrag(e)) return
  selectedKey.value = selectedKey.value === key ? null : key
  sfx.blip()
  if (e) sparkleFromEvent(e, 5)
}

function resetNow(): void {
  simTime.value = new Date()
  sfx.blip()
}

const fmtDate = computed(() =>
  simTime.value.toLocaleString(localeTag(), { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
)

function localeTag(): string {
  return L(['zh-CN', 'en-US']) === 'zh-CN' ? 'zh-CN' : 'en-US'
}
</script>

<template>
  <div class="page-root">
    <h2><DecryptTitle :text="L(['实时天象仪', 'Live Orrery'])" /></h2>
    <p class="hint">{{ L([
      '一架开在你浏览器里的太阳系：行星位置由真实天文历算驱动。加速时间，看它们追着跑；点一颗星，看看它今天在哪个星座。',
      'A solar system in your browser, driven by real ephemeris math. Speed up time, watch them chase; tap a planet for today\'s sign.',
    ]) }}</p>

    <div class="orr-layout">
      <!-- 轨道图 -->
      <section class="panel stage">
        <div class="mode-row">
          <button class="mode-chip" :class="{ on: viewMode === '3d' }" @click="setMode('3d')">✦ 3D {{ L(['天象仪', 'Orrery']) }}</button>
          <button class="mode-chip" :class="{ on: viewMode === '2d' }" @click="setMode('2d')">✧ {{ L(['平面星图', 'Flat chart']) }}</button>
        </div>

        <!-- 真 3D：three.js 球体行星，拖拽环绕 / 滚轮缩放 / 点选星球 -->
        <Orrery3D v-if="viewMode === '3d'" :bodies="positions" :selected="selectedKey" @pick="pick3d" />

        <!-- 平面视图（保留倾斜拖拽彩蛋） -->
        <div
          v-show="viewMode === '2d'"
          class="orr-stage"
          :class="{ dragging: orbitDragging }"
          :style="stageStyle"
          @pointerdown="onStageDown"
          @pointermove="onStageMove"
          @pointerup="onStageUp"
          @pointercancel="onStageUp"
          @wheel.prevent="onStageWheel"
        >
          <!-- viewBox 660：海王星轨道 r=318，580 的旧画布会把它裁出画面 -->
          <svg viewBox="0 0 660 660" class="orr-svg">
            <!-- 白羊座标记在正上方 -->
            <text :x="CX" :y="24" text-anchor="middle" class="aries-mark">♈ 0°</text>
            <!-- 轨道圈 -->
            <circle v-for="b in BODIES" :key="'o' + b.key" :cx="CX" :cy="CY" :r="b.orbit" class="orbit-ring" />
            <!-- 太阳 -->
            <circle :cx="CX" :cy="CY" r="18" fill="#ffd76e" class="sun-core" />
            <!-- 行星 -->
            <g
              v-for="p in positions"
              :key="p.key"
              class="planet"
              :class="{ sel: selectedKey === p.key }"
              role="button"
              tabindex="0"
              :aria-label="`${L([p.zh, p.en])} · ${p.signCn} ${p.degText}${p.retro ? ' ℞' : ''}`"
              @click="pick(p.key, $event)"
              @keydown.enter.prevent="pick(p.key)"
              @keydown.space.prevent="pick(p.key)"
            >
              <circle :cx="p.x" :cy="p.y" r="14" fill="transparent" />
              <circle :cx="p.x" :cy="p.y" r="7.5" :fill="p.color" class="dot" />
              <text :x="p.x" :y="p.y + 1" text-anchor="middle" dominant-baseline="central" class="glyph">{{ p.glyph }}</text>
              <text v-if="p.retro" :x="p.x + 11" :y="p.y - 9" class="retro-mark">℞</text>
            </g>
          </svg>
        </div>
        <p v-if="viewMode === '2d'" class="stage-hint">{{ L(['拖拽倾斜 · 滚轮/双指缩放 · 点行星看详情', 'drag to tilt · wheel / pinch to zoom · tap planets']) }}</p>
        <p v-else class="stage-hint">{{ L(['拖拽环绕太阳系 · 滚轮拉近拉远 · 点星球看详情', 'drag to orbit the sun · scroll to zoom · tap planets']) }}</p>

        <div class="time-bar">
          <span class="sim-date">{{ fmtDate }}</span>
          <button
            v-for="(s, i) in SPEEDS"
            :key="i"
            class="speed-chip"
            :class="{ active: speedIdx === i }"
            @click="setSpeed(i)"
          >{{ L([s.label[0], s.label[1]]) }}</button>
          <button class="btn ghost small" @click="resetNow">{{ L(['回到此刻', 'Now']) }}</button>
        </div>
      </section>

      <!-- 详情 -->
      <section class="panel side-panel">
        <Transition name="slide-fade" mode="out-in">
          <div v-if="selected" :key="selected.key + selected.lon.toFixed(3)">
            <h3 class="sp-title"><span class="sp-glyph" :style="{ color: selected.color }">{{ selected.glyph }}</span> {{ L([selected.zh, selected.en]) }}</h3>
            <p class="sp-pos">
              {{ L(['当前落在', 'Currently in']) }}
              <strong>{{ selected.signCn }} {{ selected.degText }}</strong>
              <span v-if="selected.retro" class="retro-tag">℞ {{ L(['逆行中', 'retrograde']) }}</span>
            </p>
            <p class="sp-blurb">{{ L(BLURB[selected.key]!) }}</p>
            <p class="hint sp-note">
              {{ L([
                '小知识：占星用的是"地心视运动"，所以这里太阳也绕着地球转——古人看得开心就好。',
                'Astrology uses geocentric apparent motion, so yes, the Sun orbits Earth here. The ancients would be delighted.',
              ]) }}
            </p>
          </div>
          <div v-else key="empty">
            <h3 class="sp-title">{{ L(['点一颗行星试试', 'Tap any planet']) }}</h3>
            <p class="hint">
              {{ L([
                '内圈是快行星（月亮两三天就走一个星座），外圈是慢行星（海王星要十四年）。快慢搭配，就是"运"的节奏感。',
                'Inner planets sprint — the Moon changes signs every couple of days; outers crawl for decades. That mix is the rhythm of "luck".',
              ]) }}
            </p>
          </div>
        </Transition>
        <MascotCard id="owl" :height="190" />
      </section>
    </div>
  </div>
</template>

<style scoped>
.orr-layout {
  display: grid;
  grid-template-columns: minmax(300px, 1.15fr) minmax(260px, 0.85fr);
  gap: 20px;
  margin-top: 18px;
}
@media (max-width: 860px) { .orr-layout { grid-template-columns: 1fr; } }

.stage { display: flex; flex-direction: column; align-items: center; }
.mode-row { display: flex; gap: 8px; margin-bottom: 12px; }
.mode-chip {
  padding: 5px 14px;
  border-radius: 999px;
  border: 1.5px solid rgba(179, 166, 247, 0.35);
  background: transparent;
  color: var(--ink-dim);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
}
.mode-chip:hover { color: var(--gold-bright); border-color: var(--gold); }
.mode-chip.on { background: rgba(245, 200, 110, 0.14); border-color: var(--gold); color: var(--gold-bright); }
.orr-stage {
  width: 100%;
  max-width: 560px;
  transform-style: preserve-3d;
  will-change: transform;
  cursor: grab;
  touch-action: pan-y;
  transition: transform 0.7s cubic-bezier(0.22, 0.61, 0.36, 1);
}
.orr-stage.dragging {
  cursor: grabbing;
  transition: none;
}
.stage-hint {
  margin: 10px 0 0;
  font-family: var(--pixel);
  font-size: 0.55rem;
  letter-spacing: 0.1em;
  color: var(--ink-dim);
  opacity: 0.75;
}
@media (prefers-reduced-motion: reduce) {
  .orr-stage { transition: none; }
}
.orr-svg { width: 100%; display: block; }
.aries-mark { fill: var(--gold-bright); font-size: 14px; opacity: 0.85; }
.orbit-ring {
  fill: none;
  stroke: rgba(179, 166, 247, 0.16);
  stroke-width: 1;
  stroke-dasharray: 2 5;
}
.sun-core {
  filter: drop-shadow(0 0 18px rgba(255, 215, 110, 0.85));
  animation: sun-breathe 4s ease-in-out infinite;
}
@keyframes sun-breathe { 50% { filter: drop-shadow(0 0 30px rgba(255, 215, 110, 1)); } }

.planet { cursor: pointer; }
.planet .dot {
  transition: filter 0.2s, transform 0.2s;
  transform-box: fill-box;
  transform-origin: center;
}
.planet:hover .dot { transform: scale(1.45); filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.8)); }
.planet.sel .dot { transform: scale(1.6); filter: drop-shadow(0 0 10px currentColor); }
.glyph { font-size: 11px; fill: #1d1838; font-weight: bold; pointer-events: none; }
.retro-mark { font-size: 10px; fill: var(--danger); }

.time-bar {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 12px;
}
.sim-date {
  font-family: var(--pixel);
  font-size: 0.62rem;
  color: var(--gold-bright);
  margin-right: 6px;
}
.speed-chip {
  padding: 4px 12px;
  border-radius: 999px;
  border: 1.5px solid rgba(179, 166, 247, 0.35);
  background: transparent;
  color: var(--ink-dim);
  font-size: 0.78rem;
  cursor: pointer;
  transition: all 0.2s;
}
.speed-chip:hover { color: var(--gold-bright); border-color: var(--gold); }
.speed-chip.active { background: rgba(245, 200, 110, 0.14); border-color: var(--gold); color: var(--gold-bright); }

.side-panel { min-height: 280px; }
.sp-title { margin: 0 0 12px; font-family: var(--cute); font-weight: 400; font-size: 1.25rem; color: var(--gold-bright); display: flex; align-items: center; gap: 10px; }
.sp-glyph { font-size: 1.7rem; }
.sp-pos { font-size: 1rem; color: var(--ink); margin: 0 0 10px; }
.sp-pos strong { color: var(--gold-bright); }
.retro-tag {
  display: inline-block;
  margin-left: 8px;
  padding: 1px 10px;
  border-radius: 999px;
  border: 1.5px dashed var(--danger);
  color: var(--danger);
  font-size: 0.78rem;
}
.sp-blurb { line-height: 1.95; color: var(--ink); margin: 0 0 12px; }
.sp-note { border-top: 1px dashed rgba(179, 166, 247, 0.3); padding-top: 10px; }

.slide-fade-enter-active { transition: all 0.32s cubic-bezier(0.34, 1.4, 0.64, 1); }
.slide-fade-leave-active { transition: all 0.15s ease; }
.slide-fade-enter-from { opacity: 0; transform: translateX(16px); }
.slide-fade-leave-to { opacity: 0; transform: translateX(-8px); }

@media (prefers-reduced-motion: reduce) {
  .sun-core { animation: none; }
}
</style>

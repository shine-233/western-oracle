<script setup lang="ts">
/** 节律三重奏：从生日推算体力(23天)/情绪(28天)/智力(33天)三条正弦曲线。
 *  可拖动时间轴查看任意一天，自动标出"临界日"。纯数学，纯本地。 */
import { computed, ref } from 'vue'
import { L } from '../data/oracleArcade'
import { loadJSON } from '../lib/storage'
import { sparkleFromEvent } from '../lib/sparkle'
import { sfx } from '../lib/sfx'
import { addHistory } from '../lib/history'
import DecryptTitle from '../components/DecryptTitle.vue'

const birth = ref<string>(loadJSON<{ date?: string }>('num-profile', {}).date ?? '')
const submitted = ref(false)

const WINDOW_DAYS = 30 // 显示窗口：今天前后各15天

function parseBirth(): Date | null {
  const [y, m, d] = birth.value.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

/** 从出生到某天的天数（含当天为第1天） */
function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / 86400000)
}

interface Rhythm {
  key: string
  period: number
  color: string
  zh: string
  en: string
  zhHigh: string
  enHigh: string
  zhLow: string
  enLow: string
}

const RHYTHMS: Rhythm[] = [
  {
    key: 'physical', period: 23, color: '#ff8f6e', zh: '体力', en: 'Physical',
    zhHigh: '身体在线，适合把费力气的事排上来。',
    enHigh: 'Body online — schedule the heavy lifting.',
    zhLow: '电量偏低，别硬撑，拉伸和早睡更划算。',
    enLow: 'Battery low — stretch, sleep early, skip heroics.',
  },
  {
    key: 'emotional', period: 28, color: '#ff9fce', zh: '情绪', en: 'Emotional',
    zhHigh: '心情通透，适合谈心、表白、修复关系。',
    enHigh: 'Clear skies inside — good day for heart-to-hearts.',
    zhLow: '容易上头，重要对话先写草稿再发。',
    enLow: 'Trigger-happy feelings; draft before you send.',
  },
  {
    key: 'mental', period: 33, color: '#7de8c3', zh: '智力', en: 'Mental',
    zhHigh: '脑子转得飞快，攻坚、学新东西就今天。',
    enHigh: 'Brain at full RPM — tackle hard problems today.',
    zhLow: '理解力打八折，机械活儿比烧脑活儿合适。',
    enLow: 'Comprehension at 80% — rote tasks beat deep work.',
  },
]

/** 时间轴上的选中日期（默认今天） */
const selectedOffset = ref(0) // 相对今天的天数
const selectedDate = computed(() => {
  const d = new Date()
  d.setDate(d.getDate() + selectedOffset.value)
  return d
})

function valueAt(rhythm: Rhythm, date: Date): number | null {
  const b = parseBirth()
  if (!b) return null
  const days = daysBetween(b, date)
  if (days < 0) return null
  return Math.sin((2 * Math.PI * days) / rhythm.period)
}

function fmtDay(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`
}

/* ---------- 曲线坐标 ---------- */
const W = 640
const H = 220
const PAD_L = 34

const dayPoints = computed(() => {
  const out: Array<{ offset: number; date: Date }> = []
  for (let i = -Math.floor(WINDOW_DAYS / 2); i <= Math.floor(WINDOW_DAYS / 2); i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    out.push({ offset: i, date: d })
  }
  return out
})

function toX(offset: number): number {
  return PAD_L + ((offset + WINDOW_DAYS / 2) / WINDOW_DAYS) * (W - PAD_L - 12)
}

function toY(v: number): number {
  return H / 2 - v * (H / 2 - 18)
}

const curves = computed(() =>
  RHYTHMS.map((r) => {
    const pts = dayPoints.value.map(({ offset, date }) => {
      const v = valueAt(r, date)
      return `${toX(offset)},${toY(v ?? 0)}`
    })
    return { ...r, points: pts.join(' ') }
  }),
)

/* ---------- 临界日检测（曲线过零点） ---------- */
const criticalDays = computed(() => {
  const marks: Array<{ offset: number; x: number }> = []
  const list = dayPoints.value
  for (let i = 1; i < list.length; i++) {
    // 三条曲线任一过零即记（用符号变化判断）
    for (const r of RHYTHMS) {
      const a = valueAt(r, list[i - 1]!.date)
      const c = valueAt(r, list[i]!.date)
      if (a !== null && c !== null && a * c <= 0 && Math.abs(a) > 0.02) {
        marks.push({ offset: list[i]!.offset, x: toX(list[i]!.offset) })
        break
      }
    }
  }
  return marks
})

/* ---------- 当日读数 ---------- */
const readings = computed(() =>
  RHYTHMS.map((r) => {
    const v = valueAt(r, selectedDate.value)
    const val = v ?? 0
    let stateZh = '平稳期'
    let stateEn = 'steady'
    if (val > 0.5) { stateZh = '高峰'; stateEn = 'peak' }
    else if (val > 0.05) { stateZh = '上升'; stateEn = 'rising' }
    else if (val < -0.5) { stateZh = '低谷'; stateEn = 'low' }
    else if (val < -0.05) { stateZh = '回落'; stateEn = 'easing' }
    return { ...r, val, pct: Math.round(((val + 1) / 2) * 100), stateZh, stateEn }
  }),
)

function onSubmit(e?: MouseEvent): void {
  if (!parseBirth()) return
  submitted.value = true
  sfx.ding()
  if (e) sparkleFromEvent(e, 10)
  const b = parseBirth()
  addHistory({
    type: 'biorhythm',
    label: '生物节律',
    summary: `以 ${b!.getFullYear()}-${b!.getMonth() + 1}-${b!.getDate()} 起算，23/28/33 天三节律已展开`,
  })
}

/* ---------- SVG 直接拖拽 / 悬停十字线 ---------- */
const svgEl = ref<SVGSVGElement | null>(null)
const hoverOffset = ref<number | null>(null)
let scrubbing = false

function clientToOffset(clientX: number): number | null {
  const el = svgEl.value
  if (!el) return null
  const rect = el.getBoundingClientRect()
  const sx = ((clientX - rect.left) / rect.width) * W
  const off = Math.round(((sx - PAD_L) / (W - PAD_L - 12)) * WINDOW_DAYS - WINDOW_DAYS / 2)
  return Math.max(-WINDOW_DAYS / 2, Math.min(WINDOW_DAYS / 2, off))
}

function svgDown(e: PointerEvent): void {
  const off = clientToOffset(e.clientX)
  if (off === null) return
  scrubbing = true
  selectedOffset.value = off
  sfx.blip()
}

function svgMove(e: PointerEvent): void {
  const off = clientToOffset(e.clientX)
  if (off === null) return
  hoverOffset.value = off
  if (scrubbing) selectedOffset.value = off
}

function svgUp(): void {
  scrubbing = false
}

function svgLeave(): void {
  hoverOffset.value = null
  scrubbing = false
}

const hoverVals = computed(() =>
  hoverOffset.value === null
    ? []
    : RHYTHMS.map((r) => {
        const d = new Date()
        d.setDate(d.getDate() + hoverOffset.value!)
        return { key: r.key, color: r.color, y: toY(valueAt(r, d) ?? 0), pct: Math.round((((valueAt(r, d) ?? 0) + 1) / 2) * 100) }
      }),
)

const hoverDateText = computed(() =>
  hoverOffset.value === null ? '' : fmtDay(selectedDateFor(hoverOffset.value)),
)

function selectedDateFor(off: number): Date {
  const d = new Date()
  d.setDate(d.getDate() + off)
  return d
}
</script>

<template>
  <div class="page-root">
    <h2><DecryptTitle :text="L(['节律三重奏', 'Biorhythm Trio'])" /></h2>
    <p class="hint">{{ L([
      '老派但好玩的理论：从出生那天起，体力、情绪、智力各按 23/28/33 天画正弦波。填入生日，拖动时间轴，看看哪天适合谈事、哪天适合躺平。',
      'An old-school theory: from birth, body/mind/mood ride 23/28/33-day waves. Enter your birthday, scrub the timeline, plan accordingly.',
    ]) }}</p>

    <section class="panel" style="margin-top: 18px;">
      <div class="form-row">
        <label class="field"><span>{{ L(['你的生日', 'Your birthday']) }}</span>
          <input v-model="birth" type="date" />
        </label>
        <button class="btn" :disabled="!birth" @click="onSubmit($event)">
          {{ submitted ? L(['重新生成', 'Recalculate']) : L(['生成我的节律', 'Reveal my rhythms']) }}
        </button>
      </div>
    </section>

    <template v-if="submitted">
      <!-- 图表 -->
      <section class="panel chart-panel bounce-in">
        <svg
          ref="svgEl"
          :viewBox="`0 0 ${W} ${H}`"
          class="bio-svg"
          @pointerdown="svgDown"
          @pointermove="svgMove"
          @pointerup="svgUp"
          @pointercancel="svgUp"
          @pointerleave="svgLeave"
        >
          <!-- 网格与零轴 -->
          <line :x1="PAD_L" :y1="H / 2" :x2="W - 8" :y2="H / 2" stroke="rgba(179,166,247,0.3)" stroke-width="1" />
          <!-- 临界日标记 -->
          <g v-for="(m, i) in criticalDays" :key="'c' + i">
            <line :x1="m.x" :y1="14" :x2="m.x" :y2="H - 10" stroke="rgba(255,143,110,0.25)" stroke-dasharray="3 4" />
          </g>
          <!-- 三条曲线 -->
          <polyline
            v-for="c in curves"
            :key="c.key"
            :points="c.points"
            fill="none"
            :stroke="c.color"
            stroke-width="2"
            stroke-linejoin="round"
            class="curve"
          />
          <!-- 今天竖线 -->
          <line
            :x1="toX(0)" :y1="10" :x2="toX(0)" :y2="H - 10"
            stroke="#ffe3a8" stroke-width="1.5" opacity="0.9"
          />
          <!-- 悬停十字线 + 三线读数点 -->
          <g v-if="hoverOffset !== null" class="hover-x">
            <line :x1="toX(hoverOffset)" y1="10" :x2="toX(hoverOffset)" :y2="H - 10" stroke="rgba(255,255,255,0.35)" stroke-dasharray="2 4" />
            <circle
              v-for="hv in hoverVals"
              :key="hv.key"
              :cx="toX(hoverOffset!)"
              :cy="hv.y"
              r="4.5"
              :fill="hv.color"
              class="hover-dot"
            />
            <text :x="Math.min(Math.max(toX(hoverOffset!), PAD_L + 26), W - 40)" y="22" text-anchor="middle" class="hover-date">{{ hoverDateText }}</text>
          </g>
          <!-- 拖动手柄（随选中日移动） -->
          <g class="scrub">
            <line
              :x1="toX(selectedOffset)" :y1="10" :x2="toX(selectedOffset)" :y2="H - 10"
              stroke="#fff" stroke-width="1" opacity="0.55"
            />
            <circle :cx="toX(selectedOffset)" :cy="20" r="6" fill="#fff" />
          </g>
        </svg>

        <input
          v-model.number="selectedOffset"
          type="range"
          :min="-WINDOW_DAYS / 2"
          :max="WINDOW_DAYS / 2"
          step="1"
          class="timeline"
        />

        <div class="date-row">
          <span class="sim-date">{{ fmtDay(selectedDate) }} {{ L(['选中', 'selected']) }}</span>
          <span class="legend-item" v-for="r in RHYTHMS" :key="r.key">
            <i class="swatch" :style="{ background: r.color }" />{{ L([r.zh, r.en]) }}
          </span>
        </div>
      </section>

      <!-- 当日三卡 -->
      <div class="trio-grid">
        <section v-for="r in readings" :key="r.key" class="panel trio-card drop-in">
          <header class="tc-head">
            <i class="swatch big" :style="{ background: r.color }" />
            <strong>{{ L([r.zh, r.en]) }}</strong>
            <span class="state-tag">{{ L([r.stateZh, r.stateEn]) }}</span>
          </header>
          <p class="pct">{{ r.pct }}<small>%</small></p>
          <p class="advice">{{ r.val > 0 ? L([r.zhHigh, r.enHigh]) : L([r.zhLow, r.enLow]) }}</p>
        </section>
      </div>

      <ApprenticeReact module="biorhythm" :score="Math.round(readings.reduce((s, r) => s + r.pct, 0) / 3)" />
      <p class="hint" style="text-align: center; margin-top: 16px;">
        {{ L([
          '橙色虚线是"临界日"——曲线过零，状态切换的当口，开车开会都多留个心眼。',
          'Orange dashes mark critical days — curves crossing zero. Double-check things those days.',
        ]) }}
      </p>
    </template>
  </div>
</template>

<style scoped>
.chart-panel { margin-top: 16px; }
.bio-svg { width: 100%; display: block; cursor: ew-resize; touch-action: pan-y; user-select: none; }
.hover-dot { filter: drop-shadow(0 0 5px currentColor); animation: hover-pop 0.18s cubic-bezier(0.34, 1.56, 0.64, 1); }
@keyframes hover-pop { from { r: 0; opacity: 0; } }
.hover-date {
  font-family: var(--pixel);
  font-size: 11px;
  fill: var(--gold-bright);
  pointer-events: none;
}
.curve {
  filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.15));
  animation: curve-draw 1.4s ease-out both;
  stroke-dasharray: 2000;
  stroke-dashoffset: 2000;
}
@keyframes curve-draw { to { stroke-dashoffset: 0; } }

.timeline {
  width: 100%;
  margin-top: 6px;
  accent-color: var(--gold);
  cursor: ew-resize;
}
.date-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  margin-top: 8px;
}
.sim-date { font-family: var(--pixel); font-size: 0.62rem; color: var(--gold-bright); }
.legend-item { display: inline-flex; align-items: center; gap: 6px; font-size: 0.8rem; color: var(--ink-dim); }
.swatch { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
.swatch.big { width: 14px; height: 14px; box-shadow: 0 0 10px currentColor; }

.trio-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
  margin-top: 16px;
}
.tc-head { display: flex; align-items: center; gap: 10px; }
.tc-head strong { color: var(--gold-bright); font-family: var(--cute); font-weight: 400; font-size: 1.1rem; }
.state-tag {
  margin-left: auto;
  font-size: 0.75rem;
  padding: 2px 12px;
  border-radius: 999px;
  border: 1.5px solid rgba(179, 166, 247, 0.45);
  color: var(--lavender-soft);
}
.pct {
  font-family: var(--cute);
  font-size: 2.4rem;
  color: #fff;
  margin: 10px 0 4px;
}
.pct small { font-size: 1rem; color: var(--ink-dim); }
.advice { margin: 0; line-height: 1.85; font-size: 0.88rem; color: var(--ink); }

@media (prefers-reduced-motion: reduce) {
  .curve { animation: none; stroke-dashoffset: 0; }
}
</style>

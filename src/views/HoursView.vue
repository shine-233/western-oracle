<script setup lang="ts">
/**
 * 行星时 · 今日择时
 * - 日出日落由本地算法计算；24 个行星时按迦勒底次序轮值
 * - 时间轴 24 格：日间暖色 / 夜间冷色，当前时辰呼吸高亮，点击看宜忌
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { CITY_PRESETS } from '../lib/astrology'
import { PLANETS } from '../data/corpus'
import {
  planetaryHours,
  currentPlanetHour,
  riseSet,
  type PlanetaryHour,
} from '../lib/planetaryHours'
import { loadJSON, saveJSON } from '../lib/storage'
import { tt, ACTIVITY_PLANETS } from '../lib/i18nExtra'
import { PLANET_GOOD, PLANET_AVOID } from '../lib/i18nExtra'
import { locale } from '../lib/i18n'
import { sfx } from '../lib/sfx'
import { sparkleFromEvent } from '../lib/sparkle'
import DecryptTitle from '../components/DecryptTitle.vue'

interface LocForm {
  cityIndex: number
  lat: number
  lng: number
}
const saved = loadJSON<Partial<LocForm>>('hours-loc', {})
const loc = ref<LocForm>({
  cityIndex: saved.cityIndex ?? -1,
  lat: saved.lat ?? 39.9042,
  lng: saved.lng ?? 116.4074,
})

const hours = ref<PlanetaryHour[]>([])
const selected = ref<PlanetaryHour | null>(null)
const nowTick = ref(Date.now())
let timer: number | null = null

const geoBusy = ref(false)

function recompute(): void {
  hours.value = planetaryHours(new Date(), loc.value.lat, loc.value.lng)
  if (!selected.value) selected.value = currentPlanetHour(hours.value)
}

function onCityChange(): void {
  const p = CITY_PRESETS[loc.value.cityIndex]
  if (p) {
    loc.value.lat = p.lat
    loc.value.lng = p.lng
  }
  persistAndRecompute()
}

function persistAndRecompute(): void {
  saveJSON('hours-loc', loc.value)
  selected.value = null
  recompute()
  sfx.blip()
}

function useGeo(): void {
  if (geoBusy.value) return
  geoBusy.value = true
  navigator.geolocation?.getCurrentPosition(
    (pos) => {
      loc.value.cityIndex = -1
      loc.value.lat = Number(pos.coords.latitude.toFixed(4))
      loc.value.lng = Number(pos.coords.longitude.toFixed(4))
      geoBusy.value = false
      persistAndRecompute()
    },
    () => {
      geoBusy.value = false
    },
    { timeout: 8000 },
  )
}

function pick(h: PlanetaryHour, e?: MouseEvent): void {
  selected.value = h
  sfx.blip()
  if (e) sparkleFromEvent(e, 6)
}

const currentH = computed(() => currentPlanetHour(hours.value, new Date(nowTick.value)))
const polar = computed(() => hours.value.length === 0)
const sunInfo = computed(() => {
  const { sunrise, sunset } = riseSet(new Date(), loc.value.lat, loc.value.lng)
  const fmt = (d: Date | null): string =>
    d ? d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '--:--'
  return { rise: fmt(sunrise), set: fmt(sunset) }
})

const zhName = (key: string): string => PLANETS[key]?.cn ?? key
const glyphOf = (key: string): string => PLANETS[key]?.glyph ?? '✦'

function goodTexts(ruler: string): string {
  const list = PLANET_GOOD[ruler] ?? []
  return list.map((p) => (locale.value === 'zh' ? p[0] : p[1])).join('、')
}
function avoidText(ruler: string): string {
  const p = PLANET_AVOID[ruler]
  return p ? (locale.value === 'zh' ? p[0] : p[1]) : '—'
}

onMounted(() => {
  recompute()
  timer = window.setInterval(() => (nowTick.value = Date.now()), 30000)
})
onBeforeUnmount(() => {
  if (timer !== null) window.clearInterval(timer)
})

function rangeText(h: PlanetaryHour): string {
  const f = (d: Date): string => d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  return `${f(h.start)} – ${f(h.end)}`
}

/* ---------- 环形行星钟几何 ---------- */
const CX = 170
const CY = 170
const R_OUT = 156
const R_IN = 122

function pol(r: number, deg: number): [number, number] {
  const rad = ((deg - 90) * Math.PI) / 180
  return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)]
}

/** 第 i（0-23）个 15° 扇环的路径 */
function segPath(i: number): string {
  const a1 = i * 15
  const a2 = a1 + 15
  const [x1, y1] = pol(R_IN, a1)
  const [x2, y2] = pol(R_OUT, a1)
  const [x3, y3] = pol(R_OUT, a2)
  const [x4, y4] = pol(R_IN, a2)
  return `M${x1.toFixed(1)},${y1.toFixed(1)} L${x2.toFixed(1)},${y2.toFixed(1)} A${R_OUT},${R_OUT} 0 0 1 ${x3.toFixed(1)},${y3.toFixed(1)} L${x4.toFixed(1)},${y4.toFixed(1)} A${R_IN},${R_IN} 0 0 0 ${x1.toFixed(1)},${y1.toFixed(1)} Z`
}

function glyphPos(i: number): { x: number; y: number } {
  const [x, y] = pol((R_IN + R_OUT) / 2, i * 15 + 7.5)
  return { x, y }
}

/** 当前时辰已流逝比例 0-1（无当前时辰返回 null） */
const hourElapsed = computed(() => {
  const h = currentH.value
  if (!h) return null
  const total = h.end.getTime() - h.start.getTime()
  const gone = nowTick.value - h.start.getTime()
  return Math.min(1, Math.max(0, gone / total))
})

/* ---------- 时辰流逝弧：内环一圈，随时间慢慢合拢 ---------- */
const R_PROG = R_IN - 16
const PROG_C = 2 * Math.PI * R_PROG

/* ---------- 昼夜天色：钟面背后的天空渐变随昼夜切换 ---------- */
const isDayNow = computed(() => currentH.value?.daytime ?? true)
const skyTop = computed(() =>
  isDayNow.value ? 'rgba(245,200,110,0.16)' : 'rgba(107,91,214,0.20)',
)
const skyBottom = computed(() =>
  isDayNow.value ? 'rgba(255,227,168,0.04)' : 'rgba(30,26,69,0.55)',
)

/* ---------- 吉时推荐 ---------- */
const pickCat = ref<string | null>(null)

const matchedIndexes = computed(() => {
  if (!pickCat.value) return new Set<number>()
  const rulers = ACTIVITY_PLANETS[pickCat.value] ?? []
  return new Set(
    hours.value.filter((h) => rulers.includes(h.ruler)).map((h) => h.index),
  )
})

function toggleCat(id: string): void {
  pickCat.value = pickCat.value === id ? null : id
  sfx.blip()
  if (pickCat.value && matchedIndexes.value.size > 0) {
    // 自动选中第一个「还没过去」的合适时辰
    const nowH = currentPlanetHour(hours.value)
    const candidates = hours.value.filter((h) => matchedIndexes.value.has(h.index))
    const future = candidates.find((h) => nowH && h.index >= nowH.index) ?? candidates[0]!
    selected.value = future
  }
}

const CAT_IDS = Object.keys(ACTIVITY_PLANETS)
const CHALDEAN_ORDER = ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon']
</script>

<template>
  <div class="page-root">
    <h2><DecryptTitle :text="tt('hours.title')" /></h2>
    <p class="hint">{{ tt('hours.hint') }}</p>

    <section class="panel stagger-in" style="margin-top: 18px;">
      <div class="loc-row">
        <label class="field" style="flex: 1 1 220px;">
          <span>{{ tt('hours.loc') }}</span>
          <select v-model.number="loc.cityIndex" @change="onCityChange">
            <option value="-1">± {{ loc.lat.toFixed(2) }}, {{ loc.lng.toFixed(2) }}</option>
            <option v-for="(c, i) in CITY_PRESETS" :key="c.city" :value="i">
              {{ c.city }}
            </option>
          </select>
        </label>
        <button v-magnetic class="btn ghost small geo-btn" :disabled="geoBusy" @click="useGeo">
          📍 {{ tt('hours.useGeo') }}
        </button>
      </div>
      <p v-if="!polar" class="hint sun-line">
        ☀ {{ tt('hours.sunrise', { t: sunInfo.rise }) }} &nbsp;&nbsp;
        🌙 {{ tt('hours.sunset', { t: sunInfo.set }) }}
      </p>

      <template v-if="!polar">
        <div class="cat-row" role="group">
          <button
            v-for="id in CAT_IDS"
            :key="id"
            class="cat-chip"
            :class="{ on: pickCat === id }"
            @click="toggleCat(id)"
          >
            {{ tt('cat.' + id) }}
          </button>
        </div>
        <p v-if="pickCat && matchedIndexes.size > 0" class="hint match-hint">
          ✧ {{ tt('hours.matchHint', { n: matchedIndexes.size }) }}
        </p>

        <div class="clock-wrap">
          <svg class="clock" viewBox="0 0 340 340" role="img" :aria-label="tt('hours.title')">
            <defs>
              <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" :stop-color="skyTop" class="sky-stop" />
                <stop offset="100%" :stop-color="skyBottom" class="sky-stop" />
              </linearGradient>
            </defs>
            <!-- 昼夜天色底 -->
            <circle :cx="CX" :cy="CY" :r="R_IN - 4" fill="url(#skyGrad)" class="sky-disc" />
            <!-- 刻度环底 -->
            <circle :cx="CX" :cy="CY" :r="(R_IN + R_OUT) / 2" fill="none" stroke="transparent" />
            <g v-for="h in hours" :key="'s' + h.index">
              <path
                :d="segPath(h.index - 1)"
                class="seg"
                :class="[h.daytime ? 'day' : 'night', { now: currentH?.index === h.index, sel: selected?.index === h.index, match: matchedIndexes.has(h.index) }]"
                @click="pick(h, $event)"
              >
                <title>{{ zhName(h.ruler) }} · {{ rangeText(h) }}</title>
              </path>
              <text
                class="seg-glyph"
                :class="{ dim: !(currentH?.index === h.index || selected?.index === h.index) }"
                :x="glyphPos(h.index - 1).x"
                :y="glyphPos(h.index - 1).y + 5"
                @click="pick(h, $event)"
              >{{ glyphOf(h.ruler) }}</text>
            </g>
            <!-- 日出/日落方位标 -->
            <text :x="CX - 10" y="16" class="sun-mark">☀ {{ sunInfo.rise }}</text>
            <text :x="CX + 6" y="332" class="moon-mark">🌙 {{ sunInfo.set }}</text>
            <!-- 当前时辰流逝弧 -->
            <circle
              v-if="hourElapsed !== null"
              :cx="CX" :cy="CY" :r="R_PROG"
              fill="none"
              class="progress-arc"
              :stroke-dasharray="String(PROG_C)"
              :stroke-dashoffset="String(PROG_C * (1 - hourElapsed))"
              transform-origin="center"
              :transform="`rotate(-90 ${CX} ${CY})`"
            />
          </svg>

          <div class="clock-center">
            <template v-if="selected || currentH">
              <i class="cc-glyph">{{ glyphOf((selected ?? currentH)!.ruler) }}</i>
              <strong>{{ zhName((selected ?? currentH)!.ruler) }}</strong>
              <small>{{ rangeText((selected ?? currentH)!) }}</small>
            </template>
          </div>
        </div>

        <Transition name="omen-pop">
          <div v-if="selected" class="detail-box bounce-in">
            <p class="db-head">
              <i class="db-glyph">{{ glyphOf(selected.ruler) }}</i>
              {{ tt('hours.rulerIs', { p: zhName(selected.ruler) }) }}
              <em class="db-range">{{ tt('hours.range', { a: rangeText(selected).split(' – ')[0]!, b: rangeText(selected).split(' – ')[1]! }) }}</em>
              <span v-if="currentH?.index === selected.index" class="tag">{{ tt('hours.now') }}</span>
            </p>
            <p class="db-line good">✧ {{ tt('hours.goodFor') }}：{{ goodTexts(selected.ruler) }}</p>
            <p class="db-line avoid">✕ {{ tt('hours.avoid') }}：{{ avoidText(selected.ruler) }}</p>
          </div>
        </Transition>
      </template>
      <p v-else class="hint">{{ tt('hours.polarHint') }}</p>
    </section>

    <!-- 行星时小知识 -->
    <section v-if="!polar" class="panel lore-panel">
      <h3 style="margin-top: 0;">✦ {{ tt('lore.title') }}</h3>
      <p class="lore-p">{{ tt('lore.p1') }}</p>
      <div class="chaldean-row">
        <span
          v-for="(p, i) in CHALDEAN_ORDER"
          :key="p"
          class="chald-chip"
          :style="{ animationDelay: i * 0.08 + 's' }"
        >
          <i>{{ glyphOf(p) }}</i>{{ zhName(p) }}
        </span>
      </div>
      <p class="lore-p">{{ tt('lore.p2') }}</p>
      <p class="lore-tip">✧ {{ tt('lore.tip') }}</p>
    </section>
  </div>
</template>

<style scoped>
.loc-row { display: flex; gap: 14px; align-items: flex-end; flex-wrap: wrap; }
.geo-btn { margin-bottom: 14px; }
.sun-line { margin: 10px 0 0; color: var(--gold-bright); }

.seg-label {
  margin: 20px 0 8px;
  font-family: var(--cute);
  color: var(--lavender-soft);
  font-weight: 400;
  letter-spacing: 0.08em;
}
/* ---------- 环形行星钟 ---------- */
.clock-wrap { position: relative; max-width: 460px; margin: 6px auto 0; }
.clock { display: block; width: 100%; height: auto; user-select: none; }
.seg {
  cursor: pointer;
  transition: filter 0.2s, opacity 0.2s;
  transform-box: fill-box;
  transform-origin: center;
}
.seg.day { fill: color-mix(in srgb, var(--gold) 17%, var(--void-0)); stroke: color-mix(in srgb, var(--gold) 30%, transparent); stroke-width: 1; }
.seg.night { fill: color-mix(in srgb, var(--lavender) 14%, var(--void-1)); stroke: color-mix(in srgb, var(--lavender) 26%, transparent); stroke-width: 1; }
.seg:hover { filter: brightness(1.5); }
.seg.sel { fill: color-mix(in srgb, var(--mint) 24%, var(--void-0)); stroke: var(--mint); }
.seg.now {
  animation: seg-now 2.2s ease-in-out infinite;
  stroke: var(--pink);
  fill: color-mix(in srgb, var(--pink) 26%, var(--void-0));
}
@keyframes seg-now {
  0%, 100% { filter: drop-shadow(0 0 3px color-mix(in srgb, var(--pink) 45%, transparent)); }
  50% { filter: drop-shadow(0 0 12px color-mix(in srgb, var(--pink) 90%, transparent)); }
}
.seg-glyph {
  font-size: 15px;
  text-anchor: middle;
  pointer-events: none;
  fill: var(--gold-bright);
  transition: opacity 0.25s;
}
.seg-glyph.dim { opacity: 0.55; }
.sun-mark, .moon-mark { font-size: 13px; fill: var(--ink-dim); text-anchor: middle; }

/* 昼夜天色盘：颜色切换带过渡 */
.sky-stop { transition: stop-color 1.6s ease; }
.sky-disc { opacity: 0.9; }

/* 当前时辰流逝弧 */
.progress-arc {
  stroke: var(--gold-bright);
  stroke-width: 3;
  stroke-linecap: round;
  filter: drop-shadow(0 0 6px color-mix(in srgb, var(--gold) 70%, transparent));
  transition: stroke-dashoffset 1.4s ease;
  pointer-events: none;
}

.clock-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  pointer-events: none;
  text-align: center;
}
.cc-glyph { font-style: normal; font-size: 2.6rem; line-height: 1; color: var(--gold-bright); filter: drop-shadow(0 0 10px color-mix(in srgb, var(--gold) 55%, transparent)); }
.clock-center strong { font-family: var(--cute); color: var(--gold-bright); font-weight: 400; font-size: 1.05rem; letter-spacing: 0.08em; }
.clock-center small { color: var(--ink-dim); font-size: 0.78rem; }

/* ---------- 吉时推荐 chips ---------- */
.cat-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
.cat-chip {
  padding: 7px 14px;
  border-radius: 999px;
  border: 2px solid color-mix(in srgb, var(--lavender) 40%, transparent);
  background: color-mix(in srgb, var(--lavender) 8%, var(--void-0));
  color: var(--ink);
  cursor: pointer;
  font-size: 0.88rem;
  font-family: var(--cute);
  letter-spacing: 0.05em;
  transition: all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.cat-chip:hover { transform: translateY(-2px); border-color: var(--pink); }
.cat-chip.on {
  border-color: var(--mint);
  color: var(--mint);
  box-shadow: 0 0 12px color-mix(in srgb, var(--mint) 40%, transparent);
}
.match-hint { margin: 10px 0 0; color: var(--mint); }
.seg.match {
  fill: color-mix(in srgb, var(--mint) 20%, var(--void-0));
  stroke: color-mix(in srgb, var(--mint) 70%, transparent);
  animation: seg-match 1.8s ease-in-out infinite;
}
@keyframes seg-match {
  0%, 100% { filter: drop-shadow(0 0 2px color-mix(in srgb, var(--mint) 35%, transparent)); }
  50% { filter: drop-shadow(0 0 9px color-mix(in srgb, var(--mint) 75%, transparent)); }
}

/* ---------- 小知识面板 ---------- */
.lore-panel { margin-top: 20px; }
.lore-p { line-height: 2; color: var(--ink); font-size: 0.94rem; margin: 10px 0; }
.chaldean-row { display: flex; flex-wrap: wrap; gap: 8px; margin: 14px 0; }
.chald-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 13px;
  border-radius: 999px;
  font-size: 0.86rem;
  background: color-mix(in srgb, var(--gold) 9%, var(--void-0));
  border: 1.5px solid color-mix(in srgb, var(--gold) 45%, transparent);
  opacity: 0;
  animation: chald-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
.chald-chip i { font-style: normal; color: var(--gold-bright); font-size: 1.05rem; }
@keyframes chald-in {
  from { opacity: 0; transform: translateY(10px) scale(0.8); }
  to { opacity: 1; transform: none; }
}
.lore-tip {
  margin: 12px 0 0;
  padding: 11px 15px;
  border-radius: 10px;
  border: 2px dashed color-mix(in srgb, var(--mint) 50%, transparent);
  color: var(--ink-dim);
  font-size: 0.88rem;
  line-height: 1.9;
}

.detail-box {
  margin-top: 18px;
  padding: 15px 18px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--mint) 6%, var(--void-0));
  border: 2px dashed color-mix(in srgb, var(--lavender) 45%, transparent);
}
.db-head {
  margin: 0 0 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--cute);
  color: var(--gold-bright);
  font-size: 1.05rem;
}
.db-glyph { font-style: normal; font-size: 1.5rem; }
.db-range { font-style: normal; color: var(--ink-dim); font-size: 0.82rem; margin-left: auto; }
.db-line { margin: 5px 0; font-size: 0.92rem; line-height: 1.8; }
.db-line.good { color: var(--mint); }
.db-line.avoid { color: var(--danger); }

.omen-pop-enter-active { transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
.omen-pop-enter-from { opacity: 0; transform: translateY(12px) scale(0.95); }
@media (prefers-reduced-motion: reduce) {
  .seg.now { animation: none; }
}
</style>

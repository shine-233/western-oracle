<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ChartAspect, ChartPlanet, CrossAspect } from '../lib/astrology'
import { ZODIAC_SIGNS } from '../lib/astrology'

const props = defineProps<{
  planets: ChartPlanet[]
  cusps: number[]
  ascLon: number
  aspects: ChartAspect[]
  /** 内环星体（合盘对方 / 行运盘） */
  innerPlanets?: ChartPlanet[]
  /** 外环×内环交叉相位 */
  synastryAspects?: CrossAspect[]
}>()

const SIZE = 600
const C = SIZE / 2

/** 外圈到内圈半径 */
const R = {
  zodiacOut: 288,
  zodiacIn: 246,
  tick: 240,
  planet: 212,
  houseNum: 168,
  aspect: 148,
  innerPlanet: 118,
}

const ASPECT_COLORS: Record<string, string> = {
  conjunction: '#d4af6a',
  sextile: '#5fb8a5',
  square: '#e07a7a',
  trine: '#8f7fe8',
  opposition: '#e0913f',
}

const ASPECT_CN: Record<string, string> = {
  conjunction: '合相',
  sextile: '六合',
  square: '刑相',
  trine: '拱相',
  opposition: '冲相',
}

function rad(lon: number): number {
  return ((180 + lon - props.ascLon) * Math.PI) / 180
}

function pt(lon: number, r: number): { x: number; y: number } {
  const a = rad(lon)
  return { x: C + r * Math.cos(a), y: C - r * Math.sin(a) }
}

function arcPath(lon1: number, lon2: number, r: number): string {
  const p1 = pt(lon1, r)
  const p2 = pt(lon2, r)
  return `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} A ${r} ${r} 0 0 0 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`
}

const signSegments = computed(() =>
  ZODIAC_SIGNS.map((sign, i) => ({
    glyph: sign.glyph,
    path: arcPath(i * 30, (i + 1) * 30 + 0.01, (R.zodiacIn + R.zodiacOut) / 2),
    midPt: pt(i * 30 + 15, (R.zodiacIn + R.zodiacOut) / 2),
    boundary: arcPath(i * 30, i * 30 + 0.01, R.zodiacOut),
    element: ['fire', 'earth', 'air', 'water'][i % 4],
  })),
)

const cuspLines = computed(() => {
  const out: Array<{ x1: number; y1: number; x2: number; y2: number; num: number; numX: number; numY: number; major: boolean }> = []
  for (let i = 0; i < props.cusps.length; i++) {
    const lon = props.cusps[i]!
    const nextLon = props.cusps[(i + 1) % 12]!
    const p1 = pt(lon, R.aspect)
    const p2 = pt(lon, R.zodiacIn)
    const mid = pt(lon + shortestDelta(lon, nextLon) / 2, R.houseNum)
    out.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, num: i + 1, numX: mid.x, numY: mid.y, major: i === 0 || i === 9 })
  }
  return out
})

function shortestDelta(from: number, to: number): number {
  let d = to - from
  while (d < 0) d += 360
  while (d >= 360) d -= 360
  return d
}

/** 碰撞规避：把过近的标签角度摊开 */
function avoidCollisions(list: ChartPlanet[], radius: number): Array<ChartPlanet & { x: number; y: number; dotX: number; dotY: number }> {
  const MIN_SEP = radius < 150 ? 13 : 9
  const work = [...list].sort((a, b) => a.lon - b.lon).map((p) => ({ ...p, displayLon: p.lon }))
  for (let iter = 0; iter < 80; iter++) {
    let moved = false
    for (let i = 0; i < work.length; i++) {
      const cur = work[i]!
      const next = work[(i + 1) % work.length]!
      let gap = next.displayLon - cur.displayLon
      if (i === work.length - 1) gap += 360
      if (gap < MIN_SEP) {
        const push = (MIN_SEP - gap) / 2
        cur.displayLon -= push
        next.displayLon += push
        moved = true
      }
    }
    if (!moved) break
  }
  return work.map((p) => {
    const dot = pt(p.lon, radius < 150 ? radius + 14 : R.tick)
    const label = pt(p.displayLon, radius)
    return { ...p, dotX: dot.x, dotY: dot.y, x: label.x, y: label.y }
  })
}

const placedPlanets = computed(() => avoidCollisions(props.planets, R.planet))
const placedInner = computed(() => (props.innerPlanets ? avoidCollisions(props.innerPlanets, R.innerPlanet) : []))

const aspectLines = computed(() => {
  const byName = new Map(props.planets.map((p) => [p.name, p]))
  return props.aspects
    .map((a, i) => {
      const p1 = byName.get(a.body1)
      const p2 = byName.get(a.body2)
      if (!p1 || !p2) return null
      const q1 = pt(p1.lon, R.aspect - 12)
      const q2 = pt(p2.lon, R.aspect - 12)
      return {
        x1: q1.x, y1: q1.y, x2: q2.x, y2: q2.y,
        color: ASPECT_COLORS[a.type] ?? '#888',
        dashed: a.type === 'square' || a.type === 'opposition',
        title: `${PLANET_CN_OF(a.body1)} ${ASPECT_CN[a.type] ?? a.type} ${PLANET_CN_OF(a.body2)}`,
        order: i,
        strength: Math.max(0.35, Math.min(1, (a.strength ?? 60) / 100)),
        dimmed: selected.value !== null && a.body1 !== selected.value && a.body2 !== selected.value,
        hot: selected.value !== null && (a.body1 === selected.value || a.body2 === selected.value),
      }
    })
    .filter((v): v is NonNullable<typeof v> => v !== null)
})

function PLANET_CN_OF(key: string): string {
  // 延迟导入避免循环依赖；corpus 为纯数据无风险
  return PLANET_CN_MAP[key] ?? key
}

const PLANET_CN_MAP: Record<string, string> = {
  Sun: '太阳', Moon: '月亮', Mercury: '水星', Venus: '金星', Mars: '火星',
  Jupiter: '木星', Saturn: '土星', Uranus: '天王星', Neptune: '海王星', Pluto: '冥王星',
  Chiron: '凯龙', Lilith: '莉莉丝', NorthNode: '北交点', SouthNode: '南交点',
  Ceres: '谷神星', Pallas: '智神星', Juno: '婚神星', Vesta: '灶神星',
}

/** 合盘/行运：外环×内环交叉相位虚线 */
const synastryLines = computed(() => {
  if (!props.innerPlanets) return []
  const outer = new Map(props.planets.map((p) => [p.name, p]))
  const inner = new Map(props.innerPlanets.map((p) => [p.name, p]))
  return (props.synastryAspects ?? [])
    .slice(0, 40)
    .map((a, i) => {
      const p1 = outer.get(a.body1)
      const p2 = inner.get(a.body2)
      if (!p1 || !p2) return null
      const q1 = pt(p1.lon, R.aspect - 12)
      const q2 = pt(p2.lon, R.innerPlanet + 16)
      return {
        x1: q1.x, y1: q1.y, x2: q2.x, y2: q2.y,
        color: ASPECT_COLORS[a.type] ?? '#888',
        dashed: a.type === 'square' || a.type === 'opposition',
        title: `${PLANET_CN_MAP[a.body1] ?? a.body1} ${ASPECT_CN[a.type] ?? a.type} ${PLANET_CN_MAP[a.body2] ?? a.body2}（偏差 ${a.orb}°）`,
        order: i,
        strength: 0.5,
        dimmed: selected.value !== null && a.body1 !== selected.value && a.body2 !== selected.value,
        hot: selected.value !== null && (a.body1 === selected.value || a.body2 === selected.value),
      }
    })
    .filter((v): v is NonNullable<typeof v> => v !== null)
})

const ascTick = computed(() => pt(props.ascLon, R.zodiacOut + 4))

/* ---------- 点击行星：高亮相位线 ---------- */
const selected = ref<string | null>(null)
/** 被点选的相位线标题（移动端没有 hover，点线直接读含义） */
const tappedAspect = ref<string | null>(null)

function tapAspect(title: string): void {
  tappedAspect.value = tappedAspect.value === title ? null : title
}

function toggleSelect(name: string | undefined): void {
  if (!name) return
  selected.value = selected.value === name ? null : name
}

const selInfo = computed(() => {
  // 点了相位线：直接显示这条相位的含义（移动端无 hover 的兜底）
  if (tappedAspect.value) return tappedAspect.value
  if (!selected.value) return ''
  const p = props.planets.find((x) => x.name === selected.value)
    ?? props.innerPlanets?.find((x) => x.name === selected.value)
  if (!p) return ''
  const natalCount = props.aspects.filter((a) => a.body1 === selected.value || a.body2 === selected.value).length
  const crossCount = (props.synastryAspects ?? []).filter((a) => a.body1 === selected.value || a.body2 === selected.value).length
  const bits = [
    `${PLANET_CN_MAP[p.name] ?? p.name} ${p.signCn}${p.degText}`,
    p.house > 0 ? `第${p.house}宫` : '',
    natalCount > 0 ? `${natalCount} 条本命相位` : '',
    crossCount > 0 ? `${crossCount} 条交叉相位` : '',
  ].filter(Boolean)
  return bits.join(' · ')
})
</script>

<template>
  <svg :viewBox="`0 0 ${SIZE} ${SIZE}`" class="astro-wheel" role="img" aria-label="星盘图" @click="selected = null">
    <defs>
      <radialGradient id="wheelBg" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#1e1a45" />
        <stop offset="100%" stop-color="#151232" />
      </radialGradient>
    </defs>

    <circle :cx="C" :cy="C" :r="R.zodiacOut" fill="url(#wheelBg)" stroke="#f5c86e" stroke-width="1.6" />
    <!-- 缓慢旋转的装饰刻度环 -->
    <circle class="deco-ring" :cx="C" :cy="C" :r="R.zodiacOut + 8" fill="none" stroke="#b3a6f7" stroke-width="2" stroke-dasharray="2 10" opacity="0.5" />
    <circle :cx="C" :cy="C" :r="R.zodiacIn" fill="none" stroke="#f5c86e" stroke-width="1" opacity="0.8" />
    <circle :cx="C" :cy="C" :r="R.aspect" fill="none" stroke="#b3a6f7" stroke-width="1" opacity="0.55" />
    <circle v-if="innerPlanets" :cx="C" :cy="C" :r="R.innerPlanet + 16" fill="none" stroke="#7de8c3" stroke-width="1" opacity="0.45" />

    <!-- 星座带 -->
    <g>
      <path v-for="(seg, i) in signSegments" :key="'seg' + i" :d="seg.boundary" stroke="#f5c86e" stroke-width="1" opacity="0.45" fill="none" />
      <text
        v-for="(seg, i) in signSegments"
        :key="'glyph' + i"
        :x="seg.midPt.x"
        :y="seg.midPt.y"
        text-anchor="middle"
        dominant-baseline="central"
        :fill="seg.element === 'fire' ? '#e08a6a' : seg.element === 'earth' ? '#b8a86a' : seg.element === 'air' ? '#a9c4e8' : '#8fb8d6'"
        font-size="22"
      >{{ seg.glyph }}</text>
    </g>

    <!-- 宫位线与编号 -->
    <g>
      <line
        v-for="cl in cuspLines"
        :key="'cusp' + cl.num"
        :x1="cl.x1" :y1="cl.y1" :x2="cl.x2" :y2="cl.y2"
        :stroke="cl.major ? '#f5c86e' : '#b3a6f7'"
        :stroke-width="cl.major ? 2 : 1"
        :opacity="cl.major ? 0.95 : 0.45"
      />
      <text v-for="cl in cuspLines" :key="'hn' + cl.num" :x="cl.numX" :y="cl.numY" text-anchor="middle" dominant-baseline="central" fill="#b0a9d6" font-size="13">{{ cl.num }}</text>
    </g>

    <!-- 本命相位线 -->
    <g>
      <line
        v-for="(al, i) in aspectLines"
        :key="'asp' + i"
        class="asp-line"
        :class="{ dashed: al.dashed, muted: al.dimmed, hot: al.hot }"
        :style="{ '--i': i, '--w': al.strength }"
        :x1="al.x1" :y1="al.y1" :x2="al.x2" :y2="al.y2"
        :stroke="al.color" :stroke-width="0.8 + al.strength * (al.hot ? 2.2 : 0.9)"
        :stroke-dasharray="al.dashed ? '5 4' : undefined"
        role="button"
        tabindex="0"
        :aria-label="al.title"
        @click.stop="tapAspect(al.title)"
        @keydown.enter.prevent="tapAspect(al.title)"
        @keydown.space.prevent="tapAspect(al.title)"
      >
        <title>{{ al.title }}</title>
      </line>
    </g>

    <!-- 合盘/行运交叉相位虚线 -->
    <g>
      <line
        v-for="(sl, i) in synastryLines"
        :key="'syn' + i"
        class="syn-line"
        :class="{ dashed: sl.dashed, muted: sl.dimmed, hot: sl.hot }"
        :style="{ '--i': i }"
        :x1="sl.x1" :y1="sl.y1" :x2="sl.x2" :y2="sl.y2"
        :stroke="sl.color"
        :stroke-width="sl.hot ? 2 : 1"
        :stroke-dasharray="sl.dashed ? '3 5' : '6 3'"
        :opacity="sl.hot ? 0.95 : 0.6"
        role="button"
        tabindex="0"
        :aria-label="sl.title"
        @click.stop="tapAspect(sl.title)"
        @keydown.enter.prevent="tapAspect(sl.title)"
        @keydown.space.prevent="tapAspect(sl.title)"
      >
        <title>{{ sl.title }}</title>
      </line>
    </g>

    <!-- 外环行星 -->
    <g>
      <g
        v-for="p in placedPlanets"
        :key="p.name"
        class="planet-node"
        :class="{ faded: selected && p.name !== selected }"
        role="button"
        tabindex="0"
        :aria-label="`${p.name} ${p.signCn} ${p.degText}${p.retro ? ' ℞' : ''}`"
        @click.stop="toggleSelect(p.name)"
        @keydown.enter.prevent="toggleSelect(p.name)"
        @keydown.space.prevent="toggleSelect(p.name)"
      >
        <line :x1="p.dotX" :y1="p.dotY" :x2="p.x" :y2="p.y" stroke="#f5c86e" stroke-width="0.7" opacity="0.5" />
        <circle :cx="p.dotX" :cy="p.dotY" r="3" fill="#ffe3a8">
          <title>{{ p.name }} {{ p.signCn }} {{ p.degText }}{{ p.retro ? ' ℞' : '' }}</title>
        </circle>
        <text :x="p.x" :y="p.y" class="planet-glyph" text-anchor="middle" dominant-baseline="central" fill="#ffe3a8" font-size="21">
          {{ p.glyph }}<tspan v-if="p.retro" font-size="10" dy="-8">℞</tspan>
          <title>{{ p.name }} {{ p.signCn }} {{ p.degText }}{{ p.retro ? ' 逆行' : '' }}</title>
        </text>
      </g>
    </g>

    <!-- 内环行星（对方/行运） -->
    <g v-if="placedInner.length">
      <g
        v-for="p in placedInner"
        :key="'in-' + p.name"
        class="planet-node"
        :class="{ faded: selected && p.name !== selected }"
        role="button"
        tabindex="0"
        :aria-label="`${p.name} ${p.signCn} ${p.degText}`"
        @click.stop="toggleSelect(p.name)"
        @keydown.enter.prevent="toggleSelect(p.name)"
        @keydown.space.prevent="toggleSelect(p.name)"
      >
        <circle :cx="p.dotX" :cy="p.dotY" r="2.6" fill="#7de8c3">
          <title>{{ p.name }} {{ p.signCn }} {{ p.degText }}</title>
        </circle>
        <text :x="p.x" :y="p.y" text-anchor="middle" dominant-baseline="central" fill="#7de8c3" font-size="17">
          {{ p.glyph }}
          <title>{{ p.name }} {{ p.signCn }} {{ p.degText }}</title>
        </text>
      </g>
    </g>

    <!-- 选中行星信息条 -->
    <Transition name="selinfo">
      <text v-if="selInfo" x="300" :y="SIZE - 12" text-anchor="middle" class="sel-info">{{ selInfo }}</text>
    </Transition>

    <text :x="ascTick.x" :y="ascTick.y" text-anchor="middle" dominant-baseline="central" fill="#f5c86e" font-size="15" font-weight="bold">ASC</text>
  </svg>
</template>

<style scoped>
.astro-wheel {
  width: 100%;
  max-width: 560px;
  height: auto;
  display: block;
  margin: 0 auto;
  animation: wheel-in 0.9s cubic-bezier(0.34, 1.3, 0.64, 1) both;
}
@keyframes wheel-in {
  0% { opacity: 0; transform: rotate(-14deg) scale(0.9); }
  100% { opacity: 1; transform: rotate(0) scale(1); }
}
.deco-ring {
  transform-origin: 300px 300px;
  animation: ring-spin 90s linear infinite;
}
@keyframes ring-spin {
  to { transform: rotate(360deg); }
}
.planet-glyph {
  cursor: pointer;
  transform-box: fill-box;
  transform-origin: center;
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.planet-glyph:hover {
  transform: scale(1.45);
  filter: drop-shadow(0 0 6px color-mix(in srgb, var(--gold-bright) 90%, transparent));
}

/* 相位线：级联描边入场 + 刑冲虚线流动 */
.asp-line {
  opacity: 0;
  animation: asp-draw-in 0.6s cubic-bezier(0.34, 1.3, 0.64, 1) forwards;
  animation-delay: calc(var(--i) * 45ms);
  transition: stroke-width 0.2s ease, opacity 0.25s ease;
}
.asp-line:hover { opacity: 1 !important; stroke-width: calc(var(--w) * 3); }
.asp-line.muted { opacity: 0.05 !important; animation: none; stroke-width: 0.6; }
.asp-line.hot {
  opacity: 1 !important;
  animation: none;
  filter: drop-shadow(0 0 4px currentColor);
}
@keyframes asp-draw-in {
  from { stroke-dashoffset: 480; }
  to { stroke-dashoffset: 0; opacity: 0.75; }
}
.asp-line:not(.dashed) {
  stroke-dasharray: 480;
}
.asp-line.dashed { opacity: 0; }
.asp-line.dashed { animation-name: asp-fade-in, dash-march; animation-duration: 0.5s, 1.4s; animation-timing-function: ease-out, linear; animation-iteration-count: 1, infinite; animation-delay: calc(var(--i) * 45ms), calc(var(--i) * 45ms); }
.asp-line.dashed.muted { animation: none; }
@keyframes asp-fade-in {
  from { opacity: 0; }
  to { opacity: 0.75; }
}
@keyframes dash-march {
  to { stroke-dashoffset: -18; }
}
.syn-line {
  animation: syn-pop 0.45s cubic-bezier(0.34, 1.4, 0.64, 1) both;
  animation-delay: calc(var(--i) * 30ms);
  transition: stroke-width 0.2s ease, opacity 0.25s ease;
  cursor: pointer;
}
.syn-line:focus-visible { opacity: 1 !important; stroke-width: 3; }
.syn-line.muted { opacity: 0.05 !important; animation: none; }
@keyframes syn-pop {
  from { opacity: 0; stroke-width: 3px; }
  to { opacity: 0.6; }
}

/* 点击行星：节点淡化与信息条 */
.planet-node { cursor: pointer; transition: opacity 0.25s ease; }
.planet-node.faded { opacity: 0.22; }
.sel-info {
  fill: var(--gold-bright);
  font-size: 15px;
  font-family: var(--cute);
  letter-spacing: 0.06em;
  paint-order: stroke;
  stroke: rgba(13, 11, 32, 0.85);
  stroke-width: 4px;
}
.selinfo-enter-active, .selinfo-leave-active { transition: all 0.25s ease; }
.selinfo-enter-from, .selinfo-leave-to { opacity: 0; transform: translateY(6px); }

@media (prefers-reduced-motion: reduce) {
  .deco-ring { animation: none; }
}
</style>

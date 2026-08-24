<script setup lang="ts">
import { computed } from 'vue'
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
    .map((a) => {
      const p1 = byName.get(a.body1)
      const p2 = byName.get(a.body2)
      if (!p1 || !p2) return null
      const q1 = pt(p1.lon, R.aspect - 12)
      const q2 = pt(p2.lon, R.aspect - 12)
      return {
        x1: q1.x, y1: q1.y, x2: q2.x, y2: q2.y,
        color: ASPECT_COLORS[a.type] ?? '#888',
        dashed: a.type === 'square' || a.type === 'opposition',
        title: `${a.body1} ${ASPECT_CN[a.type] ?? a.type} ${a.body2}`,
      }
    })
    .filter((v): v is NonNullable<typeof v> => v !== null)
})

/** 合盘/行运：外环×内环交叉相位虚线 */
const synastryLines = computed(() => {
  if (!props.innerPlanets) return []
  const outer = new Map(props.planets.map((p) => [p.name, p]))
  const inner = new Map(props.innerPlanets.map((p) => [p.name, p]))
  return (props.synastryAspects ?? [])
    .slice(0, 40)
    .map((a) => {
      const p1 = outer.get(a.body1)
      const p2 = inner.get(a.body2)
      if (!p1 || !p2) return null
      const q1 = pt(p1.lon, R.aspect - 12)
      const q2 = pt(p2.lon, R.innerPlanet + 16)
      return {
        x1: q1.x, y1: q1.y, x2: q2.x, y2: q2.y,
        color: ASPECT_COLORS[a.type] ?? '#888',
        dashed: a.type === 'square' || a.type === 'opposition',
        title: `${a.body1} ${ASPECT_CN[a.type] ?? a.type} ${a.body2}（orb ${a.orb}°）`,
      }
    })
    .filter((v): v is NonNullable<typeof v> => v !== null)
})

const ascTick = computed(() => pt(props.ascLon, R.zodiacOut + 4))
</script>

<template>
  <svg :viewBox="`0 0 ${SIZE} ${SIZE}`" class="astro-wheel" role="img" aria-label="星盘图">
    <defs>
      <radialGradient id="wheelBg" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#1e1a45" />
        <stop offset="100%" stop-color="#151232" />
      </radialGradient>
    </defs>

    <circle :cx="C" :cy="C" :r="R.zodiacOut" fill="url(#wheelBg)" stroke="#f5c86e" stroke-width="1.6" />
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
        :x1="al.x1" :y1="al.y1" :x2="al.x2" :y2="al.y2"
        :stroke="al.color" stroke-width="1.1"
        :stroke-dasharray="al.dashed ? '5 4' : undefined"
        opacity="0.75"
      >
        <title>{{ al.title }}</title>
      </line>
    </g>

    <!-- 合盘/行运交叉相位虚线 -->
    <g>
      <line
        v-for="(sl, i) in synastryLines"
        :key="'syn' + i"
        :x1="sl.x1" :y1="sl.y1" :x2="sl.x2" :y2="sl.y2"
        :stroke="sl.color" stroke-width="1"
        :stroke-dasharray="sl.dashed ? '3 5' : '6 3'"
        opacity="0.6"
      >
        <title>{{ sl.title }}</title>
      </line>
    </g>

    <!-- 外环行星 -->
    <g>
      <g v-for="p in placedPlanets" :key="p.name">
        <line :x1="p.dotX" :y1="p.dotY" :x2="p.x" :y2="p.y" stroke="#f5c86e" stroke-width="0.7" opacity="0.5" />
        <circle :cx="p.dotX" :cy="p.dotY" r="3" fill="#ffe3a8">
          <title>{{ p.name }} {{ p.signCn }} {{ p.degText }}{{ p.retro ? ' ℞' : '' }}</title>
        </circle>
        <text :x="p.x" :y="p.y" text-anchor="middle" dominant-baseline="central" fill="#ffe3a8" font-size="21">
          {{ p.glyph }}<tspan v-if="p.retro" font-size="10" dy="-8">℞</tspan>
          <title>{{ p.name }} {{ p.signCn }} {{ p.degText }}{{ p.retro ? ' 逆行' : '' }}</title>
        </text>
      </g>
    </g>

    <!-- 内环行星（对方/行运） -->
    <g v-if="placedInner.length">
      <g v-for="p in placedInner" :key="'in-' + p.name">
        <circle :cx="p.dotX" :cy="p.dotY" r="2.6" fill="#7de8c3">
          <title>{{ p.name }} {{ p.signCn }} {{ p.degText }}</title>
        </circle>
        <text :x="p.x" :y="p.y" text-anchor="middle" dominant-baseline="central" fill="#7de8c3" font-size="17">
          {{ p.glyph }}
          <title>{{ p.name }} {{ p.signCn }} {{ p.degText }}</title>
        </text>
      </g>
    </g>

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
</style>

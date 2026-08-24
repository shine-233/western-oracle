<script setup lang="ts">
import { computed } from 'vue'
import type { ChartAspect, ChartPlanet } from '../lib/astrology'
import { ZODIAC_SIGNS } from '../lib/astrology'

const props = defineProps<{
  planets: ChartPlanet[]
  cusps: number[]
  ascLon: number
  aspects: ChartAspect[]
}>()

const SIZE = 600
const C = SIZE / 2

/** 外圈到内圈半径 */
const R = {
  zodiacOut: 288,
  zodiacIn: 246,
  tick: 240,
  planet: 212,
  houseNum: 158,
  aspect: 140,
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
  const sweep = 0
  return `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} A ${r} ${r} 0 0 ${sweep} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`
}

const signSegments = computed(() =>
  ZODIAC_SIGNS.map((sign, i) => ({
    glyph: sign.glyph,
    cn: sign.cn,
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

/** 带碰撞规避的行星显示位置 */
const placedPlanets = computed(() => {
  type P = { name: string; glyph: string; lon: number; displayLon: number; retro: boolean; signCn: string; degText: string }
  const list: P[] = [...props.planets]
    .sort((a, b) => a.lon - b.lon)
    .map((p) => ({ ...p, displayLon: p.lon }))

  const MIN_SEP = 9
  for (let iter = 0; iter < 80; iter++) {
    let moved = false
    for (let i = 0; i < list.length; i++) {
      const cur = list[i]!
      const next = list[(i + 1) % list.length]!
      let gap = next.displayLon - cur.displayLon
      if (i === list.length - 1) gap += 360
      if (gap < MIN_SEP) {
        const push = (MIN_SEP - gap) / 2
        cur.displayLon -= push
        next.displayLon += push
        moved = true
      }
    }
    if (!moved) break
  }

  return list.map((p) => {
    const dot = pt(p.lon, R.tick)
    const label = pt(p.displayLon, R.planet)
    return { ...p, dotX: dot.x, dotY: dot.y, x: label.x, y: label.y }
  })
})

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
        x1: q1.x,
        y1: q1.y,
        x2: q2.x,
        y2: q2.y,
        color: ASPECT_COLORS[a.type] ?? '#888',
        dashed: a.type === 'square' || a.type === 'opposition',
        title: `${a.body1} ${ASPECT_CN[a.type] ?? a.type} ${a.body2}`,
      }
    })
    .filter((v): v is NonNullable<typeof v> => v !== null)
})

const ascTick = computed(() => pt(props.ascLon, R.zodiacOut + 4))
</script>

<template>
  <svg :viewBox="`0 0 ${SIZE} ${SIZE}`" class="astro-wheel" role="img" aria-label="本命星盘图">
    <defs>
      <radialGradient id="wheelBg" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#1a1738" />
        <stop offset="100%" stop-color="#12102a" />
      </radialGradient>
    </defs>

    <circle :cx="C" :cy="C" :r="R.zodiacOut" fill="url(#wheelBg)" stroke="#d4af6a" stroke-width="1.6" />
    <circle :cx="C" :cy="C" :r="R.zodiacIn" fill="none" stroke="#d4af6a" stroke-width="1" opacity="0.8" />
    <circle :cx="C" :cy="C" :r="R.aspect" fill="none" stroke="#7c6bd6" stroke-width="1" opacity="0.55" />

    <!-- 星座带 -->
    <g>
      <path v-for="(seg, i) in signSegments" :key="'seg' + i" :d="seg.boundary" stroke="#d4af6a" stroke-width="1" opacity="0.45" fill="none" />
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
        :x1="cl.x1"
        :y1="cl.y1"
        :x2="cl.x2"
        :y2="cl.y2"
        :stroke="cl.major ? '#d4af6a' : '#7c6bd6'"
        :stroke-width="cl.major ? 2 : 1"
        :opacity="cl.major ? 0.95 : 0.45"
      />
      <text v-for="cl in cuspLines" :key="'hn' + cl.num" :x="cl.numX" :y="cl.numY" text-anchor="middle" dominant-baseline="central" fill="#a49fc4" font-size="13">{{ cl.num }}</text>
    </g>

    <!-- 相位线 -->
    <g>
      <line
        v-for="(al, i) in aspectLines"
        :key="'asp' + i"
        :x1="al.x1"
        :y1="al.y1"
        :x2="al.x2"
        :y2="al.y2"
        :stroke="al.color"
        stroke-width="1.1"
        :stroke-dasharray="al.dashed ? '5 4' : undefined"
        opacity="0.75"
      >
        <title>{{ al.title }}</title>
      </line>
    </g>

    <!-- 行星 -->
    <g>
      <g v-for="p in placedPlanets" :key="p.name">
        <line :x1="p.dotX" :y1="p.dotY" :x2="p.x" :y2="p.y" stroke="#d4af6a" stroke-width="0.7" opacity="0.5" />
        <circle :cx="p.dotX" :cy="p.dotY" r="3" fill="#f0d49a">
          <title>{{ p.name }} {{ p.signCn }} {{ p.degText }}{{ p.retro ? ' ℞' : '' }}</title>
        </circle>
        <text :x="p.x" :y="p.y" text-anchor="middle" dominant-baseline="central" fill="#f0d49a" font-size="21">
          {{ p.glyph }}<tspan v-if="p.retro" font-size="10" dy="-8">℞</tspan>
          <title>{{ p.name }} {{ p.signCn }} {{ p.degText }}{{ p.retro ? ' 逆行' : '' }}</title>
        </text>
      </g>
    </g>

    <!-- ASC / MC 标记 -->
    <text :x="ascTick.x" :y="ascTick.y" text-anchor="middle" dominant-baseline="central" fill="#d4af6a" font-size="15" font-weight="bold">ASC</text>
  </svg>
</template>

<style scoped>
.astro-wheel {
  width: 100%;
  max-width: 560px;
  height: auto;
  display: block;
  margin: 0 auto;
}
</style>

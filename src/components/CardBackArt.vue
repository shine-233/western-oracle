<script setup lang="ts">
/** 塔罗牌背：像素小巫女望月图（与露娜同画风），纯 SVG 绘制 */
import { computed } from 'vue'

const ART = [
  'GGGGGGGGGGGGG',
  'G...........G',
  'G..Y..Y.....G',
  'G....YYY....G',
  'G...YYY..Y..G',
  'G...YYYY....G',
  'G....YYY.Y..G',
  'G.....H.....G',
  'G....HHH....G',
  'G...HHHHH...G',
  'G..HHHHHHH..G',
  'G..LLSSSLL..G',
  'G..LLSESLL..G',
  'G...LSSSL...G',
  'G..DDDDDDD..G',
  'G.DDDDDDDDD.G',
  'G.DDYDDDDDD.G',
  'G..DDDDDDD..G',
  'G...........G',
  'GGGGGGGGGGGGG',
]

const COLORS: Record<string, string> = {
  G: '#c9a24f',
  Y: '#ffe3a8',
  H: '#6b5bd6',
  L: '#b3a6f7',
  S: '#ffdcc5',
  E: '#2e2650',
  D: '#4a3fae',
}

interface Cell {
  x: number
  y: number
  c: string
}

const cells = computed<Cell[]>(() => {
  const out: Cell[] = []
  ART.forEach((row, y) => {
    row.split('').forEach((ch, x) => {
      const c = COLORS[ch]
      if (c) out.push({ x, y, c })
    })
  })
  return out
})

const COLS = Math.max(...ART.map((r) => r.length))
const ROWS = ART.length
</script>

<template>
  <svg
    class="card-back-art"
    :viewBox="`0 0 ${COLS} ${ROWS}`"
    preserveAspectRatio="xMidYMid meet"
    shape-rendering="crispEdges"
    aria-hidden="true"
  >
    <rect v-for="(cell, i) in cells" :key="i" :x="cell.x" :y="cell.y" width="1.02" height="1.02" :fill="cell.c" />
  </svg>
</template>

<style scoped>
.card-back-art {
  position: absolute;
  inset: 7%;
  width: 86%;
  height: 86%;
  image-rendering: pixelated;
  filter: drop-shadow(0 0 6px color-mix(in srgb, var(--gold-bright) 25%, transparent));
}
</style>

<script setup lang="ts">
/**
 * 塔罗牌背：多套像素设计随主题自动切换。
 * - 三套图案：望月巫女 / 窥视之眼 / 星芒之门
 * - 边框与点缀引用主题 CSS 变量（--gold/--pink/--lavender），每套皮肤都有自己配色的牌背
 * - 当前皮肤 ID 哈希决定用哪套图案，MutationObserver 监听 data-theme 实时切换
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

interface Design {
  art: string[]
  colors: Record<string, string>
}

const BORDER = 'var(--gold)'
const PINK = 'var(--pink)'
const LAV = 'var(--lavender)'

const MOON_WITCH: Design = {
  art: [
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
  ],
  colors: { G: BORDER, Y: '#ffe3a8', H: '#6b5bd6', L: '#b3a6f7', S: '#ffdcc5', E: '#2e2650', D: '#4a3fae' },
}

const COSMIC_EYE: Design = {
  art: [
    'GGGGGGGGGGGGG',
    'G...........G',
    'G....VVV....G',
    'G..VV...VV..G',
    'G.V..KKK..V.G',
    'GV..KWWWK..VG',
    'GV..KPWEK..VG',
    'GV..KWWWK..VG',
    'G.V..KKK..V.G',
    'G..VV...VV..G',
    'G....VVV....G',
    'G..Y..Y..Y..G',
    'GGGGGGGGGGGGG',
  ],
  colors: { G: BORDER, V: LAV, K: '#151232', W: '#fff6ec', P: PINK, E: '#2e2650', Y: '#ffe3a8' },
}

const STAR_GATE: Design = {
  art: [
    'GGGGGGGGGGGGG',
    'G.....Y.....G',
    'G.....Y.....G',
    'G....YYY....G',
    'G..YYYVYYY..G',
    'G...YVVVY...G',
    'G..YYYVYYY..G',
    'G....YYY....G',
    'G.....Y.....G',
    'G.....Y.....G',
    'G.V.......V.G',
    'G..Y.....Y..G',
    'GGGGGGGGGGGGG',
  ],
  colors: { G: BORDER, Y: '#ffe3a8', V: LAV },
}

const DESIGNS = [MOON_WITCH, COSMIC_EYE, STAR_GATE]

const themeId = ref('')
let observer: MutationObserver | null = null

onMounted(() => {
  const read = (): void => {
    themeId.value = document.documentElement.dataset.theme ?? ''
  }
  read()
  observer = new MutationObserver(read)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
})

onBeforeUnmount(() => observer?.disconnect())

function hashIdx(id: string): number {
  if (!id) return 0
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return h % DESIGNS.length
}

const design = computed<Design>(() => DESIGNS[hashIdx(themeId.value)]!)

interface Cell {
  x: number
  y: number
  c: string
}

const cells = computed<Cell[]>(() => {
  const out: Cell[] = []
  design.value.art.forEach((row, y) => {
    row.split('').forEach((ch, x) => {
      const c = design.value.colors[ch]
      if (c) out.push({ x, y, c })
    })
  })
  return out
})

const COLS = Math.max(...design.value.art.map((r) => r.length))
const ROWS = design.value.art.length
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

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

/**
 * 主题 → 牌背显式分配：按气质语义匹配且三款均衡（4/5/5）。
 * 未登记的未来主题自动落哈希兜底。
 */
const BACK_BY_THEME: Record<string, number> = {
  midnight: 0, // 经典紫金夜空配望月巫女
  dunhuang: 0,
  jade: 0,
  noir: 0, // 黑金塔罗配经典牌背
  inkpaper: 1, // 宣纸禅意配窥视之眼
  cyber: 1, // 赛博监控之眼
  goth: 1, // 哥特配窥视之眼
  aegean: 1, // 海洋文明的荷鲁斯之眼
  brass: 1, // 黄铜齿轮之眼
  candy: 2,
  aurora: 2, // 极光之门
  hanafuda: 2,
  abyss: 2,
  sakura: 2, // 夜樱配星芒之门
}

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

function pickDesign(id: string): number {
  return BACK_BY_THEME[id] ?? hashIdx(id)
}

const design = computed<Design>(() => DESIGNS[pickDesign(themeId.value)]!)

/**
 * 每套皮肤的专属染色覆盖（键为图案字符）。
 * 同一族图案（4/5/5 共用）靠它做出"一眼可辨"的差异：
 * 敦煌的朱砂驼金 / 玉色的青瓷 / noir 的月白墨色 / 赛博的荧光薄荷 / 哥特的暗紫血樱…
 * 浅色皮肤（inkpaper/sakura）同时解决金色在纸底上看不清的问题。
 */
const TINTS: Record<string, Record<string, string>> = {
  midnight: {},
  dunhuang: { H: '#a84a32', D: '#7c3322', L: '#e0a34e', S: '#ffe9c9' },
  jade: { H: '#2f7d6d', D: '#1f5548', L: '#7de8c3' },
  noir: { Y: '#d8d8e0', H: '#3c3c48', L: '#9a9ab0', D: '#23232c', S: '#ececf2' },
  inkpaper: { Y: '#b03131', V: '#3a3530' },
  cyber: { V: '#4de0c0', P: '#4de0c0' },
  goth: { V: '#8a5a9e', W: '#ddd0ea', P: '#c04a72' },
  aegean: { V: '#2e86ab', P: '#ff7fa5' },
  brass: { V: '#c98a3d', P: '#e0a34e' },
  candy: { V: '#ff6fae', Y: '#ff6fae' },
  aurora: {},
  hanafuda: { Y: '#e05a4e', V: '#2f7d4f' },
  abyss: { V: '#1f4e5f', Y: '#5ac8b8' },
  sakura: { V: '#ffb7d5', Y: '#e0567f' },
}

/** 当前生效的染色（含闪烁点颜色跟随主题点缀色） */
const tint = computed<Record<string, string>>(() => TINTS[themeId.value] ?? {})

interface Cell {
  x: number
  y: number
  c: string
}

const cells = computed<Cell[]>(() => {
  const out: Cell[] = []
  design.value.art.forEach((row, y) => {
    row.split('').forEach((ch, x) => {
      // 皮肤专属染色优先，其次图案自带配色
      const c = tint.value[ch] ?? design.value.colors[ch]
      if (c) out.push({ x, y, c })
    })
  })
  return out
})

/** 必须跟随 design 响应式变化，否则换肤后 viewBox 还是旧尺寸、牌背被压扁 */
const COLS = computed(() => Math.max(...design.value.art.map((r) => r.length)))
const ROWS = computed(() => design.value.art.length)
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

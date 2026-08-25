<script setup lang="ts">
/**
 * 像素牌面渲染器：把 arcanaArt 的字符画渲染成 SVG 像素图。
 * - 有精绘数据 → 渲染露娜画风像素场景
 * - 无数据 → 程序化占位：罗马数字 + 星阵（后续逐张补绘）
 */
import { computed } from 'vue'
import { ARCANA_PALETTE, getArcanaArt, type ArcanaArt } from '../data/arcanaArt'
import { getMinorArt } from '../data/minorArcanaArt'

const props = defineProps<{
  /** 大阿卡纳编号 0-21 */
  id?: number
  /** 或小阿卡纳牌 id（如 'wands-7'、'cups-queen'） */
  cardId?: string
  nameCn: string
  nameEn: string
  /** 显示宽度 px */
  size?: number
}>()

const ROMAN = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI']

const art = computed<ArcanaArt | null>(() => {
  if (props.cardId) return getMinorArt(props.cardId)
  if (typeof props.id === 'number') return getArcanaArt(props.id)
  return null
})
const numeral = computed(() => {
  if (props.cardId) return ''
  return ROMAN[props.id ?? -1] ?? ''
})

interface Pixel {
  x: number
  y: number
  fill: string
}

/** 字符画 → 像素块列表（自动按最长行对齐，短行右侧视为透明） */
const pixels = computed<Pixel[]>(() => {
  const a = art.value
  if (!a) return []
  const out: Pixel[] = []
  a.rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x]!
      if (ch === '.' || ch === ' ') continue
      const fill = ARCANA_PALETTE[ch]
      if (fill) out.push({ x, y, fill })
    }
  })
  return out
})

const gridW = computed(() => (art.value ? Math.max(...art.value.rows.map((r) => r.length)) : 21))

/** 占位图案的星点（无精绘时用） */
const fallbackStars = computed<Pixel[]>(() => {
  if (art.value) return []
  const pts: Pixel[] = []
  let seed = (props.cardId ? props.cardId.length * 31 : (props.id ?? 0)) * 2654435761
  const rnd = (): number => {
    seed = (seed ^ (seed << 13)) >>> 0
    seed = (seed ^ (seed >>> 17)) >>> 0
    seed = (seed ^ (seed << 5)) >>> 0
    return seed / 4294967296
  }
  for (let i = 0; i < 26; i++) {
    pts.push({
      x: Math.floor(rnd() * 19),
      y: Math.floor(rnd() * 28),
      fill: [ARCANA_PALETTE.G, ARCANA_PALETTE.L, ARCANA_PALETTE.W][i % 3]!,
    })
  }
  return pts
})

const W = 21
const H = 30
</script>

<template>
  <div class="pa-card" :style="{ width: (size ?? 120) + 'px' }">
    <svg :viewBox="`0 0 ${W} ${H}`" role="img" :aria-label="`${nameCn} ${nameEn}`" class="pa-svg">
      <rect x="0.4" y="0.4" :width="W - 0.8" :height="H - 0.8" rx="1.2" class="pa-bg" />
      <rect x="1.4" y="1.4" :width="W - 2.8" :height="H - 2.8" rx="0.8" fill="none" class="pa-frame" />
      <!-- 精绘像素 -->
      <g v-if="art">
        <rect
          v-for="(p, i) in pixels"
          :key="i"
          :x="p.x + (W - gridW) / 2"
          :y="p.y + 2.2"
          width="1.02"
          height="1.02"
          :fill="p.fill"
        />
      </g>
      <!-- 占位星阵 + 大数字 -->
      <g v-else>
        <rect
          v-for="(p, i) in fallbackStars"
          :key="'s' + i"
          :x="p.x + 1"
          :y="p.y + 2"
          width="0.7"
          height="0.7"
          :fill="p.fill"
          opacity="0.85"
        />
        <text :x="W / 2" :y="H / 2 + 2" text-anchor="middle" class="pa-numeral">{{ numeral }}</text>
      </g>
      <text :x="W / 2" :y="H - 1.6" text-anchor="middle" class="pa-label">{{ nameCn }}</text>
    </svg>
    <span class="pa-tag">{{ numeral }} · {{ nameEn }}</span>
  </div>
</template>

<style scoped>
.pa-card { display: inline-flex; flex-direction: column; gap: 5px; }
.pa-svg {
  width: 100%;
  image-rendering: pixelated;
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.35));
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.pa-card:hover .pa-svg { transform: translateY(-3px) rotate(-1.2deg); }
.pa-bg { fill: var(--void-1); stroke: var(--gold); stroke-width: 0.5; }
.pa-frame { stroke: var(--lavender); stroke-width: 0.3; opacity: 0.55; }
.pa-numeral {
  fill: var(--gold-bright);
  font-family: var(--serif);
  font-size: 9px;
}
.pa-label {
  fill: var(--gold);
  font-size: 2px;
  letter-spacing: 0.4px;
}
.pa-tag {
  font-family: var(--pixel);
  font-size: 0.48rem;
  color: var(--ink-dim);
  text-align: center;
}
@media (prefers-reduced-motion: reduce) {
  .pa-card:hover .pa-svg { transform: none; }
}
</style>

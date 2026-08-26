<script setup lang="ts">
/** 标题「解码」入场：字符乱码渐次落定（赛博感签名动效）
 *  - 监听 text 变化：切换语言时重新解码（此前不刷新的 bug 已修）
 *  - 读屏兼容：aria-label 提供真实文本，乱码仅作视觉层
 */
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = withDefaults(defineProps<{ text: string; speed?: number }>(), { speed: 34 })

const GLYPHS = '✦✧⋆☉☽☿♀♂♃♄♅♆ᚠᚢᚦᚨᚱᚲ'
const display = ref(props.text)
let raf = 0
let timer: number | null = null
let running = false

function stop(): void {
  running = false
  cancelAnimationFrame(raf)
  if (timer !== null) {
    window.clearTimeout(timer)
    timer = null
  }
}

function run(): void {
  stop()
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    display.value = props.text
    return
  }
  const chars = [...props.text]
  const settled = chars.map(() => false)
  let elapsed = 0
  let last = performance.now()
  running = true

  const tick = (): void => {
    if (!running) return
    const now = performance.now()
    elapsed += now - last
    last = now

    chars.forEach((_, i) => {
      // 从左到右逐字落定
      if (!settled[i]! && elapsed > 180 + i * props.speed) settled[i] = true
    })

    display.value = chars
      .map((ch, i) => {
        if (settled[i]! || ch === ' ') return ch
        return GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
      })
      .join('')

    if (settled.every(Boolean)) {
      display.value = props.text
      running = false
      return
    }
    // 节流：每 ~50ms 换一批乱码，避免每帧闪烁
    timer = window.setTimeout(() => {
      raf = requestAnimationFrame(tick)
    }, 50)
  }

  raf = requestAnimationFrame(tick)
}

onMounted(run)

watch(
  () => props.text,
  () => run(),
)

onBeforeUnmount(stop)
</script>

<template>
  <span class="decrypt-title" role="text" :aria-label="props.text">
    <span aria-hidden="true">{{ display }}</span>
  </span>
</template>

<style scoped>
.decrypt-title { white-space: pre-wrap; }
</style>

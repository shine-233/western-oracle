<script setup lang="ts">
/** 标题「解密」入场：字符从随机神秘符号逐位落定为真实文字 */
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = withDefaults(defineProps<{ text: string; speed?: number }>(), { speed: 34 })

const GLYPHS = '✦✧⋆☉☽☿♀♂♃♄♅♆♇♈♉♊♋♌♍♎♏♐♑♒♓ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ'
const display = ref(props.text)
let raf = 0
let timer: number | null = null

onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    display.value = props.text
    return
  }
  const chars = [...props.text]
  const settled = chars.map(() => false)
  let elapsed = 0
  let last = performance.now()

  const tick = (): void => {
    const now = performance.now()
    elapsed += now - last
    last = now

    chars.forEach((_, i) => {
      // 从左到右依次落定
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
      return
    }
    raf = requestAnimationFrame(slowTick)
  }

  // 随机符号每 ~50ms 换一批，避免每帧闪烁过快
  const slowTick = (): void => {
    timer = window.setTimeout(tick, 50)
  }

  raf = requestAnimationFrame(tick)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  if (timer !== null) window.clearTimeout(timer)
})
</script>

<template>
  <span class="decrypt-title">{{ display }}</span>
</template>

<style scoped>
.decrypt-title { white-space: pre-wrap; }
</style>

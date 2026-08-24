<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import PixelWitch from './components/PixelWitch.vue'

let lastTrail = 0
let trailCount = 0
let raf = 0

function onMouseMove(e: MouseEvent): void {
  const now = performance.now()
  if (now - lastTrail < 55 || trailCount > 30) return
  lastTrail = now

  raf = requestAnimationFrame(() => {
    const el = document.createElement('span')
    el.className = 'cursor-trail'
    el.textContent = Math.random() < 0.5 ? '✧' : '⋆'
    el.style.left = `${e.clientX + (Math.random() - 0.5) * 14}px`
    el.style.top = `${e.clientY + (Math.random() - 0.5) * 14}px`
    document.body.appendChild(el)
    trailCount++
    window.setTimeout(() => {
      el.remove()
      trailCount--
    }, 620)
  })
}

onMounted(() => {
  const fine = window.matchMedia('(pointer: fine)').matches
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (fine && !reduced) {
    window.addEventListener('mousemove', onMouseMove, { passive: true })
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onMouseMove)
  if (raf) cancelAnimationFrame(raf)
})
</script>

<template>
  <header class="site-header">
    <RouterLink to="/" class="brand">🧙‍♀️ 神谕<span class="en">WESTERN ORACLE</span></RouterLink>
    <nav class="site-nav">
      <RouterLink to="/tarot">塔罗</RouterLink>
      <RouterLink to="/astrology">占星</RouterLink>
      <RouterLink to="/synastry">合盘</RouterLink>
      <RouterLink to="/transits">行运</RouterLink>
      <RouterLink to="/numerology">灵数</RouterLink>
      <RouterLink to="/runes">符文</RouterLink>
      <RouterLink to="/settings">设置</RouterLink>
    </nav>
  </header>

  <main>
    <RouterView v-slot="{ Component }">
      <Transition name="page" mode="out-in">
        <component :is="Component" />
      </Transition>
    </RouterView>
  </main>

  <footer class="site-footer">
    <p>✦ 所有计算均在你的浏览器本地完成，不上传任何数据 ✦</p>
    <p>本站内容用于文化与娱乐目的，请理性看待占卜结果。牌面为 1909 年公版 Rider-Waite-Smith 插图。</p>
  </footer>

  <PixelWitch />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import PixelWitch from './components/PixelWitch.vue'
import { isSoundOn, toggleSound } from './lib/sfx'

const soundOn = ref(isSoundOn())

function onToggleSound(): void {
  soundOn.value = toggleSound()
}

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

/** 随机流星 */
let starTimer: number | null = null
function scheduleShootingStar(): void {
  starTimer = window.setTimeout(() => {
    spawnShootingStar()
    scheduleShootingStar()
  }, 7000 + Math.random() * 8000)
}
function spawnShootingStar(): void {
  const el = document.createElement('span')
  el.className = 'shooting-star'
  el.style.left = `${-60 + Math.random() * 40}vw`
  el.style.top = `${5 + Math.random() * 35}vh`
  document.body.appendChild(el)
  window.setTimeout(() => el.remove(), 1300)
}

/** 彩蛋：露娜骑扫帚横穿屏幕 */
const BROOM_SVG = `<svg width="120" height="44" viewBox="0 0 30 11" shape-rendering="crispEdges">
  <rect x="2" y="7" width="16" height="1" fill="#8a5a3b"/><rect x="0" y="6" width="3" height="3" fill="#d9a05b"/><rect x="1" y="5" width="2" height="5" fill="#d9a05b"/>
  <rect x="16" y="4" width="6" height="3" fill="#5a4bbf"/><rect x="20" y="2" width="3" height="6" fill="#6b5bd6"/><rect x="22" y="0" width="4" height="3" fill="#6b5bd6"/><rect x="25" y="1" width="2" height="1" fill="#f5c86e"/>
  <rect x="17" y="3" width="4" height="1" fill="#ffdcc5"/><rect x="18" y="3" width="1" height="1" fill="#3a2e5c"/>
</svg>`
let broomTimer: number | null = null
function scheduleBroomFlight(): void {
  broomTimer = window.setTimeout(() => {
    spawnBroomFlight()
    scheduleBroomFlight()
  }, 60000 + Math.random() * 60000)
}
function spawnBroomFlight(): void {
  const el = document.createElement('div')
  el.className = 'broom-flight'
  el.innerHTML = BROOM_SVG
  el.style.top = `${8 + Math.random() * 40}vh`
  if (Math.random() < 0.5) {
    el.style.animationName = 'fly-across'
  } else {
    el.style.animationName = 'fly-across-flip'
    el.style.right = '0px'
  }
  document.body.appendChild(el)
  window.setTimeout(() => el.remove(), 8000)
}

onMounted(() => {
  const fine = window.matchMedia('(pointer: fine)').matches
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (fine && !reduced) {
    window.addEventListener('mousemove', onMouseMove, { passive: true })
  }
  if (!reduced) {
    scheduleShootingStar()
    scheduleBroomFlight()
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onMouseMove)
  if (raf) cancelAnimationFrame(raf)
  if (starTimer !== null) window.clearTimeout(starTimer)
  if (broomTimer !== null) window.clearTimeout(broomTimer)
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
      <button class="sound-toggle" :title="soundOn ? '关闭音效' : '开启音效'" @click="onToggleSound">
        {{ soundOn ? '🔊' : '🔇' }}
      </button>
    </nav>
  </header>

  <main>
    <RouterView v-slot="{ Component }">
      <Transition name="page">
        <component :is="Component" :key="$route.fullPath" />
      </Transition>
    </RouterView>
  </main>

  <footer class="site-footer">
    <p>✦ 所有计算均在你的浏览器本地完成，不上传任何数据 ✦</p>
    <p>本站内容用于文化与娱乐目的，请理性看待占卜结果。牌面为 1909 年公版 Rider-Waite-Smith 插图。</p>
  </footer>

  <PixelWitch />
</template>

<style scoped>
.sound-toggle {
  background: var(--void-2);
  border: 2px solid rgba(179, 166, 247, 0.5);
  border-radius: 0;
  color: var(--ink);
  cursor: pointer;
  font-size: 0.95rem;
  padding: 5px 10px;
  transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.2s;
}
.sound-toggle:hover { transform: scale(1.12) rotate(-6deg); border-color: var(--pink); }
</style>

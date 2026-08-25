<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import PixelWitch from './components/PixelWitch.vue'
import { isSoundOn, toggleSound, sfx } from './lib/sfx'
import { t, toggleLocale, locale } from './lib/i18n'

const soundOn = ref(isSoundOn())

function onToggleSound(): void {
  soundOn.value = toggleSound()
}

function onToggleLocale(): void {
  toggleLocale()
  sfx.blip()
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

  // 星野视差：三层星星以不同深度跟随鼠标
  const px = (e.clientX / window.innerWidth - 0.5).toFixed(3)
  const py = (e.clientY / window.innerHeight - 0.5).toFixed(3)
  document.documentElement.style.setProperty('--par-x', px)
  document.documentElement.style.setProperty('--par-y', py)
}

onMounted(() => {
  const fine = window.matchMedia('(pointer: fine)').matches
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (fine && !reduced) {
    window.addEventListener('mousemove', onMouseMove, { passive: true })
  }
  if (!reduced) scheduleShootingStar()
})

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

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onMouseMove)
  if (raf) cancelAnimationFrame(raf)
  if (starTimer !== null) window.clearTimeout(starTimer)
})
</script>

<template>
  <!-- 全屏星野背景（三层视差） -->
  <div class="starfield" aria-hidden="true">
    <div class="star-layer l1" />
    <div class="star-layer l2" />
    <div class="star-layer l3" />
    <div class="nebula n1" />
    <div class="nebula n2" />
  </div>

  <header class="site-header">
    <RouterLink to="/" class="brand">🧙‍♀️ {{ t('app.brand') }}<span class="en">WESTERN ORACLE</span></RouterLink>
    <nav class="site-nav">
      <RouterLink to="/tarot">{{ t('nav.tarot') }}</RouterLink>
      <RouterLink to="/astrology">{{ t('nav.astrology') }}</RouterLink>
      <RouterLink to="/synastry">{{ t('nav.synastry') }}</RouterLink>
      <RouterLink to="/transits">{{ t('nav.transits') }}</RouterLink>
      <RouterLink to="/numerology">{{ t('nav.numerology') }}</RouterLink>
      <RouterLink to="/runes">{{ t('nav.runes') }}</RouterLink>
      <RouterLink to="/library">{{ t('nav.library') }}</RouterLink>
      <RouterLink to="/history">{{ t('nav.history') }}</RouterLink>
      <RouterLink to="/settings">{{ t('nav.settings') }}</RouterLink>
      <button class="lang-toggle" :title="locale === 'zh' ? 'Switch to English' : '切换到中文'" @click="onToggleLocale">
        {{ locale === 'zh' ? 'EN' : '中' }}
      </button>
      <button class="sound-toggle" :title="soundOn ? t('app.soundOff') : t('app.soundOn')" @click="onToggleSound">
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
    <p>{{ t('footer.l1') }}</p>
    <p>{{ t('footer.l2') }}</p>
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
.lang-toggle {
  background: var(--void-2);
  border: 2px solid rgba(245, 200, 110, 0.55);
  border-radius: 0;
  color: var(--gold-bright);
  cursor: pointer;
  font-family: var(--pixel);
  font-size: 0.6rem;
  padding: 6px 8px;
  letter-spacing: 0.08em;
  transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.2s;
}
.lang-toggle:hover { transform: scale(1.1); border-color: var(--gold-bright); }
</style>

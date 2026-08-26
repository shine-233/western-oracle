<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import PixelWitch from './components/PixelWitch.vue'
import { isSoundOn, toggleSound, sfx } from './lib/sfx'
import { t, toggleLocale, locale } from './lib/i18n'
import { tt } from './lib/i18nExtra'
import { vtActive } from './lib/viewTrans'

interface NavItem { to: string; label: string; emoji: string; extra?: boolean }
const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: 'navg.divine',
    items: [
      { to: '/tarot', label: 'nav.tarot', emoji: '✦' },
      { to: '/astrology', label: 'nav.astrology', emoji: '☉' },
      { to: '/synastry', label: 'nav.synastry', emoji: '☍' },
      { to: '/numerology', label: 'nav.numerology', emoji: '∴' },
      { to: '/transits', label: 'nav.transits', emoji: '⟳' },
    ],
  },
  {
    label: 'navg.oracle',
    items: [
      { to: '/runes', label: 'nav.runes', emoji: 'ᛟ' },
      { to: '/palmistry', label: 'nav.palmistry', emoji: '🖐' },
      { to: '/dreams', label: 'nav.dreams', emoji: '🌙' },
      { to: '/pendulum', label: 'nav.pendulum', emoji: '🜨' },
      { to: '/crystal', label: 'crystal.nav', emoji: '🔮', extra: true },
    ],
  },
  {
    label: 'navg.sky',
    items: [
      { to: '/orrery', label: 'nav.orrery', emoji: '🪐' },
      { to: '/hours', label: 'hours.nav', emoji: '⏳', extra: true },
      { to: '/moonbreath', label: 'nav.moonbreath', emoji: '🌕' },
      { to: '/biorhythm', label: 'nav.biorhythm', emoji: '📈' },
    ],
  },
  {
    label: 'navg.play',
    items: [
      { to: '/arcade', label: 'nav.arcade', emoji: '🎲' },
      { to: '/musicbox', label: 'nav.musicbox', emoji: '✦' },
      { to: '/library', label: 'nav.library', emoji: '📖' },
    ],
  },
  {
    label: 'navg.east',
    items: [{ to: '/meihua', label: 'nav.meihua', emoji: '☯' }],
  },
]

const soundOn = ref(isSoundOn())

/** 顶部滚动进度条 */
const progress = ref(0)
let progRaf = 0
function onScroll(): void {
  if (progRaf) return
  progRaf = requestAnimationFrame(() => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    progress.value = max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0
    progRaf = 0
  })
}

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
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('scroll', onScroll)
  if (raf) cancelAnimationFrame(raf)
  if (progRaf) cancelAnimationFrame(progRaf)
  if (starTimer !== null) window.clearTimeout(starTimer)
  if (broomTimer !== null) window.clearTimeout(broomTimer)
})
</script>

<template>
  <!-- 顶部滚动进度条 -->
  <div class="scroll-progress" aria-hidden="true">
    <i :style="{ width: progress + '%' }" />
  </div>

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
      <div v-for="g in NAV_GROUPS" :key="g.label" class="nav-group">
        <button type="button" class="nav-trigger" :aria-label="t(g.label)">
          <span>{{ t(g.label) }}</span><i class="caret" aria-hidden="true">▾</i>
        </button>
        <div class="nav-menu">
          <RouterLink v-for="m in g.items" :key="m.to" :to="m.to">
            <span class="mi" aria-hidden="true">{{ m.emoji }}</span>{{ m.extra ? tt(m.label) : t(m.label) }}
          </RouterLink>
        </div>
      </div>
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
      <Transition :name="vtActive ? 'vt-off' : 'page'">
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
.scroll-progress {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  z-index: 9999;
  background: rgba(13, 11, 32, 0.6);
  pointer-events: none;
}
.scroll-progress i {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, var(--gold), var(--pink), var(--lavender));
  box-shadow: 0 0 10px color-mix(in srgb, var(--gold) 80%, transparent);
  transition: width 0.12s linear;
}

.sound-toggle {
  background: var(--void-2);
  border: 2px solid color-mix(in srgb, var(--lavender) 50%, transparent);
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
  border: 2px solid color-mix(in srgb, var(--gold) 55%, transparent);
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
